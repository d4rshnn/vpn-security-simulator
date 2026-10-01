/*
 * Custom node illustrations in one Lucide-like style: 48×48 grid, round caps and joins,
 * stroke = currentColor. Each renders as a nested <svg> positioned inside the diagram.
 */
import type { ReactNode } from 'react'
import styles from './Network.module.css'

interface IllustrationProps {
  x: number
  y: number
  size: number
}

export type Illustration = (props: IllustrationProps) => ReactNode

function Frame({ x, y, size, children }: IllustrationProps & { children: ReactNode }) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

/** Laptop with a small message bubble on screen. */
export function LaptopArt(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <path d="M40 31V13a4 4 0 0 0-4-4H12a4 4 0 0 0-4 4v18" />
      <path d="M8 31h32l2.6 5.1A2 2 0 0 1 40.8 39H7.2a2 2 0 0 1-1.8-2.9z" />
      <path d="M17 14h14a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-8l-4 3v-3h-2a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2z" />
    </Frame>
  )
}

/** Wi-Fi router: body with status lights, signal arcs above. */
export function RouterArt(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <path d="M11.5 15a17.5 17.5 0 0 1 25 0" />
      <path d="M16.5 20a10.5 10.5 0 0 1 15 0" />
      <circle cx="24" cy="24.5" r="1.6" fill="currentColor" stroke="none" />
      <rect x="6" y="29" width="36" height="12" rx="3.5" />
      <circle cx="12.5" cy="35" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="35" r="1.4" fill="currentColor" stroke="none" />
      <path d="M26 35h10" />
    </Frame>
  )
}

/** VPN server: two-unit rack with a shield badge. */
export function VpnServerArt(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <rect x="6" y="7" width="28" height="13" rx="3" />
      <rect x="6" y="24" width="28" height="13" rx="3" />
      <circle cx="11.5" cy="13.5" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="11.5" cy="30.5" r="1.4" fill="currentColor" stroke="none" />
      <path d="M17 13.5h11M17 30.5h6" />
      <path
        className={styles.artFill}
        d="M35 23.5l7.5 2.8v5.4c0 4.6-3.2 7.8-7.5 9.3-4.3-1.5-7.5-4.7-7.5-9.3v-5.4z"
      />
      <path d="M31.8 32.4l2.3 2.3 4.2-4.4" />
    </Frame>
  )
}

/** Destination server: three-unit rack. */
export function ServerArt(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <rect x="7" y="6" width="34" height="10" rx="2.5" />
      <rect x="7" y="19" width="34" height="10" rx="2.5" />
      <rect x="7" y="32" width="34" height="10" rx="2.5" />
      <circle cx="12.5" cy="11" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="24" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="12.5" cy="37" r="1.3" fill="currentColor" stroke="none" />
      <path d="M26 11h10M26 24h10M26 37h10" />
    </Frame>
  )
}

/** Snooper: an eye inside a magnifying glass. Watching, not a person. */
export function SnooperArt(props: IllustrationProps) {
  return (
    <Frame {...props}>
      <circle cx="20.5" cy="20.5" r="13.5" />
      <path d="M30.5 30.5L41 41" strokeWidth={4} />
      <path d="M11.5 20.5s3.6-6 9-6 9 6 9 6-3.6 6-9 6-9-6-9-6z" />
      <circle cx="20.5" cy="20.5" r="2.6" fill="currentColor" stroke="none" />
    </Frame>
  )
}
