import type { LabelPlacement, NodeId } from '../../simulation/network'
import { useDiagramLayout } from './layoutContext'
import type { Illustration } from './NodeIllustrations'
import styles from './Network.module.css'

export const NODE_WIDTH = 96
export const NODE_HEIGHT = 84
const ART = 54

type Tone = 'default' | 'secure' | 'danger'

const TONE_CLASS: Record<Tone, string> = {
  default: '',
  secure: styles.toneSecure,
  danger: styles.toneDanger,
}

interface NodeTileProps {
  x: number
  y: number
  art: Illustration
  tone?: Tone
  dimmed?: boolean
}

/** Rounded tile with a soft state-tinted glow and an illustration. Used by the diagram and the Intro emblem. */
export function NodeTile({ x, y, art: Art, tone = 'default', dimmed = false }: NodeTileProps) {
  const classes = [styles.node, TONE_CLASS[tone], dimmed ? styles.dimmed : ''].filter(Boolean).join(' ')
  const left = x - NODE_WIDTH / 2
  const top = y - NODE_HEIGHT / 2
  return (
    <g className={classes}>
      <rect className={styles.tile} x={left} y={top} width={NODE_WIDTH} height={NODE_HEIGHT} rx={18} />
      <rect className={styles.tileSheen} x={left + 1.5} y={top + 1.5} width={NODE_WIDTH - 3} height={NODE_HEIGHT - 3} rx={16.5} />
      <Art x={x - ART / 2} y={y - ART / 2} size={ART} />
    </g>
  )
}

interface NetworkNodeProps {
  id: NodeId
  art: Illustration
  label: string
  sublabel?: string
  dimmed?: boolean
  tone?: Tone
  labelPlacement?: LabelPlacement
  /** Horizontal nudge for long labels near the diagram edge or a crossing line. */
  labelDx?: number
  /** The moving postal item is over the label: fade it out of the way. */
  labelCovered?: boolean
}

export function NetworkNode({
  id,
  art,
  label,
  sublabel,
  dimmed = false,
  tone = 'default',
  labelPlacement = 'below',
  labelDx = 0,
  labelCovered = false,
}: NetworkNodeProps) {
  const { x, y } = useDiagramLayout().nodes[id]
  const side = labelPlacement === 'right' || labelPlacement === 'left'
  const labelX =
    (labelPlacement === 'right' ? x + NODE_WIDTH / 2 + 14 : labelPlacement === 'left' ? x - NODE_WIDTH / 2 - 14 : x) +
    labelDx
  const labelY = side ? y + 9 : labelPlacement === 'above' ? y - NODE_HEIGHT / 2 - 14 : y + NODE_HEIGHT / 2 + 30
  const anchor = labelPlacement === 'right' ? 'start' : labelPlacement === 'left' ? 'end' : 'middle'

  return (
    <g className={dimmed ? styles.dimmedGroup : undefined}>
      <NodeTile x={x} y={y} art={art} tone={tone} dimmed={dimmed} />
      <text
        className={`${styles.label} ${styles.fades}`}
        x={labelX}
        y={labelY}
        textAnchor={anchor}
        opacity={labelCovered ? 0.15 : 1}
      >
        {label}
      </text>
      {sublabel && (
        <text className={styles.sublabel} x={labelX} y={labelY + 26} textAnchor={anchor}>
          {sublabel}
        </text>
      )}
    </g>
  )
}
