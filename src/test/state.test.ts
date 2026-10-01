import { describe, expect, it } from 'vitest'
import { canShowSummary, initialState, siteReducer } from '../site/state'
import type { RunResult, Scenario, SiteAction, SiteState } from '../site/types'

function apply(state: SiteState, ...actions: SiteAction[]): SiteState {
  return actions.reduce(siteReducer, state)
}

function result(scenario: Scenario): RunResult {
  return { scenario }
}

function run(scenario: Scenario): SiteAction[] {
  return [
    { type: 'RUN_STARTED', scenario },
    { type: 'RUN_FINISHED', result: result(scenario) },
  ]
}

const onSimulate = apply(
  initialState,
  { type: 'START' },
  { type: 'SET_MESSAGE', message: 'Meet me at 5 PM' },
  { type: 'GO', screen: 'simulate' },
)

describe('initial state', () => {
  it('starts on the intro with nothing stored', () => {
    expect(initialState).toEqual({
      screen: 'intro',
      message: '',
      activeRun: null,
      runCount: 0,
      results: {},
    })
  })
})

describe('START', () => {
  it('moves from intro to message', () => {
    expect(apply(initialState, { type: 'START' }).screen).toBe('message')
  })

  it('does nothing outside the intro', () => {
    expect(apply(onSimulate, { type: 'START' })).toBe(onSimulate)
  })
})

describe('GO', () => {
  it('blocks Simulate while the message is empty or blank', () => {
    const onMessage = apply(initialState, { type: 'START' })
    expect(apply(onMessage, { type: 'GO', screen: 'simulate' }).screen).toBe('message')
    expect(
      apply(onMessage, { type: 'SET_MESSAGE', message: '   ' }, { type: 'GO', screen: 'simulate' }).screen,
    ).toBe('message')
  })

  it('blocks Simulate for real-looking data or an over-long message', () => {
    const onMessage = apply(initialState, { type: 'START' })
    for (const message of ['riya@example.com', '9876543210', 'password: x', 'x'.repeat(41)]) {
      expect(apply(onMessage, { type: 'SET_MESSAGE', message }, { type: 'GO', screen: 'simulate' }).screen).toBe(
        'message',
      )
    }
  })

  it('allows Simulate once there is a message', () => {
    expect(onSimulate.screen).toBe('simulate')
    expect(onSimulate.message).toBe('Meet me at 5 PM')
  })

  it('moves on to Summary once Insecure + VPN are done', () => {
    const done = apply(onSimulate, ...run('insecure'), ...run('vpn'))
    const summary = apply(done, { type: 'GO', screen: 'summary' })
    expect(summary.screen).toBe('summary')
    expect(summary.results).toBe(done.results) // the table uses this visitor's results
  })

  it('returns the same state when already on the screen', () => {
    expect(apply(onSimulate, { type: 'GO', screen: 'simulate' })).toBe(onSimulate)
  })

  it('abandons a run in progress when leaving Simulate', () => {
    const done = apply(onSimulate, ...run('insecure'), ...run('vpn'))
    const running = apply(done, { type: 'RUN_STARTED', scenario: 'https' })
    const left = apply(running, { type: 'GO', screen: 'summary' })
    expect(left.screen).toBe('summary')
    expect(left.activeRun).toBeNull()
  })
})

describe('Summary lock (Insecure + VPN required)', () => {
  const cases: [string, Scenario[], boolean][] = [
    ['no runs', [], false],
    ['Insecure only', ['insecure'], false],
    ['VPN only', ['vpn'], false],
    ['HTTPS only', ['https'], false],
    ['Insecure + HTTPS', ['insecure', 'https'], false],
    ['HTTPS + VPN', ['https', 'vpn'], false],
    ['Insecure + VPN', ['insecure', 'vpn'], true],
    ['VPN then Insecure', ['vpn', 'insecure'], true],
    ['all three', ['insecure', 'https', 'vpn'], true],
  ]

  it.each(cases)('%s → unlocked: %s', (_label, scenarios, unlocked) => {
    const state = apply(onSimulate, ...scenarios.flatMap(run))
    expect(canShowSummary(state)).toBe(unlocked)
    expect(apply(state, { type: 'GO', screen: 'summary' }).screen).toBe(unlocked ? 'summary' : 'simulate')
  })
})

describe('runs', () => {
  it('RUN_STARTED sets the active run with an increasing runId', () => {
    const first = apply(onSimulate, { type: 'RUN_STARTED', scenario: 'insecure' })
    expect(first.activeRun).toEqual({ scenario: 'insecure', runId: 1 })
    const second = apply(first, { type: 'RUN_FINISHED', result: result('insecure') }, {
      type: 'RUN_STARTED',
      scenario: 'insecure',
    })
    expect(second.activeRun).toEqual({ scenario: 'insecure', runId: 2 })
  })

  it('ignores RUN_STARTED while a run is active (button mashing)', () => {
    const running = apply(onSimulate, { type: 'RUN_STARTED', scenario: 'insecure' })
    expect(apply(running, { type: 'RUN_STARTED', scenario: 'vpn' })).toBe(running)
  })

  it('ignores RUN_STARTED outside Simulate', () => {
    const onMessage = apply(initialState, { type: 'START' })
    expect(apply(onMessage, { type: 'RUN_STARTED', scenario: 'vpn' })).toBe(onMessage)
  })

  it('RUN_FINISHED stores the result and clears the active run', () => {
    const state = apply(onSimulate, ...run('https'))
    expect(state.activeRun).toBeNull()
    expect(state.results.https).toEqual(result('https'))
  })

  it('ignores RUN_FINISHED for a scenario that is not running', () => {
    const running = apply(onSimulate, { type: 'RUN_STARTED', scenario: 'insecure' })
    expect(apply(running, { type: 'RUN_FINISHED', result: result('vpn') })).toBe(running)
    expect(apply(onSimulate, { type: 'RUN_FINISHED', result: result('vpn') })).toBe(onSimulate)
  })

  it('a replay overwrites the earlier result', () => {
    const replayed: RunResult = { scenario: 'vpn' }
    const state = apply(onSimulate, ...run('vpn'), { type: 'RUN_STARTED', scenario: 'vpn' }, {
      type: 'RUN_FINISHED',
      result: replayed,
    })
    expect(state.results.vpn).toBe(replayed) // the newer result object replaces the older one
  })
})
