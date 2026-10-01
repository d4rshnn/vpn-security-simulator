import { describe, expect, it } from 'vitest'
import indexHtml from '../../index.html?raw'
import { copy } from '../content/copy'
import { MAX_MESSAGE_LENGTH, SAMPLE_MESSAGES } from '../content/samples'
import { ADDRESSES } from '../simulation/network'
import { graphemes, ITEM, wrapMessage } from '../simulation/packetText'
import { looksSensitive } from '../simulation/realDataCheck'

describe('VJTI sample messages (R3)', () => {
  it('are exactly the four campus samples', () => {
    expect([...SAMPLE_MESSAGES]).toEqual([
      'Meet at the main gate at 5',
      'DSA practice in Room 204 tonight',
      'Canteen at 1 PM?',
      'Lab journal due Friday',
    ])
  })

  it.each(SAMPLE_MESSAGES)('"%s" is harmless, fits the limit, and fits the postcard without "…"', (sample) => {
    expect(looksSensitive(sample)).toBeNull()
    expect(sample.length).toBeLessThanOrEqual(MAX_MESSAGE_LENGTH)
    const lines = wrapMessage(sample)
    expect(lines.length).toBeLessThanOrEqual(ITEM.maxLines)
    expect(lines.join(' ')).toBe(sample)
    for (const line of lines) expect(graphemes(line).length).toBeLessThanOrEqual(ITEM.maxChars)
  })
})

describe('destination domain and VJTI wording (R3)', () => {
  it('the destination is the reserved vjti-chat.example domain', () => {
    expect(ADDRESSES.destHost).toBe('vjti-chat.example')
    expect(ADDRESSES.destHost).toMatch(/\.example$/)
    expect(copy.diagram.envelopeTo(ADDRESSES.destHost)).toBe('To: vjti-chat.example')
  })

  it('keeps the café scene fictional and off campus', () => {
    expect(copy.message.scenario).toBe(
      "You're on free Wi-Fi at a café near campus, sending a private message to a website.",
    )
  })

  it('credits the VJTI Community of Coders in the footer', () => {
    expect(copy.site.credit).toBe('Built by VJTI Community of Coders')
  })
})

/** All source text that ships with the website (tests excluded), plus index.html. */
const sources = import.meta.glob<string>('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true })

describe('names and domains that must never appear', () => {
  const text = [
    ...Object.entries(sources)
      .filter(([path]) => !path.includes('/test/'))
      .map(([, source]) => source),
    indexHtml,
  ].join(' ')

  it('scans the real sources', () => {
    expect(text).toContain('vjti-chat.example')
  })

  it('has no fest names', () => {
    expect(text).not.toMatch(new RegExp('techno' + 'vanza', 'i')) // fest names never appear
  })

  it('has no real campus or placeholder domains (only reserved .example domains)', () => {
    expect(text).not.toMatch(/vjti\.ac\.in/i)
    expect(text).not.toMatch(/shop\.example/)
  })
})
