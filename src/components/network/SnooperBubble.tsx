import { Lock, TriangleAlert } from 'lucide-react'
import { copy } from '../../content/copy'
import { wrapMessage } from '../../simulation/packetText'
import type { RevealField, SnooperView } from '../../simulation/scenarios'
import { useDiagramLayout } from './layoutContext'
import { NODE_HEIGHT, NODE_WIDTH } from './NetworkNode'
import styles from './Network.module.css'

/*
 * The snooper "speaks" in a quiet bubble.
 * "Noticed traffic" as soon as the copy leaves the router; the content once it arrives.
 * Laptop: to the right of the snooper, tail on the left. Phone (compact): below it, tail on top.
 */

interface SnooperBubbleProps {
  seen: SnooperView
  revealed: ReadonlySet<RevealField>
}

const TAIL = 14

/** A rounded rectangle with a small tail pointing at (tipX, tipY), on its left or top side. */
function bubblePath(x: number, y: number, w: number, h: number, side: 'left' | 'top', tipX: number, tipY: number, r = 18) {
  const top =
    side === 'top'
      ? [`H ${tipX - TAIL}`, `L ${tipX} ${tipY}`, `L ${tipX + TAIL} ${y}`, `H ${x + w - r}`]
      : [`H ${x + w - r}`]
  const left = side === 'left' ? [`V ${tipY + TAIL}`, `L ${tipX} ${tipY}`, `L ${x} ${tipY - TAIL}`, `V ${y + r}`] : [`V ${y + r}`]
  return [
    `M ${x + r} ${y}`,
    ...top,
    `A ${r} ${r} 0 0 1 ${x + w} ${y + r}`,
    `V ${y + h - r}`,
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    ...left,
    `A ${r} ${r} 0 0 1 ${x + r} ${y}`,
    'Z',
  ].join(' ')
}

export function SnooperBubble({ seen, revealed }: SnooperBubbleProps) {
  const layout = useDiagramLayout()
  const snooper = layout.nodes.snooper
  const { compact, width: W } = layout.bubble
  const PAD = compact ? 14 : 22
  const lineH = compact ? 26 : 32
  const iconSize = compact ? 0 : 24 // compact: no icon in front of the lines (narrow bubble)
  const textX = (x: number) => x + PAD + (iconSize ? iconSize + 10 : 0)

  const messageLines = seen.readable && seen.message ? wrapMessage(`“${seen.message}”`, compact ? 17 : 30, compact ? 3 : 2) : []
  const noteLines = seen.canStillSeeNote ? (compact ? wrapMessage(copy.bubble.stillSees, 16, 3) : [copy.bubble.stillSees]) : []
  // What the snooper captured (HTTPS / VPN): "Inside: 8F 4A 91 C7 2B 0E …". On a phone it wraps onto two short lines.
  const insideLines = seen.inside
    ? compact
      ? [`${copy.bubble.inside} ${seen.inside.split(' ').slice(0, 3).join(' ')}`, seen.inside.split(' ').slice(3).join(' ')].filter(Boolean)
      : [`${copy.bubble.inside} ${seen.inside}`]
    : []
  const rows = seen.readable ? messageLines.length : 2 + insideLines.length
  const headerH = compact ? 46 : 58
  const h = headerH + rows * lineH + noteLines.length * (compact ? 25 : 32) + (compact ? 12 : 6)

  // Laptop: centred on the snooper, to its right. Phone: below it (position from the layout).
  const tipX = compact ? snooper.x : snooper.x + NODE_WIDTH / 2 + 8
  const x = compact ? layout.bubble.x : tipX + 22
  const y = compact ? layout.bubble.y : Math.min(snooper.y - h / 2, layout.viewBox.height - 4 - h)
  const tipY = compact ? snooper.y + NODE_HEIGHT / 2 + 44 : Math.min(Math.max(snooper.y, y + 30), y + h - 30)
  const line = (i: number) => y + headerH + 20 + i * lineH
  const noteY = (i: number) => y + headerH + 22 + rows * lineH + i * (compact ? 25 : 32)

  return (
    <g className={`${styles.bubble} ${compact ? styles.bubbleCompact : ''}`} aria-hidden="true">
      <path className={styles.bubbleShape} d={bubblePath(x, y, W, h, compact ? 'top' : 'left', tipX, compact ? y - 12 : tipY)} />
      <circle className={styles.bubbleDot} cx={x + PAD + 5} cy={y + (compact ? 24 : 30)} r={5} />
      <text className={styles.bubbleHeader} x={x + PAD + 18} y={y + (compact ? 30 : 37)}>
        {compact ? copy.bubble.noticed : copy.bubble.noticed.toUpperCase()}
      </text>

      {seen.readable && revealed.has('content') && (
        <g className={`${styles.bubbleReadable} ${styles.bubbleIn}`}>
          {!compact && <TriangleAlert x={x + PAD} y={line(0) - 21} width={24} height={24} strokeWidth={2.25} aria-hidden="true" />}
          {messageLines.map((text, i) => (
            <text key={i} className={styles.bubbleMessage} x={textX(x)} y={line(i)}>
              {text}
            </text>
          ))}
        </g>
      )}

      {!seen.readable && revealed.has('address') && seen.address && (
        <g className={`${styles.bubbleSealed} ${styles.bubbleIn}`}>
          {!compact && <Lock x={x + PAD} y={line(0) - 21} width={24} height={24} strokeWidth={2.25} aria-hidden="true" />}
          <text className={styles.bubbleAddress} x={textX(x)} y={line(0)}>
            {copy.diagram.envelopeTo(seen.address)}
          </text>
        </g>
      )}
      {!seen.readable && revealed.has('content') && (
        <text className={`${styles.bubbleCantOpen} ${styles.bubbleIn}`} x={textX(x)} y={line(1)}>
          {copy.bubble.cantOpen}
        </text>
      )}
      {!seen.readable &&
        revealed.has('bytes') &&
        insideLines.map((text, i) => (
          <text key={i} className={`${styles.bubbleBytes} ${styles.bubbleIn}`} x={textX(x)} y={line(2 + i)}>
            {text}
          </text>
        ))}
      {revealed.has('note') &&
        noteLines.map((text, i) => (
          <text key={i} className={`${styles.bubbleNote} ${styles.bubbleIn}`} x={x + PAD} y={noteY(i)}>
            {text}
          </text>
        ))}
    </g>
  )
}
