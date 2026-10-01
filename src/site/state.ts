import { MAX_MESSAGE_LENGTH } from '../content/samples'
import { looksSensitive } from '../simulation/realDataCheck'
import type { SiteAction, SiteState } from './types'

// Reset is not an action: main.tsx remounts <App> with a new sessionKey.

export const initialState: SiteState = {
  screen: 'intro',
  message: '',
  activeRun: null,
  runCount: 0,
  results: {},
}

/** True when the message may be sent: non-blank, within the limit, and not real-looking data. */
export function isMessageAllowed(message: string): boolean {
  return message.trim() !== '' && message.length <= MAX_MESSAGE_LENGTH && looksSensitive(message) === null
}

/** Summary unlocks once the Insecure and VPN runs are done (HTTPS is optional). */
export function canShowSummary(state: SiteState): boolean {
  return Boolean(state.results.insecure && state.results.vpn)
}

export function siteReducer(state: SiteState, action: SiteAction): SiteState {
  switch (action.type) {
    case 'START':
      return state.screen === 'intro' ? { ...state, screen: 'message' } : state

    case 'SET_MESSAGE':
      return { ...state, message: action.message }

    case 'GO': {
      const { screen } = action
      if (screen === state.screen) return state
      if (screen === 'simulate' && !isMessageAllowed(state.message)) return state
      if (screen === 'summary' && !canShowSummary(state)) return state
      // Leaving Simulate abandons any run in progress.
      return { ...state, screen, activeRun: null }
    }

    case 'RUN_STARTED': {
      if (state.screen !== 'simulate' || state.activeRun) return state
      const runId = state.runCount + 1
      return { ...state, runCount: runId, activeRun: { scenario: action.scenario, runId } }
    }

    case 'RUN_FINISHED': {
      const { result } = action
      if (state.activeRun?.scenario !== result.scenario) return state
      return {
        ...state,
        activeRun: null,
        results: { ...state.results, [result.scenario]: result },
      }
    }
  }
}
