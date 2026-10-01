import type { LucideIcon } from 'lucide-react'
import type { Point } from '../../simulation/network'
import styles from './Network.module.css'

interface IconBadgeProps {
  at: Point
  icon: LucideIcon
  r?: number
}

/** A small round seal with an icon, e.g. the locks at the tunnel ends. */
export function IconBadge({ at, icon: Icon, r = 18 }: IconBadgeProps) {
  const size = r * 1.1
  return (
    <g className={styles.badgeIcon}>
      <circle className={styles.badge} cx={at.x} cy={at.y} r={r} />
      <Icon x={at.x - size / 2} y={at.y - size / 2} width={size} height={size} strokeWidth={2.5} aria-hidden="true" />
    </g>
  )
}
