/*
 * Summary cards (no React): one card per scenario, marked as run or not run from THIS visitor's results.
 * The Summary only needs to know which scenarios were run.
 */
import type { RunResult, Scenario } from './types'

const SUMMARY_SCENARIOS: Scenario[] = ['insecure', 'https', 'vpn']

export interface SummaryCard {
  scenario: Scenario
  ran: boolean
}

export function summaryCards(results: Partial<Record<Scenario, RunResult>>): SummaryCard[] {
  return SUMMARY_SCENARIOS.map((scenario) => ({ scenario, ran: results[scenario] !== undefined }))
}
