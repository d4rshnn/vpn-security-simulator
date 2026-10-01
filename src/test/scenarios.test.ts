import { describe, expect, it } from 'vitest'
import { copy } from '../content/copy'
import { ADDRESSES, ROUTES, SCENARIO_ROUTE } from '../simulation/network'
import { buildScenario, captionText, firstCaption, frameAt, snooperSees, type MotionStep } from '../simulation/scenarios'
import { totalDuration } from '../simulation/timeline'
import type { Scenario } from '../site/types'

const SCENARIOS: Scenario[] = ['insecure', 'https', 'vpn']
const end = (s: Scenario) => totalDuration(buildScenario(s))
const kinds = (s: Scenario) => buildScenario(s).map((step) => step.kind)
const find = <K extends MotionStep['kind']>(s: Scenario, kind: K) =>
  buildScenario(s).find((x): x is Extract<MotionStep, { kind: K }> => x.kind === kind)
const arrival = (s: Scenario, segment: string) => {
  const m = buildScenario(s).find((x) => x.kind === 'move' && x.segment === segment)!
  return m.at + m.dur
}

describe('postal scripts (spec §I, Rev 5)', () => {
  it.each(SCENARIOS)('%s: steps are in time order', (s) => {
    const ats = buildScenario(s).map((step) => step.at)
    expect(ats).toEqual([...ats].sort((a, b) => a - b))
  })

  it.each(SCENARIOS)('%s: the item follows its route in order', (s) => {
    const moves = buildScenario(s).flatMap((step) => (step.kind === 'move' ? [step.segment] : []))
    expect(moves).toEqual(ROUTES[SCENARIO_ROUTE[s]])
  })

  it.each(SCENARIOS)('%s: the message is written on the postcard first, and a ghost copy goes to the snooper', (s) => {
    expect(kinds(s)[1]).toBe('write')
    expect(kinds(s)).toContain('ghost')
  })

  it('lasts about 11 / 12 / 18 s', () => {
    expect(end('insecure')).toBeCloseTo(11, 0)
    expect(end('https')).toBeCloseTo(12, 0)
    expect(end('vpn')).toBeCloseTo(18, 0)
  })

  it('HTTP stays a postcard; HTTPS seals the blue envelope; VPN = HTTPS + the teal outer envelope + tunnel', () => {
    expect(kinds('insecure')).not.toContain('seal')
    expect(kinds('insecure')).not.toContain('wrap')
    expect(kinds('https')).toContain('seal')
    expect(kinds('https')).not.toContain('wrap')
    expect(kinds('vpn')).toEqual(expect.arrayContaining(['seal', 'wrap', 'unwrap', 'tunnel']))
    expect(kinds('https')).not.toContain('tunnel')
  })

  it('VPN: the blue envelope is sealed first, then wrapped in the teal one, before leaving You', () => {
    const seal = find('vpn', 'seal')!
    const wrap = find('vpn', 'wrap')!
    const firstMove = find('vpn', 'move')!
    expect(wrap.at).toBeGreaterThanOrEqual(seal.at + seal.dur)
    expect(firstMove.at).toBeGreaterThanOrEqual(wrap.at + wrap.dur)
    const f = frameAt(buildScenario('vpn'), firstMove.at)
    expect(f.sealed).toBe(1)
    expect(f.wrapped).toBe(1)
  })
})

