import { describe, expect, it } from 'vitest'
import { MAX_FRAME_DELTA, playTimeline, stepProgress, totalDuration, type Clock } from '../simulation/timeline'

/** A manual clock: frames run only when the test calls step(). */
function fakeClock() {
  let now = 0
  let next = 1
  const queue = new Map<number, () => void>()
  const clock: Clock = {
    now: () => now,
    requestFrame: (cb) => {
      const handle = next++
      queue.set(handle, cb)
      return handle
    },
    cancelFrame: (handle) => {
      queue.delete(handle)
    },
  }
  function step(ms: number) {
    now += ms
    const callbacks = [...queue.values()]
    queue.clear()
    callbacks.forEach((cb) => cb())
  }
  return { clock, step, pending: () => queue.size }
}

const steps = [
  { at: 0, dur: 1 },
  { at: 0.5, dur: 0.5 },
  { at: 1, dur: 0 },
]

describe('stepProgress / totalDuration', () => {
  it('clamps progress to 0..1', () => {
    expect(stepProgress({ at: 1, dur: 2 }, 0)).toBe(0)
    expect(stepProgress({ at: 1, dur: 2 }, 2)).toBe(0.5)
    expect(stepProgress({ at: 1, dur: 2 }, 9)).toBe(1)
  })

  it('treats a zero-length step as instant', () => {
    expect(stepProgress({ at: 1, dur: 0 }, 0.99)).toBe(0)
    expect(stepProgress({ at: 1, dur: 0 }, 1)).toBe(1)
  })

  it('ends at the last step end', () => {
    expect(totalDuration(steps)).toBe(1)
    expect(totalDuration([])).toBe(0)
  })
})

describe('playTimeline', () => {
  it('reports time in order and finishes exactly once', () => {
    const { clock, step, pending } = fakeClock()
    const times: number[] = []
    let done = 0
    playTimeline(steps, { signal: new AbortController().signal, clock, onFrame: (t) => times.push(t), onDone: () => done++ })

    for (let i = 0; i < 20; i++) step(100)

    expect(times[0]).toBeCloseTo(0.1)
    expect(times.every((t, i) => i === 0 || t >= times[i - 1])).toBe(true)
    expect(times[times.length - 1]).toBe(1)
    expect(done).toBe(1)
    expect(pending()).toBe(0)
  })

  it('stops everything on abort: no more frames, no onDone', () => {
    const { clock, step, pending } = fakeClock()
    const controller = new AbortController()
    let frames = 0
    let done = 0
    playTimeline(steps, { signal: controller.signal, clock, onFrame: () => frames++, onDone: () => done++ })

    step(100)
    step(100)
    controller.abort()
    step(100)
    step(5000)

    expect(frames).toBe(2)
    expect(done).toBe(0)
    expect(pending()).toBe(0)
  })

  it('does nothing when already aborted', () => {
    const { clock, step } = fakeClock()
    const controller = new AbortController()
    controller.abort()
    let frames = 0
    playTimeline(steps, { signal: controller.signal, clock, onFrame: () => frames++, onDone: () => frames++ })
    step(100)
    expect(frames).toBe(0)
  })

  it('caps each frame, so a long pause (hidden tab) does not jump to the end', () => {
    const { clock, step } = fakeClock()
    const times: number[] = []
    playTimeline(steps, { signal: new AbortController().signal, clock, onFrame: (t) => times.push(t), onDone: () => {} })
    step(10_000)
    expect(times[0]).toBeCloseTo(MAX_FRAME_DELTA)
  })
})
