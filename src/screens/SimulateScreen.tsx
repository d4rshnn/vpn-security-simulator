import type { Dispatch } from 'react'
import { Check, Lock, Shield, TriangleAlert } from 'lucide-react'
import { NetworkDiagram } from '../components/network/NetworkDiagram'
import { PostalItem } from '../components/network/PostalItem'
import { SnooperBubble } from '../components/network/SnooperBubble'
import { CaptionBar } from '../components/panels/CaptionBar'
import { Button } from '../components/ui/Button'
import { copy } from '../content/copy'
import { useSimulation } from '../hooks/useSimulation'
import { LayoutContext, placementOf } from '../components/network/layoutContext'
import { useIsPortrait } from '../hooks/useIsPortrait'
import { LAYOUTS, pointOnSegment } from '../simulation/network'
import { placeItem, postalSize } from '../simulation/packetText'
import { captionText, firstCaption, snooperSees } from '../simulation/scenarios'
import { canShowSummary } from '../site/state'
import type { Scenario, SiteAction, SiteState } from '../site/types'
import styles from './SimulateScreen.module.css'

interface SimulateScreenProps {
  state: SiteState
  dispatch: Dispatch<SiteAction>
}

// Guided order: the first scenario not yet run is suggested next.
const SCENARIOS: Scenario[] = ['insecure', 'https', 'vpn']
const ICONS = { insecure: TriangleAlert, https: Lock, vpn: Shield } as const
const SELECTED = { insecure: styles.selectedHttp, https: styles.selectedHttps, vpn: styles.selectedVpn } as const

/** Rev 4: the diagram is the whole screen: postal item, snooper bubble, one caption, three buttons. */
export function SimulateScreen({ state, dispatch }: SimulateScreenProps) {
  const active = state.activeRun?.scenario
  const view = useSimulation(
    state.activeRun,
    state.message,
    active !== undefined && state.results[active] !== undefined,
    (result) => dispatch({ type: 'RUN_FINISHED', result }),
  )
  const running = state.activeRun !== null
  const suggested = SCENARIOS.find((s) => !state.results[s])
  const shown: Scenario = active ?? view?.scenario ?? suggested ?? 'insecure'
  const frame = view?.scenario === shown ? view.frame : null
  const summaryReady = canShowSummary(state)
  // R2 Part C: vertical diagram on phones / portrait screens, the original one on laptops.
  const layout = LAYOUTS[useIsPortrait() ? 'portrait' : 'landscape']

  const itemAt = frame ? pointOnSegment(frame.item.segment, frame.item.t, layout.nodes) : null
  // The floating item's box, so diagram labels under it can fade out of the way.
  const cover = frame && itemAt && frame.item.opacity > 0.05 ? placeItem(itemAt, postalSize(frame.wrapped), placementOf(layout)).rect
      : null
  const caption = view && frame?.caption ? captionText(view.scenario, frame.caption) : firstCaption(shown)

  return (
    <section className={styles.screen}>
      <div className={styles.stage}>
        <LayoutContext.Provider value={layout}>
          <NetworkDiagram
            scenario={shown}
            delivered={frame?.delivered ?? 0}
            tunnelReveal={frame ? frame.tunnel : 1}
            reduced={view?.reduced}
            cover={cover}
          >
            {view && frame && itemAt && (
              <>
                {frame.detected && <SnooperBubble seen={snooperSees(view.scenario, state.message)} revealed={frame.revealed} />}
                {frame.ghost && (
                  <PostalItem
                    variant="ghost"
                    at={pointOnSegment('router-snooper', frame.ghost.t, layout.nodes)}
                    opacity={frame.ghost.opacity * 0.85}
                    message={state.message}
                    written={frame.written}
                    sealed={frame.sealed}
                    wrapped={frame.wrapped}
                    reduced={view.reduced}
                  />
                )}
                <PostalItem
                  at={itemAt}
                  opacity={frame.item.opacity}
                  message={state.message}
                  written={frame.written}
                  sealed={frame.sealed}
                  wrapped={frame.wrapped}
                  reduced={view.reduced}
                />
              </>
            )}
          </NetworkDiagram>
        </LayoutContext.Provider>
      </div>

      <div className={styles.caption}>
        <CaptionBar text={caption} />
      </div>

      <div className={styles.controls}>
        {SCENARIOS.map((scenario) => {
          const done = state.results[scenario] !== undefined
          const Icon = done ? Check : ICONS[scenario]
          const selected = scenario === shown && (running || view !== null)
          return (
            <Button
              key={scenario}
              className={selected ? SELECTED[scenario] : undefined}
              aria-pressed={selected}
              pulse={!running && scenario === suggested}
              onClick={() => dispatch({ type: 'RUN_STARTED', scenario })}
              disabled={running}
            >
              <Icon size={20} aria-hidden="true" />
              {copy.simulate.scenarios[scenario]}
              {done && <span className={styles.replay}>{copy.simulate.replay}</span>}
            </Button>
          )
        })}
        {summaryReady && (
          <Button
            variant="primary"
            className={styles.next}
            pulse={!running && suggested === undefined}
            onClick={() => dispatch({ type: 'GO', screen: 'summary' })}
            disabled={running}
          >
            {copy.simulate.summary}
          </Button>
        )}
      </div>
    </section>
  )
}