describe('accuracy contract (spec §H, Rev 5 postal model)', () => {
  const message = 'Order: 2 large pizzas'
  const views = Object.fromEntries(SCENARIOS.map((s) => [s, snooperSees(s, message)])) as Record<
    Scenario,
    ReturnType<typeof snooperSees>
  >

  it('the snooper can read the message ONLY in HTTP (a postcard)', () => {
    expect(views.insecure.readable).toBe(true)
    expect(views.insecure.message).toBe(message)
    for (const s of ['https', 'vpn'] as const) {
      expect(views[s].readable).toBe(false)
      expect(views[s].message).toBeNull()
      expect(JSON.stringify(views[s])).not.toContain(message)
    }
  })

  it('the snooper sees "To: VPN server" ONLY in VPN; "To: vjti-chat.example" in HTTPS', () => {
    expect(copy.diagram.envelopeTo(views.vpn.address!)).toBe('To: VPN server')
    expect(copy.diagram.envelopeTo(views.https.address!)).toBe('To: vjti-chat.example')
    expect(views.https.address).toBe(ADDRESSES.destHost)
    expect(views.insecure.address).toBeNull()
    for (const s of ['insecure', 'https'] as const) expect(JSON.stringify(views[s])).not.toContain(copy.diagram.vpn)
    expect(views.vpn.address).not.toBe(ADDRESSES.destHost) // the inner address stays hidden from the snooper
  })

  it('the snooper notices traffic in ALL three scenarios', () => {
    for (const s of SCENARIOS) {
      expect(views[s].noticed).toBe(true)
      const ghost = find(s, 'ghost')!
      expect(frameAt(buildScenario(s), ghost.at).detected).toBe(true)
      expect(frameAt(buildScenario(s), end(s)).detected).toBe(true)
    }
    expect(copy.bubble.noticed).toBe('Noticed traffic')
  })

  it('only VPN adds the "still sees" note', () => {
    expect(views.vpn.canStillSeeNote).toBe(true)
    expect(views.https.canStillSeeNote).toBe(false)
    expect(views.insecure.canStillSeeNote).toBe(false)
  })

  it('the HTTPS envelope is opened at the destination server in BOTH the HTTPS and VPN runs', () => {
    for (const s of ['https', 'vpn'] as const) {
      const open = find(s, 'open')!
      expect(open.node).toBe('dest')
      expect(open.at).toBeCloseTo(arrival(s, s === 'https' ? 'router-dest' : 'vpn-dest'))
      expect(frameAt(buildScenario(s), open.at - 0.1).sealed).toBe(1)
      expect(frameAt(buildScenario(s), open.at + open.dur).sealed).toBe(0)
    }
  })

  it('the VPN outer envelope is opened at the VPN server', () => {
    const unwrap = find('vpn', 'unwrap')!
    expect(unwrap.node).toBe('vpn')
    expect(unwrap.at).toBeCloseTo(arrival('vpn', 'router-vpn'))
    expect(frameAt(buildScenario('vpn'), unwrap.at - 0.1).wrapped).toBe(1)
    expect(frameAt(buildScenario('vpn'), unwrap.at + unwrap.dur).wrapped).toBe(0)
  })

  it('the inner (HTTPS) envelope is NEVER opened at the VPN server: still sealed until the destination', () => {
    const steps = buildScenario('vpn')
    const unwrap = find('vpn', 'unwrap')!
    const open = find('vpn', 'open')!
    expect(open.at).toBeGreaterThanOrEqual(arrival('vpn', 'vpn-dest'))
    for (let t = unwrap.at; t < open.at; t += 0.1) expect(frameAt(steps, t).sealed).toBe(1)
  })

  it("the real item's router pause is ≤ 0.3 s in all scenarios (snooping is passive)", () => {
    for (const s of SCENARIOS) {
      const moves = buildScenario(s).filter((x): x is Extract<MotionStep, { kind: 'move' }> => x.kind === 'move')
      const intoRouter = moves.find((m) => m.segment === 'you-router')!
      const outOfRouter = moves[moves.indexOf(intoRouter) + 1]
      const pause = outOfRouter.at - (intoRouter.at + intoRouter.dur)
      expect(pause).toBeGreaterThanOrEqual(0)
      expect(pause).toBeLessThanOrEqual(0.3 + 1e-9)
      const ghost = find(s, 'ghost')!
      expect(outOfRouter.at).toBeLessThan(ghost.at + ghost.dur) // leaves while the copy is still sliding
    }
  })

  it('the snooper only ever copies a sealed envelope in HTTPS and VPN (the teal one in VPN)', () => {
    for (const s of ['https', 'vpn'] as const) {
      const ghost = find(s, 'ghost')!
      for (let t = ghost.at; t <= ghost.at + ghost.dur; t += 0.1) {
        const f = frameAt(buildScenario(s), t)
        expect(f.sealed).toBe(1)
        expect(f.wrapped).toBe(s === 'vpn' ? 1 : 0)
      }
    }
  })
})

