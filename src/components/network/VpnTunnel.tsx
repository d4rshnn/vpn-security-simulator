import { Lock } from 'lucide-react'
import { copy } from '../../content/copy'
import { pathThrough, pointOnSegment, TUNNEL_NODES } from '../../simulation/network'
import { useDiagramLayout } from './layoutContext'
import { IconBadge } from './IconBadge'
import styles from './Network.module.css'

const MASK_ID = 'vpn-tunnel-reveal'

interface TunnelProps {
  /** 0..1: how much of the tunnel is drawn (from You towards the VPN server). */
  reveal?: number
  /** Reduced motion: fade in instead of drawing along the route. */
  reduced?: boolean
}

/**
 * Translucent ribbed pipe You → router → VPN server, drawn under the nodes so it passes "through" the router.
 * Layers: walls, dark body, evenly spaced rings (Rev 4: no glow).
 */
export function VpnTunnelPipe({ reveal = 1, reduced = false }: TunnelProps) {
  const { nodes } = useDiagramLayout()
  if (reveal <= 0) return null
  const d = pathThrough(TUNNEL_NODES, nodes)
  const masked = reveal < 1 && !reduced
  return (
    <g>
      {masked && (
        <defs>
          <mask id={MASK_ID} maskUnits="userSpaceOnUse">
            <path
              d={d}
              fill="none"
              stroke="white"
              strokeWidth={90}
              pathLength={1}
              strokeDasharray={`${reveal} 1`}
            />
          </mask>
        </defs>
      )}
      <g mask={masked ? `url(#${MASK_ID})` : undefined} opacity={reduced ? reveal : 1}>
        <path className={styles.tunnelWalls} d={d} />
        <path className={styles.tunnelBody} d={d} />
        <path className={styles.tunnelRings} d={d} />
      </g>
    </g>
  )
}

/** Lock seals at both tunnel ends and the label, drawn above the nodes; fade in as the tunnel completes. */
export function VpnTunnelMarks({ reveal = 1, labelCovered = false }: Pick<TunnelProps, 'reveal'> & { labelCovered?: boolean }) {
  const { nodes, tunnelLabel } = useDiagramLayout()
  const opacity = Math.min(1, Math.max(0, (reveal - 0.7) / 0.3))
  if (opacity <= 0) return null
  return (
    <g opacity={opacity}>
      <IconBadge at={pointOnSegment('you-router', 0.25, nodes)} icon={Lock} />
      <IconBadge at={pointOnSegment('router-vpn', 0.8, nodes)} icon={Lock} />
      <text
        className={`${styles.tunnelLabel} ${styles.fades}`}
        x={tunnelLabel.x}
        y={tunnelLabel.y}
        textAnchor={tunnelLabel.anchor}
        opacity={labelCovered ? 0.15 : 1}
      >
        {copy.diagram.tunnel}
      </text>
    </g>
  )
}
