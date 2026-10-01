import type { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { copy } from '../../content/copy'
import { ADDRESSES, type Point } from '../../simulation/network'
import { ITEM, OUTER, placeItem, postalSize, wrapMessage, writtenLines, type Size } from '../../simulation/packetText'
import { placementOf, useDiagramLayout } from './layoutContext'
import styles from './PostalItem.module.css'

/*
 * Rev 4/5 postal item (original inline SVG):
 *   postcard → (sealed 0→1) the postcard shrinks into the blue HTTPS envelope "To: vjti-chat.example"
 *            → (wrapped 0→1, VPN) the sealed blue envelope slides into a 1.3× teal envelope "To: VPN server",
 *              peeking out of the top before the teal flap closes.
 * Going back (opening) plays the same phases in reverse.
 */

interface PostalItemProps {
  at: Point // the item's spot on the line
  opacity: number
  message: string
  written: number // 0..1 of the message written on the postcard
  sealed: number // blue envelope: 0 = postcard, 1 = sealed
  wrapped: number // teal envelope: 0 = none, 1 = blue envelope sealed inside it
  reduced: boolean
  /** main = on the line with a stem; ghost = the snooper's dashed copy; still = a static picture (Summary). */
  variant?: 'main' | 'ghost' | 'still'
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n))
const ease = (p: number) => (p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2)

function Postcard({ lines }: { lines: string[] }) {
  const { width: W, height: H } = ITEM
  const top = lines.length > 1 ? 50 : 66
  return (
    <g className={styles.postcard}>
      <rect className={styles.paper} width={W} height={H} rx={10} />
      {lines.map((line, i) => (
        <text key={i} className={styles.message} x={18} y={top + i * 32}>
          {line}
        </text>
      ))}
      <line className={styles.divider} x1={214} y1={16} x2={214} y2={104} />
      <rect className={styles.stamp} x={230} y={14} width={54} height={44} rx={3} />
      <circle className={styles.stampMark} cx={257} cy={36} r={9} />
      <line className={styles.addressLine} x1={228} y1={78} x2={286} y2={78} />
      <line className={styles.addressLine} x1={228} y1={92} x2={286} y2={92} />
      <line className={styles.addressLine} x1={228} y1={106} x2={270} y2={106} />
    </g>
  )
}

interface EnvelopeProps {
  size: Size
  accent: 'https' | 'vpn'
  address: string
  /** 0 = open and empty, 1 = sealed with the address showing. */
  p: number
  reduced: boolean
  /** Show the address even while the envelope is still open (Summary picture). */
  addressAlways?: boolean
  /** What goes inside, drawn between the back and the front pocket; gets its own transform. */
  children: (p: number) => ReactNode
}

/** One envelope: back, contents, front pocket, flap, seal + address. Phases follow `p`. */
function Envelope({ size, accent, address, p, reduced, addressAlways = false, children }: EnvelopeProps) {
  const { width: W, height: H } = size
  const back = reduced ? p : clamp01(p / 0.25)
  const flap = reduced ? 1 : clamp01((p - 0.5) / 0.3) // 0 = folded up (open), 1 = closed
  const sealMark = reduced ? p : clamp01((p - 0.8) / 0.2)
  const apex = -0.5 * H + 1.08 * H * ease(flap)
  const k = H / ITEM.height // scale seal + text with the envelope size

  // An open (folded-up) flap sits behind the contents; once it starts closing it comes to the front.
  const flapPath = <path className={styles.flap} d={`M0 0 L${W} 0 L${W / 2} ${apex} Z`} opacity={back} />
  const flapInFront = flap >= 0.5

  return (
    <g className={accent === 'vpn' ? styles.vpn : styles.https}>
      {back > 0 && !flapInFront && flapPath}
      {back > 0 && <rect className={styles.envelopeBack} width={W} height={H} rx={10} opacity={back} />}
      {children(p)}
      {back > 0 && (
        <path
          className={styles.pocket}
          d={`M0 ${H} L0 ${0.15 * H} L${W / 2} ${0.7 * H} L${W} ${0.15 * H} L${W} ${H} Z`}
          opacity={back}
        />
      )}
      {back > 0 && flapInFront && flapPath}
      {addressAlways && sealMark <= 0 && (
        <text className={styles.address} x={W / 2} y={H - 12 * k} textAnchor="middle" fontSize={22 * Math.min(k, 1.15)}>
          {copy.diagram.envelopeTo(address)}
        </text>
      )}
      {sealMark > 0 && (
        <g opacity={sealMark}>
          <circle className={styles.seal} cx={W / 2} cy={0.58 * H} r={19 * k} />
          <Lock
            x={W / 2 - 10 * k}
            y={0.58 * H - 10 * k}
            width={20 * k}
            height={20 * k}
            strokeWidth={2.5}
            className={styles.sealIcon}
            aria-hidden="true"
          />
          <text className={styles.address} x={W / 2} y={H - 12 * k} textAnchor="middle" fontSize={22 * Math.min(k, 1.15)}>
            {copy.diagram.envelopeTo(address)}
          </text>
        </g>
      )}
    </g>
  )
}

