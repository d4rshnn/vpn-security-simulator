import { Lock } from 'lucide-react'
import { IconBadge } from './IconBadge'
import { NodeTile } from './NetworkNode'
import { LaptopArt, VpnServerArt } from './NodeIllustrations'
import styles from './Network.module.css'

/** Decorative static emblem for the Intro: laptop —tunnel— VPN server, in the diagram's style. */
export function IntroEmblem() {
  const d = 'M 64 66 L 356 66'
  return (
    <svg className={styles.emblem} viewBox="0 0 420 132" aria-hidden="true">
      <path className={styles.tunnelWalls} d={d} />
      <path className={styles.tunnelBody} d={d} />
      <path className={styles.tunnelRings} d={d} />
      <path className={`${styles.link} ${styles.linkVpn}`} d={d} />
      <NodeTile x={64} y={66} art={LaptopArt} />
      <NodeTile x={356} y={66} art={VpnServerArt} tone="secure" />
      <IconBadge at={{ x: 210, y: 66 }} icon={Lock} />
    </svg>
  )
}
