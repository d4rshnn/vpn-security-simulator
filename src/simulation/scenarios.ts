/*
 * Scenario choreography (no React), mirroring PROJECT_SPEC.md §I and the §H "what the snooper sees" table.
 * Rev 4/5 postal model:
 *   HTTP  = a postcard.
 *   HTTPS = the postcard sealed in a blue envelope "To: vjti-chat.example", opened at the destination.
 *   VPN   = VPN + HTTPS: that sealed blue envelope goes inside a bigger teal envelope "To: VPN server".
 *           The VPN server opens only the teal one; the blue one stays sealed until the destination.
 * Snooping is passive: at the router the real item pauses at most 0.3 s and moves on
 * while the ghost copy slides down to the snooper in parallel.
 * Pacing: every caption stays up long enough to read (see readingTime); the animation is built around it.
 */
import { copy } from '../content/copy'
import type { Scenario } from '../site/types'
import { ADDRESSES, type SegmentId } from './network'
import { formatBytes } from './simulatedBytes'
import { stepProgress, type TimedStep } from './timeline'

export type RevealField = 'address' | 'content' | 'bytes' | 'note'

export type MotionStep = TimedStep &
  (
    | { kind: 'write' } // the message is written onto the postcard at You
    | { kind: 'move'; segment: SegmentId }
    | { kind: 'ghost' } // copy slides router → snooper
    | { kind: 'tunnel' } // VPN tunnel draws in
    | { kind: 'seal' } // postcard goes into the blue HTTPS envelope at You
    | { kind: 'open'; node: 'dest' } // the HTTPS envelope is opened only at the destination
    | { kind: 'wrap' } // VPN: the sealed blue envelope goes into the teal outer envelope at You
    | { kind: 'unwrap'; node: 'vpn' } // VPN: the outer envelope is opened at the VPN server
    | { kind: 'deliver' } // destination receives it
    | { kind: 'caption'; key: string } // key into copy.captions[scenario]
    | { kind: 'reveal'; field: RevealField } // snooper bubble content appears
    | { kind: 'hold' } // settle time at the end of the run
  )

/** Bubble lines appear one by one, 0.25 s apart, once the ghost copy has arrived. */
function reveals(at: number, fields: RevealField[]): MotionStep[] {
  return fields.map((field, i) => ({ kind: 'reveal', field, at: at + i * 0.25, dur: 0 }))
}

/*
 * Readable pacing. Every caption stays on screen long enough to read, and the animation is laid out
 * around it: a "beat" is one caption plus the actions that go with it, and lasts at least the caption's reading time.
 */
export const READING = { base: 0.8, perWord: 0.25, min: 2.4, max: 4.0 } as const

/** Seconds a caption needs on screen: about 0.8 s to look up, then 0.25 s per word, between 2.4 s and 4 s. */
export function readingTime(text: string): number {
  const words = text.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length
  return Math.min(READING.max, Math.max(READING.min, READING.base + READING.perWord * words))
}

const PAUSE_AT_ROUTER = 0.3 // snooping is passive: the real item waits at most this long at the router
const COPY_SLIDE = 2.4 // the snooper's dashed copy glides down slowly enough to be seen
const REVEAL_FINAL_HOLD = 2.4 // after the last caption the run settles for a moment

/** A cursor over the run: each beat adds its caption at the current time, then moves time on by the caption's reading time. */
function beats(scenario: Scenario) {
  const steps: MotionStep[] = []
  let t = 0
  const dwell = (key: string) => readingTime(captionText(scenario, key))
  return {
    steps,
    /** Starts a beat; returns its start and how long it lasts. */
    beat(key: string): { at: number; dur: number } {
      const at = t
      const dur = dwell(key)
      steps.push({ kind: 'caption', key, at, dur: 0 })
      t += dur
      return { at, dur }
    },
    dwell,
    end: () => t,
  }
}

/** The step where the real item leaves the router while the snooper's copy slides down in parallel. */
function atRouter(b: { at: number; dur: number }, to: SegmentId, fields: RevealField[]): MotionStep[] {
  const copySlide = Math.min(COPY_SLIDE, b.dur - 0.4)
  return [
    { kind: 'ghost', at: b.at, dur: copySlide },
    // The item arrives at the next stop exactly when the next caption starts.
    { kind: 'move', segment: to, at: b.at + PAUSE_AT_ROUTER, dur: b.dur - PAUSE_AT_ROUTER },
    ...(fields.length ? reveals(b.at + copySlide, fields) : []),
  ]
}

