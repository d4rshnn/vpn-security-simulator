import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { copy } from '../../content/copy'
import { ADDRESSES, type Rect, type SegmentId } from '../../simulation/network'
import { overlaps } from '../../simulation/packetText'
import type { Scenario } from '../../site/types'
import { HttpsBracket } from './HttpsBracket'
import { useDiagramLayout } from './layoutContext'
import { Link, type LinkState } from './Link'
import { NetworkNode } from './NetworkNode'
import { LaptopArt, RouterArt, ServerArt, VpnServerArt } from './NodeIllustrations'
import { SnooperNode, SnooperTapLine } from './SnooperTap'
import { VpnTunnelMarks, VpnTunnelPipe } from './VpnTunnel'
import styles from './Network.module.css'

// What each scenario changes (spec §C): VPN server active/faded, tunnel, HTTPS hairline, route colour.
// Rev 4: one accent per scenario (amber HTTP, blue HTTPS, teal VPN); readable traffic is amber.
const LINK_STATES: Record<Scenario, Record<Exclude<SegmentId, 'router-snooper'>, LinkState>> = {
  insecure: { 'you-router': 'exposed', 'router-dest': 'exposed', 'router-vpn': 'dim', 'vpn-dest': 'dim' },
  https: { 'you-router': 'https', 'router-dest': 'https', 'router-vpn': 'dim', 'vpn-dest': 'dim' },
  // Rev 5: after the VPN server the traffic is still sealed by HTTPS, so that line is blue, not amber.
  vpn: { 'you-router': 'vpn', 'router-dest': 'dim', 'router-vpn': 'vpn', 'vpn-dest': 'https' },
}

interface NetworkDiagramProps {
  scenario: Scenario
  /** 0..1 opacity of the "Delivered" label. */
  delivered: number
  /** 0..1 how much of the VPN tunnel is drawn (VPN scenario only). */
  tunnelReveal?: number
  reduced?: boolean
  /** Moving layer (snooper bubble, ghost copy, postal item), drawn on top of everything. */
  children?: ReactNode
  /** Where the postal item is; labels it passes over fade out of its way. */
  cover?: Rect | null
}

/** The network diagram in the current layout (landscape on laptops, portrait on phones). */
export function NetworkDiagram({
  scenario,
  delivered,
  tunnelReveal = 1,
  reduced = false,
  children,
  cover = null,
}: NetworkDiagramProps) {
  const layout = useDiagramLayout()
  const { viewBox, labels, covers } = layout
  const covered = (label: Rect) => cover !== null && overlaps(cover, label)
  const links = LINK_STATES[scenario]
  const vpnOn = scenario === 'vpn'
  const httpsOn = scenario === 'https'

  return (
    <svg
      className={styles.svg}
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Under the nodes */}
      {vpnOn && <VpnTunnelPipe reveal={tunnelReveal} reduced={reduced} />}
      {httpsOn && <HttpsBracket />}
      <SnooperTapLine />
      <Link segment="router-vpn" state={links['router-vpn']} />
      <Link
        segment="vpn-dest"
        state={links['vpn-dest']}
        label={vpnOn ? copy.diagram.regularInternet : undefined}
        labelAt={layout.regularInternetLabel}
        labelCovered={covered(covers.regularInternet)}
      />
      <Link segment="you-router" state={links['you-router']} />
      <Link segment="router-dest" state={links['router-dest']} />

      {/* Nodes */}
      <NetworkNode id="you" art={LaptopArt} label={copy.diagram.you} labelPlacement={labels.you.placement} />
      <NetworkNode id="router" art={RouterArt} label={copy.diagram.router} labelPlacement={labels.router.placement} />
      <NetworkNode
        id="vpn"
        art={VpnServerArt}
        label={copy.diagram.vpn}
        tone={vpnOn ? 'secure' : 'default'}
        dimmed={!vpnOn}
        labelPlacement={labels.vpn.placement}
        labelDx={labels.vpn.dx}
        labelCovered={covered(covers.vpnLabel)}
      />
      <NetworkNode
        id="dest"
        art={ServerArt}
        label={copy.diagram.dest}
        sublabel={ADDRESSES.destHost}
        labelPlacement={labels.dest.placement}
        labelDx={labels.dest.dx}
      />
      <SnooperNode />

      {/* Above the nodes */}
      {vpnOn && <VpnTunnelMarks reveal={tunnelReveal} labelCovered={covered(covers.tunnel)} />}
      {delivered > 0 && <DeliveredLabel opacity={delivered} />}
      {children}
    </svg>
  )
}

/** "✓ Delivered" next to the destination (position from the layout). */
function DeliveredLabel({ opacity }: { opacity: number }) {
  const { x, y, anchor } = useDiagramLayout().delivered
  const iconX = anchor === 'end' ? x + 4 : x - 28
  return (
    <g className={styles.delivered} opacity={opacity}>
      <Check x={iconX} y={y - 19} width={22} height={22} strokeWidth={3} aria-hidden="true" />
      <text className={styles.deliveredText} x={x} y={y} textAnchor={anchor}>
        {copy.diagram.delivered}
      </text>
    </g>
  )
}
