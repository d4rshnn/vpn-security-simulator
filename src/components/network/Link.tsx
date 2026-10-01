import { segmentPath, type SegmentId, type TextSpot } from '../../simulation/network'
import { useDiagramLayout } from './layoutContext'
import styles from './Network.module.css'

/** Rev 4: active links take the scenario's accent; readable traffic is amber. */
export type LinkState = 'exposed' | 'https' | 'vpn' | 'dim' | 'tap'

const STATE_CLASS: Record<LinkState, string> = {
  exposed: styles.linkExposed,
  https: styles.linkHttps,
  vpn: styles.linkVpn,
  dim: styles.linkDim,
  tap: styles.linkTap,
}

interface LinkProps {
  segment: SegmentId
  state: LinkState
  label?: string
  /** Where the label sits (from the diagram layout). */
  labelAt?: TextSpot
  /** The moving postal item is over the label: fade it out of the way. */
  labelCovered?: boolean
}

export function Link({ segment, state, label, labelAt, labelCovered = false }: LinkProps) {
  const { nodes } = useDiagramLayout()
  const labelClass = state === 'exposed' ? `${styles.linkLabel} ${styles.linkLabelExposed}` : styles.linkLabel
  return (
    <g>
      <path className={`${styles.link} ${STATE_CLASS[state]}`} d={segmentPath(segment, nodes)} />
      {label && labelAt && (
        <text
          className={`${labelClass} ${styles.fades}`}
          x={labelAt.x}
          y={labelAt.y}
          textAnchor={labelAt.anchor}
          opacity={labelCovered ? 0.15 : 1}
        >
          {label}
        </text>
      )}
    </g>
  )
}