function buildInsecure(): MotionStep[] {
  const s = beats('insecure')
  const packed = s.beat('packed')
  s.steps.push({ kind: 'write', at: packed.at + 0.2, dur: 0.9 })
  const wifi = s.beat('wifi')
  s.steps.push({ kind: 'move', segment: 'you-router', at: wifi.at, dur: wifi.dur })
  const captured = s.beat('captured')
  const readable = s.beat('readable')
  // The postcard crosses to the destination while both captions are read; the copy reaches the snooper first.
  s.steps.push(
    { kind: 'ghost', at: captured.at, dur: Math.min(COPY_SLIDE, captured.dur - 0.4) },
    {
      kind: 'move',
      segment: 'router-dest',
      at: captured.at + PAUSE_AT_ROUTER,
      dur: captured.dur + readable.dur - PAUSE_AT_ROUTER,
    },
    ...reveals(readable.at, ['content']),
  )
  const arrives = s.beat('arrives')
  s.steps.push({ kind: 'deliver', at: arrives.at, dur: 0.6 })
  const next = s.beat('next')
  s.steps.push({ kind: 'hold', at: next.at, dur: REVEAL_FINAL_HOLD })
  return s.steps
}

function buildHttps(): MotionStep[] {
  const s = beats('https')
  const start = s.beat('start')
  s.steps.push({ kind: 'write', at: start.at, dur: 0.9 })
  const encrypt = s.beat('encrypt')
  s.steps.push({ kind: 'seal', at: encrypt.at, dur: 1.2 })
  const wifi = s.beat('wifi')
  s.steps.push({ kind: 'move', segment: 'you-router', at: wifi.at, dur: wifi.dur })
  const snooper = s.beat('snooper')
  s.steps.push(...atRouter(snooper, 'router-dest', ['address', 'content', 'bytes']))
  const decrypt = s.beat('decrypt')
  s.steps.push({ kind: 'open', node: 'dest', at: decrypt.at, dur: 0.8 }, { kind: 'deliver', at: decrypt.at + 0.8, dur: 0.4 })
  const next = s.beat('next')
  s.steps.push({ kind: 'hold', at: next.at, dur: REVEAL_FINAL_HOLD })
  return s.steps
}

function buildVpn(): MotionStep[] {
  const s = beats('vpn')
  const start = s.beat('start')
  s.steps.push({ kind: 'write', at: start.at, dur: 0.9 })
  const encrypt = s.beat('encrypt')
  s.steps.push({ kind: 'seal', at: encrypt.at, dur: 1.2 })
  const wrap = s.beat('wrap')
  s.steps.push({ kind: 'wrap', at: wrap.at, dur: 1.6 })
  s.beat('wrapAddress')
  const tunnel = s.beat('tunnel')
  s.steps.push({ kind: 'tunnel', at: tunnel.at, dur: 0.8 })
  const wifi = s.beat('wifi')
  s.steps.push({ kind: 'move', segment: 'you-router', at: wifi.at, dur: wifi.dur })
  const snooper = s.beat('snooper')
  s.steps.push(...atRouter(snooper, 'router-vpn', ['address', 'content', 'bytes', 'note']))
  const decrypt = s.beat('decrypt')
  s.steps.push({ kind: 'unwrap', node: 'vpn', at: decrypt.at, dur: 0.8 })
  s.beat('trust')
  const regular = s.beat('regular')
  s.steps.push({ kind: 'move', segment: 'vpn-dest', at: regular.at, dur: regular.dur })
  const open = s.beat('open')
  s.steps.push({ kind: 'open', node: 'dest', at: open.at, dur: 0.8 }, { kind: 'deliver', at: open.at + 0.8, dur: 0.6 })
  const next = s.beat('next')
  s.steps.push({ kind: 'hold', at: next.at, dur: REVEAL_FINAL_HOLD })
  return s.steps
}

/** Steps are listed in time order; steps that start together keep the order they were added in (caption first). */
const byTime = (steps: MotionStep[]): MotionStep[] => [...steps].sort((a, b) => a.at - b.at)

const SCRIPTS: Record<Scenario, MotionStep[]> = {
  insecure: byTime(buildInsecure()),
  https: byTime(buildHttps()),
  vpn: byTime(buildVpn()),
}

export function buildScenario(scenario: Scenario): readonly MotionStep[] {
  return SCRIPTS[scenario]
}

/** The caption shown before a scenario has been run: its first sentence. */
export function firstCaption(scenario: Scenario): string {
  return captionText(scenario, (SCRIPTS[scenario].find((s) => s.kind === 'caption') as { key: string }).key)
}

export function captionText(scenario: Scenario, key: string): string {
  return (copy.captions[scenario] as Record<string, string>)[key]
}

