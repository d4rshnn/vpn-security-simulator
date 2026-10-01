/*
 * Postal item layout (no React): the item's box on the diagram, message wrapping and overlap checks.
 * Works on whole characters (grapheme clusters), so emoji and Hindi letters are never split.
 */
import type { Point } from './network'

export const ITEM = {
  width: 300, // postcard and envelopes share one footprint (SVG units)
  height: 120,
  gapToLine: 44, // the item's bottom sits this far above its dot on the line (clears a node tile)
  minTop: -20, // never further above the diagram than this
  maxChars: 16, // per line on the postcard (21-unit text)
  maxLines: 2,
} as const

/** Rev 5: the VPN envelope is 1.3× the HTTPS envelope, so the inner one visibly fits inside. */
export const OUTER = { width: ITEM.width * 1.3, height: ITEM.height * 1.3 } as const

export interface Size {
  width: number
  height: number
}

/** Size of what is currently on the line (used for placement and for fading labels under it). */
export function postalSize(wrapped: number): Size {
  return wrapped > 0 ? OUTER : ITEM
}

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

export function graphemes(text: string): string[] {
  return Array.from(segmenter.segment(text), (s) => s.segment)
}

function cut(chars: string[], max: number): string {
  return chars.length > max ? `${chars.slice(0, max - 1).join('')}…` : chars.join('')
}

/** Up to `maxLines` lines of at most `max` characters, broken at spaces; "…" only when it really doesn't fit. */
export function wrapMessage(message: string, max: number = ITEM.maxChars, maxLines: number = ITEM.maxLines): string[] {
  const words = message.trim().split(/\s+/).filter(Boolean)
  const lines: string[][] = []
  let line: string[] = []
  for (const word of words) {
    const w = graphemes(word)
    const candidate = line.length ? [...line, ' ', ...w] : w
    if (candidate.length <= max) {
      line = candidate
      continue
    }
    if (line.length) lines.push(line)
    line = w
  }
  if (line.length || !lines.length) lines.push(line)

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines)
    const last = kept[maxLines - 1]
    kept[maxLines - 1] = [...last, ...(last.length < max ? [' '] : []), '…'] // mark that more follows
    return kept.map((l) => cut(l, max))
  }
  return lines.map((l) => cut(l, max))
}

/** The first `p` (0..1) of the lines' characters, for the message being written onto the postcard. */
export function writtenLines(lines: string[], p: number): string[] {
  const total = lines.reduce((n, l) => n + graphemes(l).length, 0)
  let left = Math.round(Math.min(1, Math.max(0, p)) * total)
  return lines.map((l) => {
    const g = graphemes(l)
    const shown = g.slice(0, left).join('')
    left = Math.max(0, left - g.length)
    return shown
  })
}

export interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** Where the postal item floats for a packet at `at` (SVG units), kept inside the diagram. */
export function itemBox(at: Point, size: Size = ITEM, viewWidth = 1200): Box {
  const x = Math.min(Math.max(at.x - size.width / 2, 8), viewWidth - 8 - size.width)
  const y = Math.max(at.y - ITEM.gapToLine - size.height, ITEM.minTop)
  return { x, y, width: size.width, height: size.height }
}

export function overlaps(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

/** How the item sits on the diagram (R2 Part C): floating above the line (laptop) or centred on it (phone). */
export interface Placement {
  mode: 'float' | 'centered'
  scale: number
  viewWidth: number
}

const FLOAT: Placement = { mode: 'float', scale: 1, viewWidth: 1200 }

/**
 * box    = where the unscaled item is drawn
 * origin = the point it is scaled around
 * rect   = the area it actually covers on the diagram (for fading labels under it)
 */
export function placeItem(at: Point, size: Size, placement: Placement = FLOAT): { box: Box; origin: Point; rect: Box } {
  if (placement.mode === 'float') {
    const box = itemBox(at, size, placement.viewWidth)
    return { box, origin: at, rect: box }
  }
  const s = placement.scale
  const half = (size.width * s) / 2
  const cx = Math.min(Math.max(at.x, half + 4), placement.viewWidth - half - 4)
  return {
    box: { x: cx - size.width / 2, y: at.y - size.height / 2, width: size.width, height: size.height },
    origin: { x: cx, y: at.y },
    rect: { x: cx - half, y: at.y - (size.height * s) / 2, width: size.width * s, height: size.height * s },
  }
}

/**
 * The postcard text turning into code: the first `q` (0..1) of each line's characters are replaced,
 * left to right, by characters of the simulated bytes ("8F 4A 91 …"). Line lengths never change.
 * With no bytes (HTTP) the lines come back untouched.
 */
export function scrambleLines(lines: string[], bytes: readonly string[], q: number): string[] {
  if (bytes.length === 0) return lines
  const hex = bytes.join(' ') + ' '
  const amount = Math.min(1, Math.max(0, q))
  let offset = 0
  return lines.map((line) => {
    const chars = graphemes(line)
    const cut = Math.round(amount * chars.length)
    const out = chars.map((ch, i) => (i < cut ? hex[(offset + i) % hex.length] : ch))
    offset += chars.length
    return out.join('')
  })
}
