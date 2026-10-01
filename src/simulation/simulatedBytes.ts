/*
 * Simulated encryption (no React): random bytes that stand in for "the message turned into code".
 * Nothing here is real cryptography, and the bytes are not derived from the message.
 */

type FillRandom = (bytes: Uint8Array<ArrayBuffer>) => void

const browserRandom: FillRandom = (bytes) => {
  crypto.getRandomValues(bytes)
}

export const MIN_BYTES = 4
export const MAX_BYTES = 40
/** The snooper bubble shows at most this many pairs, then "…". */
export const BUBBLE_PAIRS = 6

function utf8Length(text: string): number {
  return new TextEncoder().encode(text).length
}

/** Random uppercase hex pairs ("8F", "4A", …): one per UTF-8 byte of the message (4 to 40). New on every call. */
export function randomBytes(message: string, fillRandom: FillRandom = browserRandom): string[] {
  const length = Math.min(MAX_BYTES, Math.max(MIN_BYTES, utf8Length(message)))
  const bytes = new Uint8Array(length)
  fillRandom(bytes)
  return Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0'))
}

/** The first `max` pairs with spaces, then " …" if there are more: "8F 4A 91 C7 2B 0E …". */
export function formatBytes(pairs: readonly string[], max: number = BUBBLE_PAIRS): string {
  const shown = pairs.slice(0, max).join(' ')
  return pairs.length > max ? `${shown} …` : shown
}