/** Spec §H: what the snooper on the café Wi-Fi can see in each scenario (postal model). */
export interface SnooperView {
  noticed: true // always notices traffic
  address: string | null // the address on the outermost envelope (metadata); none for a postcard
  readable: boolean // only a postcard (HTTP) can be read
  message: string | null // the message itself, only when readable
  /** HTTPS / VPN: the first captured bytes ("8F 4A 91 C7 2B 0E …"), never the message. Null for a readable postcard. */
  inside: string | null
  canStillSeeNote: boolean // VPN: "Still sees: a VPN is used, when, how much."
}

/** `bytes` are this run's simulated bytes (see simulatedBytes.ts); they are independent of the message. */
export function snooperSees(scenario: Scenario, message: string, bytes: readonly string[] = []): SnooperView {
  const readable = scenario === 'insecure'
  return {
    noticed: true,
    address: scenario === 'https' ? ADDRESSES.destHost : scenario === 'vpn' ? copy.diagram.vpn : null,
    readable,
    message: readable ? message : null,
    inside: !readable && bytes.length > 0 ? formatBytes(bytes) : null,
    canStillSeeNote: scenario === 'vpn',
  }
}

/** Everything the screen draws at one moment. Pure: same steps + t → same frame. */
export interface SimFrame {
  item: { segment: SegmentId; t: number; opacity: number }
  ghost: { t: number; opacity: number } | null // t along router → snooper
  written: number // 0..1 how much of the message is on the postcard
  sealed: number // blue HTTPS envelope: 0 = postcard, 1 = sealed (back to 0 when opened at the destination)
  wrapped: number // teal VPN envelope: 0 = none, 1 = blue envelope sealed inside it (back to 0 at the VPN server)
  usesHttps: boolean // this scenario seals the postcard in the blue envelope
  tunnel: number // 0..1 reveal
  detected: boolean // ghost copy has started ("Noticed traffic")
  captured: boolean // ghost copy reached the snooper
  delivered: number // 0..1
  caption: string | null // key into copy.captions[scenario]
  revealed: ReadonlySet<RevealField>
}

const easeInOut = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2)
const clamp01 = (n: number) => Math.min(1, Math.max(0, n))

/** Calm motion normally; with reduced motion, moves become a fade out → fade in at the next stop. */
function motion(p: number, reduced: boolean): { t: number; opacity: number } {
  if (!reduced) return { t: easeInOut(p), opacity: 1 }
  if (p <= 0) return { t: 0, opacity: 1 }
  if (p >= 1) return { t: 1, opacity: 1 }
  return { t: p < 0.5 ? 0 : 1, opacity: Math.abs(1 - 2 * p) }
}

export function frameAt(steps: readonly MotionStep[], t: number, reduced = false): SimFrame {
  const of = <K extends MotionStep['kind']>(kind: K) =>
    steps.filter((s): s is Extract<MotionStep, { kind: K }> => s.kind === kind)
  const started = <S extends TimedStep>(list: S[]) => list.filter((s) => t >= s.at)
  const progress = (s: TimedStep | undefined) => (s ? stepProgress(s, t) : 0)

  // The item rides the latest move that has started (or waits at You before the first one).
  const moves = started(of('move'))
  const move = moves[moves.length - 1]
  const moveMotion = move ? motion(stepProgress(move, t), reduced) : { t: 0, opacity: 1 }

  const write = of('write')[0]
  const seal = of('seal')[0]
  const ghostStep = of('ghost')[0]
  const g = progress(ghostStep)
  const ghostActive = ghostStep !== undefined && t >= ghostStep.at && g < 1
  const ghostMotion = motion(g, reduced)
  const delivered = progress(of('deliver')[0])
  const captions = started(of('caption'))

  return {
    item: {
      segment: move?.segment ?? 'you-router',
      t: moveMotion.t,
      opacity: moveMotion.opacity * (1 - delivered),
    },
    ghost: ghostActive
      ? {
          t: 0.2 + 0.6 * ghostMotion.t,
          opacity: ghostMotion.opacity * clamp01(g / 0.15) * clamp01((1 - g) / 0.2),
        }
      : null,
    written: write ? stepProgress(write, t) : 1,
    sealed: clamp01(progress(seal) - progress(of('open')[0])),
    wrapped: clamp01(progress(of('wrap')[0]) - progress(of('unwrap')[0])),
    usesHttps: seal !== undefined,
    tunnel: progress(of('tunnel')[0]),
    detected: ghostStep !== undefined && t >= ghostStep.at,
    captured: g >= 1,
    delivered,
    caption: captions.length ? captions[captions.length - 1].key : null,
    revealed: new Set(started(of('reveal')).map((s) => s.field)),
  }
}
