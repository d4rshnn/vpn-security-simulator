/*
 * Timeline engine (no React). Plays a declarative list of timed steps with one
 * requestAnimationFrame loop and stops instantly when its AbortSignal fires.
 * The caller derives everything it draws from the elapsed time `t` (seconds).
 */

export interface TimedStep {
  at: number // start, seconds
  dur: number // duration, seconds (0 = instant)
}

/** Longest a single frame may advance, so a hidden tab pauses instead of jumping ahead. */
export const MAX_FRAME_DELTA = 0.1

export interface Clock {
  now(): number // milliseconds
  requestFrame(callback: () => void): number
  cancelFrame(handle: number): void
}

const browserClock: Clock = {
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (handle) => cancelAnimationFrame(handle),
}

/** Progress of one step at time t, clamped to 0..1. */
export function stepProgress(step: TimedStep, t: number): number {
  if (t < step.at) return 0
  if (step.dur <= 0) return 1
  return Math.min(1, (t - step.at) / step.dur)
}

export function totalDuration(steps: readonly TimedStep[]): number {
  return steps.reduce((end, s) => Math.max(end, s.at + s.dur), 0)
}

interface PlayOptions {
  signal: AbortSignal
  onFrame: (t: number) => void
  onDone: () => void
  clock?: Clock
}

/** Plays from t = 0 to the end of the last step. `onDone` fires once, and never after abort. */
export function playTimeline(steps: readonly TimedStep[], { signal, onFrame, onDone, clock = browserClock }: PlayOptions): void {
  if (signal.aborted) return
  const total = totalDuration(steps)
  let elapsed = 0
  let last = clock.now()
  let handle = 0

  function tick() {
    if (signal.aborted) return
    const now = clock.now()
    elapsed += Math.min(Math.max(0, (now - last) / 1000), MAX_FRAME_DELTA)
    last = now
    const t = Math.min(elapsed, total)
    onFrame(t)
    if (t >= total) {
      onDone()
      return
    }
    handle = clock.requestFrame(tick)
  }

  signal.addEventListener('abort', () => clock.cancelFrame(handle), { once: true })
  handle = clock.requestFrame(tick)
}
