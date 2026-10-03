import { describe, expect, it } from 'vitest'
import { copy } from '../content/copy'
import { ADDRESSES, ROUTES, SCENARIO_ROUTE } from '../simulation/network'
import {
  buildScenario,
  captionText,
  firstCaption,
  frameAt,
  READING,
  readingTime,
  snooperSees,
  type MotionStep,
} from '../simulation/scenarios'
import { SAMPLE_MESSAGES } from '../content/samples'
import { randomBytes } from '../simulation/simulatedBytes'
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

  it('lasts about 16 / 16 / 33 s (paced for reading)', () => {
    expect(end('insecure')).toBeGreaterThan(14)
    expect(end('insecure')).toBeLessThan(18)
    expect(end('https')).toBeGreaterThan(14)
    expect(end('https')).toBeLessThan(18)
    expect(end('vpn')).toBeGreaterThan(29)
    expect(end('vpn')).toBeLessThan(37)
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
    const hop = find('insecure', 'move')!
    expect(frameAt(steps, hop.at + hop.dur * 0.5, true).item.opacity).toBeCloseTo(0)
    expect(frameAt(steps, hop.at + hop.dur * 0.25, true).item.t).toBe(0)
    expect(frameAt(steps, hop.at + hop.dur * 0.75, true).item.t).toBe(1)
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
    expect(fields).toEqual(
      s === 'insecure'
        ? ['content']
        : s === 'https'
          ? ['address', 'content', 'bytes']
          : ['address', 'content', 'bytes', 'note'],
    )
    expect(frameAt(steps, ghost.at + ghost.dur - 0.01).revealed.size).toBe(0)
    expect(frameAt(steps, end(s)).revealed.size).toBe(reveals.length)
  })
})

describe('snooper bubble bytes (simulated encryption)', () => {
  it('HTTP: the bubble still shows the readable message and no bytes', () => {
    for (const message of SAMPLE_MESSAGES) {
      const v = snooperSees('insecure', message, randomBytes(message))
      expect(v.readable).toBe(true)
      expect(v.message).toBe(message)
      expect(v.inside).toBeNull()
    }
  })

  it('HTTPS and VPN: \'Inside\' shows only the captured bytes (at most 6 pairs), never the message', () => {
    for (const s of ['https', 'vpn'] as const) {
      for (const message of SAMPLE_MESSAGES) {
        for (let run = 0; run < 25; run++) {
          const v = snooperSees(s, message, randomBytes(message))
          expect(v.readable).toBe(false)
          expect(v.message).toBeNull()
          expect(v.inside).toMatch(/^([0-9A-F]{2} ){5,}[0-9A-F]{2}( …)?$/)
          expect(v.inside!.split(' ').filter((t) => t !== '…').length).toBeLessThanOrEqual(6)
          expect(JSON.stringify(v)).not.toContain(message)
          expect(v.inside!.toLowerCase()).not.toContain(message.toLowerCase())
        }
      }
    }
  })

  it('the shown bytes depend only on the random bytes, not on the message', () => {
    const bytes = ['8F', '4A', '91', 'C7', '2B', '0E', 'D3']
    expect(snooperSees('https', 'Canteen at 1 PM?', bytes).inside).toBe('8F 4A 91 C7 2B 0E …')
    expect(snooperSees('vpn', 'Lab journal due Friday', bytes).inside).toBe('8F 4A 91 C7 2B 0E …')
    expect(copy.bubble.inside).toBe('Inside:')
  })

  it('without bytes there is nothing to show', () => {
    expect(snooperSees('https', 'Canteen at 1 PM?').inside).toBeNull()
  })

  it('the bytes line appears right after \'can\'t open it\' and before the VPN note', () => {
    const fields = (s: Scenario) =>
      buildScenario(s).flatMap((x) => (x.kind === 'reveal' ? [x.field] : []))
    expect(fields('https').indexOf('bytes')).toBe(fields('https').indexOf('content') + 1)
    expect(fields('vpn').indexOf('bytes')).toBe(fields('vpn').indexOf('content') + 1)
    expect(fields('vpn').indexOf('note')).toBeGreaterThan(fields('vpn').indexOf('bytes'))
    expect(fields('insecure')).not.toContain('bytes')
  })
})

describe('readable captions (every caption stays up long enough to read)', () => {
  const windows = (s: Scenario) => {
    const steps = buildScenario(s)
    const captions = steps.filter((x): x is Extract<MotionStep, { kind: 'caption' }> => x.kind === 'caption')
    return captions.map((c, i) => ({
      key: c.key,
      text: captionText(s, c.key),
      shown: (captions[i + 1]?.at ?? c.at) - c.at, // the last caption stays up after the run, so it is not measured here
      isLast: i === captions.length - 1,
    }))
  }

  it.each(SCENARIOS)('%s: no caption is replaced before its reading time is up', (s) => {
    for (const w of windows(s).filter((x) => !x.isLast)) {
      expect(w.shown, w.key + ' ("' + w.text + '")').toBeGreaterThanOrEqual(readingTime(w.text) - 1e-9)
      expect(w.shown).toBeGreaterThanOrEqual(READING.min - 1e-9)
    }
  })

  it.each(SCENARIOS)('%s: the final caption settles on screen before the run ends', (s) => {
    const last = windows(s).find((x) => x.isLast)!
    const lastAt = buildScenario(s).filter((x) => x.kind === 'caption').at(-1)!.at
    expect(end(s) - lastAt).toBeGreaterThanOrEqual(2)
    expect(last.text.length).toBeGreaterThan(0)
  })

  it('reading time grows with the sentence and stays between 2.4 s and 4 s', () => {
    expect(readingTime('Only it.')).toBe(READING.min)
    expect(readingTime('It travels over the café Wi-Fi…')).toBeLessThan(readingTime(copy.captions.vpn.snooper))
    expect(readingTime(copy.captions.vpn.decrypt)).toBe(READING.max)
    for (const s of SCENARIOS) {
      for (const w of windows(s)) {
        expect(readingTime(w.text)).toBeGreaterThanOrEqual(READING.min)
        expect(readingTime(w.text)).toBeLessThanOrEqual(READING.max)
      }
    }
  })

  it('each caption matches the action: the item arrives when the next caption starts', () => {
    const startOf = (s: Scenario, key: string) =>
      buildScenario(s).find((x): x is Extract<MotionStep, { kind: 'caption' }> => x.kind === 'caption' && x.key === key)!.at
    const arrive = (s: Scenario, segment: string) => {
      const m = buildScenario(s).find((x) => x.kind === 'move' && x.segment === segment)!
      return m.at + m.dur
    }
    expect(arrive('insecure', 'you-router')).toBeCloseTo(startOf('insecure', 'captured'))
    expect(arrive('insecure', 'router-dest')).toBeCloseTo(startOf('insecure', 'arrives'))
    expect(arrive('https', 'router-dest')).toBeCloseTo(startOf('https', 'decrypt'))
    expect(arrive('vpn', 'router-vpn')).toBeCloseTo(startOf('vpn', 'decrypt'))
    expect(arrive('vpn', 'vpn-dest')).toBeCloseTo(startOf('vpn', 'open'))
  })
})