describe('frameAt', () => {
  it('starts as a blank postcard at You with nothing noticed', () => {
    for (const s of SCENARIOS) {
      const f = frameAt(buildScenario(s), 0)
      expect(f.item).toEqual({ segment: 'you-router', t: 0, opacity: 1 })
      expect(f.sealed).toBe(0)
      expect(f.wrapped).toBe(0)
      expect(f.written).toBeLessThan(0.1)
      expect(f.detected).toBe(false)
    }
  })

  it('writes the message before sealing it', () => {
    for (const s of ['https', 'vpn'] as const) {
      const seal = find(s, 'seal')!
      expect(frameAt(buildScenario(s), seal.at).written).toBe(1)
    }
  })

  it('ends delivered, noticed and as a readable postcard', () => {
    for (const s of SCENARIOS) {
      const f = frameAt(buildScenario(s), end(s))
      expect(f.captured).toBe(true)
      expect(f.delivered).toBe(1)
      expect(f.sealed).toBe(0)
      expect(f.wrapped).toBe(0)
      expect(f.item.t).toBe(1)
      expect(f.ghost).toBeNull()
    }
  })

  it('HTTP is never sealed', () => {
    for (let t = 0; t <= end('insecure'); t += 0.25) expect(frameAt(buildScenario('insecure'), t).sealed).toBe(0)
  })

  it('VPN: the tunnel draws in before the item enters it', () => {
    const steps = buildScenario('vpn')
    const tunnel = find('vpn', 'tunnel')!
    expect(frameAt(steps, tunnel.at - 0.1).tunnel).toBe(0)
    expect(frameAt(steps, tunnel.at + tunnel.dur / 2).tunnel).toBeCloseTo(0.5)
    expect(frameAt(steps, find('vpn', 'move')!.at).tunnel).toBeCloseTo(1)
  })

  it('reduced motion: moves fade out and back in instead of sliding', () => {
    const steps = buildScenario('insecure')
    expect(frameAt(steps, 1.2 + 1.2, true).item.opacity).toBeCloseTo(0)
    expect(frameAt(steps, 1.2 + 0.6, true).item.t).toBe(0)
    expect(frameAt(steps, 1.2 + 1.8, true).item.t).toBe(1)
  })
})

describe('captions and bubble reveals (spec §I)', () => {
  const ORDER: Record<Scenario, string[]> = {
    insecure: ['packed', 'wifi', 'captured', 'readable', 'arrives', 'next'],
    https: ['start', 'encrypt', 'wifi', 'snooper', 'decrypt', 'next'],
    vpn: ['start', 'encrypt', 'wrap', 'wrapAddress', 'tunnel', 'wifi', 'snooper', 'decrypt', 'trust', 'regular', 'open', 'next'],
  }

  it.each(SCENARIOS)('%s: every §I caption, in order, from copy.ts', (s) => {
    const keys = buildScenario(s).flatMap((x) => (x.kind === 'caption' ? [x.key] : []))
    expect(keys).toEqual(ORDER[s])
    for (const key of keys) expect(captionText(s, key)).toBeTruthy()
    expect(firstCaption(s)).toBe(captionText(s, ORDER[s][0]))
  })

  it('VPN captions say the VPN server sees vjti-chat.example but not the message, and to trust the provider', () => {
    expect(copy.captions.vpn.decrypt).toContain('vjti-chat.example')
    expect(copy.captions.vpn.decrypt).toContain('not your message')
    expect(copy.captions.vpn.trust).toContain('trust your VPN provider')
  })

  it.each(SCENARIOS)('%s: bubble content appears only after the ghost copy arrives', (s) => {
    const steps = buildScenario(s)
    const ghost = find(s, 'ghost')!
    const reveals = steps.filter((x): x is Extract<MotionStep, { kind: 'reveal' }> => x.kind === 'reveal')
    expect(reveals[0].at).toBeGreaterThanOrEqual(ghost.at + ghost.dur)
    const fields = reveals.map((r) => r.field)
    expect(fields).toEqual(s === 'insecure' ? ['content'] : s === 'https' ? ['address', 'content'] : ['address', 'content', 'note'])
    expect(frameAt(steps, ghost.at + ghost.dur - 0.01).revealed.size).toBe(0)
    expect(frameAt(steps, end(s)).revealed.size).toBe(reveals.length)
  })
})
