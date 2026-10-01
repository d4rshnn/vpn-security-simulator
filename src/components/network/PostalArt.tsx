import type { Scenario } from '../../site/types'
import { PostalItem } from './PostalItem'
import styles from './Network.module.css'

/*
 * A still picture of each scenario's postal item, for the Summary cards (same SVG as the Simulate screen):
 *   HTTP  = the postcard with the visitor's message
 *   HTTPS = the sealed blue envelope "To: vjti-chat.example"
 *   VPN   = the sealed blue envelope peeking out of the open teal envelope "To: VPN server"
 */
const FRAME: Record<Scenario, { sealed: number; wrapped: number; y: number }> = {
  insecure: { sealed: 0, wrapped: 0, y: 112 },
  https: { sealed: 1, wrapped: 0, y: 112 },
  vpn: { sealed: 1, wrapped: 0.32, y: 132 },
}

export function PostalArt({ scenario, message }: { scenario: Scenario; message: string }) {
  const f = FRAME[scenario]
  return (
    <svg className={styles.art} viewBox="0 0 420 224" aria-hidden="true">
      <PostalItem
        variant="still"
        at={{ x: 210, y: f.y }}
        opacity={1}
        message={message}
        written={1}
        sealed={f.sealed}
        wrapped={f.wrapped}
        reduced={false}
      />
    </svg>
  )
}
