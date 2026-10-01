export type Screen = 'intro' | 'message' | 'simulate' | 'summary'
export type Scenario = 'insecure' | 'https' | 'vpn'

/** A finished run. Rev 5 / R2: the Summary only needs to know which scenarios were run. */
export interface RunResult {
  scenario: Scenario
}

export interface SiteState {
  screen: Screen
  message: string // sample text only; never persisted
  activeRun: { scenario: Scenario; runId: number } | null
  runCount: number // source of the next runId
  results: Partial<Record<Scenario, RunResult>> // feeds the Summary table
}

export type SiteAction =
  | { type: 'START' }
  | { type: 'SET_MESSAGE'; message: string }
  | { type: 'GO'; screen: Screen }
  | { type: 'RUN_STARTED'; scenario: Scenario }
  | { type: 'RUN_FINISHED'; result: RunResult }
