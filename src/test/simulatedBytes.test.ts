import { describe, expect, it } from 'vitest'
import { SAMPLE_MESSAGES } from '../content/samples'
import { BUBBLE_PAIRS, formatBytes, MAX_BYTES, MIN_BYTES, randomBytes } from '../simulation/simulatedBytes'

describe('randomBytes', () => {
  it('gives one uppercase hex pair per UTF-8 byte of the message (4 to 40)', () => {
    expect(randomBytes('Canteen at 1 PM?')).toHaveLength(16)
    expect(randomBytes('Lab journal due Friday')).toHaveLength(22)
    expect(randomBytes('Hi')).toHaveLength(MIN_BYTES)
    expect(randomBytes('W'.repeat(60))).toHaveLength(MAX_BYTES)
    expect(randomBytes('🍕')).toHaveLength(MIN_BYTES) // 4 UTF-8 bytes
    for (const pair of randomBytes('Meet at the main gate at 5')) expect(pair).toMatch(/^[0-9A-F]{2}$/)
  })

  it('is different on every call (new bytes every run)', () => {
    for (const message of SAMPLE_MESSAGES) {
      const runs = new Set(Array.from({ length: 20 }, () => randomBytes(message).join(' ')))
      expect(runs.size).toBe(20)
    }
  })

  it('comes only from the random source, never from the message', () => {
    const fill = (bytes: Uint8Array<ArrayBuffer>) => bytes.fill(0xab)
    expect(randomBytes('abc def ghi jkl', fill)).toEqual(Array(15).fill('AB'))
    expect(randomBytes('xyz xyz xyz xyz', fill)).toEqual(Array(15).fill('AB'))
  })

  it('never contains the plaintext', () => {
    for (const message of SAMPLE_MESSAGES) {
      for (let i = 0; i < 25; i++) {
        const text = randomBytes(message).join(' ')
        expect(text.toLowerCase()).not.toContain(message.toLowerCase())
      }
    }
  })
})

describe('formatBytes', () => {
  const pairs = ['8F', '4A', '91', 'C7', '2B', '0E', 'D3', '55']

  it('shows at most 6 pairs and then an ellipsis', () => {
    expect(BUBBLE_PAIRS).toBe(6)
    expect(formatBytes(pairs)).toBe('8F 4A 91 C7 2B 0E …')
  })

  it('shows short values in full', () => {
    expect(formatBytes(['8F', '4A', '91', 'C7'])).toBe('8F 4A 91 C7')
    expect(formatBytes(pairs, 8)).toBe('8F 4A 91 C7 2B 0E D3 55')
  })
})
