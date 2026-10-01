import { describe, expect, it } from 'vitest'
import { copy } from '../content/copy'
import { summaryCards } from '../site/summary'

describe('summaryCards', () => {
  it('shows all three scenarios in order, marked as run from this visitor’s results', () => {
    const cards = summaryCards({ insecure: { scenario: 'insecure' }, https: { scenario: 'https' }, vpn: { scenario: 'vpn' } })
    expect(cards).toEqual([
      { scenario: 'insecure', ran: true },
      { scenario: 'https', ran: true },
      { scenario: 'vpn', ran: true },
    ])
  })

  it('marks a scenario that was not run (only HTTPS can be skipped)', () => {
    const cards = summaryCards({ insecure: { scenario: 'insecure' }, vpn: { scenario: 'vpn' } })
    expect(cards.map((c) => c.ran)).toEqual([true, false, true])
  })
})

describe('Summary copy (spec §J, R2)', () => {
  it('has one postal sentence per card', () => {
    expect(copy.summary.cards).toEqual({
      insecure: 'Anyone on the Wi-Fi could read it.',
      https: 'They saw where it went, not what it said.',
      vpn: 'They only saw a sealed envelope going to a VPN server.',
    })
  })

  it('keeps the bottom line, the 3 + 3 details, "work best together" and Start over', () => {
    expect(copy.summary.bottomLine).toBe(
      "A VPN protects you on untrusted Wi-Fi, but it won't make you anonymous or stop scams.",
    )
    expect(copy.summary.does.items).toHaveLength(3)
    expect(copy.summary.doesNot.items).toHaveLength(3)
    expect(copy.summary.together).toBe('HTTPS and a VPN work best together.')
    expect(copy.summary.notRun).toBe('Not run')
    expect(copy.site.steps).toEqual(['Message', 'Simulate', 'Summary'])
  })

  it('keeps the simulation disclaimer accurate (no bytes are shown any more)', () => {
    expect(copy.summary.note).toContain('simulation, not a VPN')
    expect(copy.summary.note).not.toMatch(/bytes/)
  })
})
