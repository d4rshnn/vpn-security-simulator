/*
 * Scenario choreography (no React), mirroring PROJECT_SPEC.md §I and the §H "what the snooper sees" table.
 * Rev 4/5 postal model:
 *   HTTP  = a postcard.
 *   HTTPS = the postcard sealed in a blue envelope "To: vjti-chat.example", opened at the destination.
 *   VPN   = VPN + HTTPS: that sealed blue envelope goes inside a bigger teal envelope "To: VPN server".
 *           The VPN server opens only the teal one; the blue one stays sealed until the destination.
 * Snooping is passive: at the router the real item pauses at most 0.3 s and moves on
 * while the ghost copy slides down to the snooper in parallel.
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

const SCRIPTS: Record<Scenario, MotionStep[]> = {
  insecure: [
    { kind: 'caption', key: 'packed', at: 0, dur: 0 },
    { kind: 'write', at: 0.2, dur: 0.9 },
    { kind: 'caption', key: 'wifi', at: 1.2, dur: 0 },
    { kind: 'move', segment: 'you-router', at: 1.2, dur: 2.4 },
    { kind: 'caption', key: 'captured', at: 3.6, dur: 0 },
    { kind: 'ghost', at: 3.6, dur: 1.0 },
    { kind: 'move', segment: 'router-dest', at: 3.9, dur: 2.8 },
    { kind: 'caption', key: 'readable', at: 4.6, dur: 0 },
    ...reveals(4.6, ['content']),
    { kind: 'caption', key: 'arrives', at: 6.7, dur: 0 },
    { kind: 'deliver', at: 6.7, dur: 0.6 },
    { kind: 'caption', key: 'next', at: 8.0, dur: 0 },
    { kind: 'hold', at: 8.0, dur: 3.0 },
  ],
  https: [
    { kind: 'caption', key: 'start', at: 0, dur: 0 },
    { kind: 'write', at: 0, dur: 0.9 },
    { kind: 'caption', key: 'encrypt', at: 1.0, dur: 0 },
    { kind: 'seal', at: 1.0, dur: 1.2 },
    { kind: 'caption', key: 'wifi', at: 2.4, dur: 0 },
    { kind: 'move', segment: 'you-router', at: 2.4, dur: 2.4 },
    { kind: 'caption', key: 'snooper', at: 4.8, dur: 0 },
    { kind: 'ghost', at: 4.8, dur: 1.0 },
    { kind: 'move', segment: 'router-dest', at: 5.1, dur: 2.8 },
    ...reveals(5.8, ['address', 'content', 'bytes']),
    { kind: 'caption', key: 'decrypt', at: 7.9, dur: 0 },
    { kind: 'open', node: 'dest', at: 7.9, dur: 0.8 },
    { kind: 'deliver', at: 8.7, dur: 0.4 },
    { kind: 'caption', key: 'next', at: 9.4, dur: 0 },
    { kind: 'hold', at: 9.4, dur: 2.6 },
  ],
  vpn: [
    { kind: 'caption', key: 'start', at: 0, dur: 0 },
    { kind: 'write', at: 0, dur: 0.9 },
    { kind: 'caption', key: 'encrypt', at: 1.0, dur: 0 },
    { kind: 'seal', at: 1.0, dur: 1.2 },
    { kind: 'caption', key: 'wrap', at: 2.6, dur: 0 },
    { kind: 'wrap', at: 2.6, dur: 1.6 },
    { kind: 'caption', key: 'wrapAddress', at: 3.6, dur: 0 },
    { kind: 'caption', key: 'tunnel', at: 4.4, dur: 0 },
    { kind: 'tunnel', at: 4.4, dur: 0.8 },
    { kind: 'caption', key: 'wifi', at: 5.2, dur: 0 },
    { kind: 'move', segment: 'you-router', at: 5.2, dur: 2.4 },
    { kind: 'caption', key: 'snooper', at: 7.6, dur: 0 },
    { kind: 'ghost', at: 7.6, dur: 1.0 },
    { kind: 'move', segment: 'router-vpn', at: 7.9, dur: 2.4 },
    ...reveals(8.6, ['address', 'content', 'bytes', 'note']),
    { kind: 'caption', key: 'decrypt', at: 10.3, dur: 0 },
    { kind: 'unwrap', node: 'vpn', at: 10.3, dur: 0.8 },
    { kind: 'caption', key: 'trust', at: 11.2, dur: 0 },
    { kind: 'caption', key: 'regular', at: 11.9, dur: 0 },
    { kind: 'move', segment: 'vpn-dest', at: 11.9, dur: 2.6 },
    { kind: 'caption', key: 'open', at: 14.5, dur: 0 },
    { kind: 'open', node: 'dest', at: 14.5, dur: 0.8 },
    { kind: 'deliver', at: 15.3, dur: 0.6 },
    { kind: 'caption', key: 'next', at: 16.2, dur: 0 },
    { kind: 'hold', at: 16.2, dur: 2.0 },
  ],
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
