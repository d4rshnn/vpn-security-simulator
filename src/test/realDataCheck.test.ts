import { describe, expect, it } from 'vitest'
import { SAMPLE_MESSAGES } from '../content/samples'
import { looksSensitive } from '../simulation/realDataCheck'

describe('looksSensitive: flags real-looking data', () => {
  it.each([
    ['email', 'mail me at riya@example.com'],
    ['email', 'a.b+c@college.edu'],
    ['phone', '9876543210'],
    ['phone', 'call 98765 43210'],
    ['phone', '+91 98765-43210'],
    ['otp', '482913'],
    ['otp', 'code 1234 now'],
    ['otp', '12345678'],
    ['otp', '123 456'],
    ['card', '4111111111111111'],
    ['card', '4111 1111 1111 1111'],
    ['card', '4111-1111-1111-1111'],
    ['card', '1234567890123'],
    ['password', 'password: x'],
    ['password', 'Password=hunter2'],
    ['password', 'my pwd is cat'],
    ['password', 'OTP 55'],
    ['password', 'passcode - blue'],
  ])('%s: %s', (reason, text) => {
    expect(looksSensitive(text)).toBe(reason)
  })
})

describe('looksSensitive: allows harmless messages', () => {
  it.each([
    'Meet me at 5 PM',
    'Room 204',
    'BLUE-42',
    'Meet at 5:30 near gate 3',
    'I forgot my password',
    'Send the otp',
    'A1234',
    '',
    '   ',
    'नमस्ते, कल मिलते हैं',
    'Pizza 🍕 at 7?',
    '<script>alert(1)</script>',
  ])('%s', (text) => {
    expect(looksSensitive(text)).toBeNull()
  })

  it.each(SAMPLE_MESSAGES)('sample "%s"', (sample) => {
    expect(looksSensitive(sample)).toBeNull()
  })
})