export function PostalItem({ at, opacity, message, written, sealed, wrapped, reduced, variant = 'main' }: PostalItemProps) {
  const placement = placementOf(useDiagramLayout())
  if (opacity <= 0.01) return null

  const ghost = variant === 'ghost'
  const still = variant === 'still'
  const lines = writtenLines(wrapMessage(message), written)
  const size = postalSize(wrapped)
  // Laptop: floating above the line on a stem. Phone: centred on the line, scaled down. Ghost/still: centred.
  const placed = placeItem(at, size, placement)
  const centred = { x: at.x - size.width / 2, y: at.y - size.height / 2 }
  const pos = ghost || still ? centred : placed.box
  const scale = still ? 1 : (placement.mode === 'centered' ? placement.scale : 1) * (ghost ? 0.6 : 1)
  const origin = ghost || still ? at : placed.origin
  const stem = variant === 'main' && placement.mode === 'float'
  const isEnvelope = sealed >= 0.5 || wrapped > 0

  // The postcard shrinks into the blue envelope (never pokes out).
  const postcard = (p: number) => {
    const visible = reduced ? 1 - p : p < 0.7 ? 1 : 0
    if (visible <= 0) return null
    const s = reduced ? 0 : ease(clamp01(p / 0.5))
    return (
      <g opacity={visible} transform={`translate(${ITEM.width * 0.1 * s} ${ITEM.height * 0.22 * s}) scale(${1 - 0.2 * s})`}>
        <Postcard lines={lines} />
      </g>
    )
  }

  const blue = (
    <Envelope size={ITEM} accent="https" address={ADDRESSES.destHost} p={sealed} reduced={reduced}>
      {postcard}
    </Envelope>
  )

  // VPN: the sealed blue envelope slides down into the teal one, peeking out of the top until the flap closes.
  // The teal envelope starts lower and rises around it, so the blue envelope never jumps.
  const slideIn = reduced ? 1 : ease(clamp01((wrapped - 0.15) / 0.4))
  const raised = -0.55 * ITEM.height // blue envelope sticking out of the top of the teal one
  const settled = (OUTER.height - ITEM.height) / 2
  const startDrop = placeItem(at, ITEM, placement).box.y - (placeItem(at, OUTER, placement).box.y + raised)
  const drop = wrapped > 0 && variant === 'main' ? startDrop * (1 - slideIn) : 0
  const inner = (p: number) => {
    const visible = reduced ? 1 - p : p < 0.75 ? 1 : 0
    if (visible <= 0) return null
    const dx = (OUTER.width - ITEM.width) / 2
    const y = raised + (settled - raised) * slideIn
    return (
      <g opacity={visible} transform={`translate(${dx} ${y})`}>
        {blue}
      </g>
    )
  }

  return (
    <g
      className={[styles.item, isEnvelope ? styles.sealedState : styles.postcardState, ghost ? styles.ghost : '']
        .filter(Boolean)
        .join(' ')}
      opacity={opacity}
    >
      {stem && (
        <g className={wrapped > 0 ? styles.vpn : sealed >= 0.5 ? styles.https : styles.http}>
          <line className={styles.stem} x1={at.x} y1={at.y - 7} x2={at.x} y2={pos.y + drop + size.height} />
          <circle className={styles.dot} cx={at.x} cy={at.y} r={7} />
        </g>
      )}
      <g
        transform={
          `${scale !== 1 ? `translate(${origin.x} ${origin.y}) scale(${scale}) translate(${-origin.x} ${-origin.y}) ` : ''}` +
          `translate(${pos.x} ${pos.y + drop})`
        }
      >
        {wrapped > 0 ? (
          <Envelope size={OUTER} accent="vpn" address={copy.diagram.vpn} p={wrapped} reduced={reduced} addressAlways={still}>
            {inner}
          </Envelope>
        ) : (
          blue
        )}
      </g>
    </g>
  )
}
