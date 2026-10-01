/*
 * Flags text that looks like real personal data (PROJECT_SPEC.md §C, Screen 1).
 * Deliberately cautious: a false positive only asks the visitor to use a sample.
 */

export type SensitiveReason = 'email' | 'phone' | 'otp' | 'card' | 'password'

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/
// "password"/"pwd"/"otp" (and close variants) followed by a value, e.g. "password: x", "my pwd is 1234".
const SECRET_WITH_VALUE = /\b(?:password|passwd|passcode|pwd|otp)\b\s*(?:is\b|=|:|-)?\s*[^\s:=-]/i
// Runs of digits, allowing single spaces or dashes between them ("98765 43210", "4111-1111-…").
const DIGIT_RUN = /\d(?:[ -]?\d)*/g
const LETTER = /\p{L}/u

export function looksSensitive(text: string): SensitiveReason | null {
  if (EMAIL.test(text)) return 'email'
  if (SECRET_WITH_VALUE.test(text)) return 'password'

  for (const match of text.matchAll(DIGIT_RUN)) {
    const digits = match[0].replace(/\D/g, '').length
    if (digits >= 13) return 'card'
    if (digits >= 9) return 'phone' // 10 digits, with some slack for country codes
    if (digits >= 4 && isStandalone(text, match.index, match[0].length)) return 'otp'
  }
  return null
}

/** A code is standalone when it isn't glued to letters, e.g. "1234" but not "A1234". */
function isStandalone(text: string, start: number, length: number): boolean {
  const before = text[start - 1] ?? ''
  const after = text[start + length] ?? ''
  return !LETTER.test(before) && !LETTER.test(after)
}
