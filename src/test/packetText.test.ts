import { describe, expect, it } from 'vitest'
import { SAMPLE_MESSAGES } from '../content/samples'
import { NODES } from '../simulation/network'
import { graphemes, ITEM, itemBox, overlaps, wrapMessage, writtenLines } from '../simulation/packetText'

describe('wrapMessage (postcard text)', () => {
  it('keeps short messages on one line', () => {
    expect(wrapMessage('Canteen at 1 PM?')).toEqual(['Canteen at 1 PM?'])
  })

  it('wraps every sample message cleanly onto at most two lines, without "…"', () => {
    expect(wrapMessage('Meet at the main gate at 5')).toEqual(['Meet at the main', 'gate at 5'])
    expect(wrapMessage('DSA practice in Room 204 tonight')).toEqual(['DSA practice in', 'Room 204 tonight'])
    expect(wrapMessage('Lab journal due Friday')).toEqual(['Lab journal due', 'Friday'])
    for (const sample of SAMPLE_MESSAGES) {
      const lines = wrapMessage(sample)
      expect(lines.length).toBeLessThanOrEqual(2)
      expect(lines.join(' ')).toBe(sample)
      for (const line of lines) expect(graphemes(line).length).toBeLessThanOrEqual(ITEM.maxChars)
    }
  })

  it('truncates only what cannot fit in two lines', () => {
    expect(wrapMessage('W'.repeat(40))).toEqual([`${'W'.repeat(ITEM.maxChars - 1)}…`])
    const long = wrapMessage('one two three four five six seven eight nine')
    expect(long).toHaveLength(2)
    expect(long[1].endsWith('…')).toBe(true)
  })

  it('never splits an emoji or a Hindi letter', () => {
    const pizza = wrapMessage('🍕'.repeat(20))[0]
    expect(graphemes(pizza).slice(0, -1).every((g) => g === '🍕')).toBe(true)
    const hindi = 'नमस्ते दोस्तों कल मिलते हैं'
    expect(wrapMessage(hindi).join(' ')).toBe(hindi)
  })
})

describe('writtenLines (the message being written on the postcard)', () => {
  it('reveals characters left to right across lines', () => {
    const lines = ['DSA practice in', 'Room 204 tonight']
    expect(writtenLines(lines, 0)).toEqual(['', ''])
    expect(writtenLines(lines, 1)).toEqual(lines)
    const half = writtenLines(lines, 0.5)
    expect(half[0]).toBe('DSA practice in')
    expect(half[1]).toBe('R') // 16 of 32 characters: the whole first line plus the start of the second
  })
})

describe('itemBox / overlaps', () => {
  it('floats above the line and stays inside the diagram', () => {
    const box = itemBox({ x: 400, y: 250 })
    expect(box.y + box.height).toBe(250 - ITEM.gapToLine)
    expect(itemBox({ x: 20, y: 250 }).x).toBe(8)
    expect(itemBox({ x: 1190, y: 250 }).x).toBe(1200 - 8 - ITEM.width)
  })

  it('at the VPN server the item sits above it, within the allowed margin', () => {
    const box = itemBox(NODES.vpn)
    expect(box.y).toBeGreaterThanOrEqual(ITEM.minTop)
    expect(box.y + box.height).toBeLessThanOrEqual(NODES.vpn.y - 38) // clear of the VPN tile (half height 42)
  })

  it('detects overlap', () => {
    expect(overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 5, y: 5, width: 10, height: 10 })).toBe(true)
    expect(overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 })).toBe(false)
  })
})
