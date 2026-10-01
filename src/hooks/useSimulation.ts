import { useEffect, useRef, useState } from 'react'
import { buildScenario, frameAt, type SimFrame } from '../simulation/scenarios'
import { randomBytes } from '../simulation/simulatedBytes'
import { playTimeline } from '../simulation/timeline'
import type { RunResult, Scenario, SiteState } from '../site/types'

export interface SimView {
  scenario: Scenario
  reduced: boolean
  replay: boolean // this scenario had already been run when this run started
  bytes: string[] // this run's simulated bytes (HTTPS / VPN); new every run, made before the run starts
  frame: SimFrame
}

/**
 * Plays the active run. Per-frame values stay here (not in the reducer).
 * Cleanup aborts the timeline, so Reset (remount), leaving the screen and StrictMode re-runs stop instantly.
 * The last frame stays on screen after the run ends.
 */
export function useSimulation(
  run: SiteState['activeRun'],
  message: string,
  replay: boolean,
  onFinish: (result: RunResult) => void,
): SimView | null {
  const [view, setView] = useState<SimView | null>(null)
  const onFinishRef = useRef(onFinish)
  useEffect(() => {
    onFinishRef.current = onFinish
  })

  useEffect(() => {
    if (!run) return
    const { scenario } = run
    const steps = buildScenario(scenario)
    const bytes = scenario === 'insecure' ? [] : randomBytes(message) // before the timeline starts
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    const controller = new AbortController()

    playTimeline(steps, {
      signal: controller.signal,
      onFrame: (t) => setView({ scenario, reduced, replay, bytes, frame: frameAt(steps, t, reduced) }),
      onDone: () => onFinishRef.current({ scenario }),
    })
    return () => controller.abort()
  }, [run, message, replay]) // replay only changes together with run

  return view
}
