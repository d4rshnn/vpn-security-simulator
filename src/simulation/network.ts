/*
 * Static network model (PROJECT_SPEC.md §H). Pure data, no React.
 * Coordinates are SVG user units inside viewBox 0 0 1200 520.
 */
import type { Scenario } from '../site/types'

export const VIEWBOX = { width: 1200, height: 520 } as const

export type NodeId = 'you' | 'router' | 'vpn' | 'dest' | 'snooper'

export interface Point {
  x: number
  y: number
}

export const NODES: Record<NodeId, Point> = {
  you: { x: 100, y: 250 },
  router: { x: 400, y: 250 },
  vpn: { x: 760, y: 180 }, // Rev 4/5: moved down (was y=90) so the postal items, incl. the 1.3× VPN envelope, stay inside the diagram
  dest: { x: 1100, y: 250 },
  snooper: { x: 400, y: 430 },
}

// Documentation-only addresses and domains (RFC 5737, RFC 1918, RFC 2606): never real.
export const ADDRESSES = {
  you: '192.168.1.23',
  cafePublic: '198.51.100.50',
  vpn: '203.0.113.10',
  vpnHost: 'vpn.example',
  dest: '198.51.100.7',
  destHost: 'vjti-chat.example',
} as const

export type SegmentId = 'you-router' | 'router-dest' | 'router-vpn' | 'vpn-dest' | 'router-snooper'

export const SEGMENTS: Record<SegmentId, { from: NodeId; to: NodeId }> = {
  'you-router': { from: 'you', to: 'router' },
  'router-dest': { from: 'router', to: 'dest' },
  'router-vpn': { from: 'router', to: 'vpn' },
  'vpn-dest': { from: 'vpn', to: 'dest' },
  'router-snooper': { from: 'router', to: 'snooper' },
}

type RouteId = 'DIRECT' | 'VPN' | 'TAP'

export const ROUTES: Record<RouteId, readonly SegmentId[]> = {
  DIRECT: ['you-router', 'router-dest'], // Insecure and HTTPS
  VPN: ['you-router', 'router-vpn', 'vpn-dest'], // you→vpn inside the tunnel; vpn→dest "regular internet"
  TAP: ['router-snooper'], // ghost copy, all scenarios
}

export const SCENARIO_ROUTE: Record<Scenario, 'DIRECT' | 'VPN'> = {
  insecure: 'DIRECT',
  https: 'DIRECT',
  vpn: 'VPN',
}

/** The part of the VPN route drawn inside the tunnel: You → router → VPN server. */
export const TUNNEL_NODES: readonly NodeId[] = ['you', 'router', 'vpn']

export function segmentPath(id: SegmentId, nodes: Record<NodeId, Point> = NODES): string {
  const { from, to } = SEGMENTS[id]
  return pathThrough([from, to], nodes)
}

export function pathThrough(ids: readonly NodeId[], nodes: Record<NodeId, Point> = NODES): string {
  return ids.map((id, i) => `${i === 0 ? 'M' : 'L'} ${nodes[id].x} ${nodes[id].y}`).join(' ')
}

/** A point a fraction `t` (0..1) of the way along a segment. */
export function pointOnSegment(id: SegmentId, t: number, nodes: Record<NodeId, Point> = NODES): Point {
  const a = nodes[SEGMENTS[id].from]
  const b = nodes[SEGMENTS[id].to]
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

/* ------------------------------------------------------------------------------------------------
 * R2 Part C: two diagram layouts. Landscape (laptop, primary) is exactly the coordinates above;
 * portrait (phones) stacks the route vertically: You (top) → Café Wi-Fi → (VPN server, offset) →
 * Destination server (bottom), with the snooper beside the Café Wi-Fi and its bubble below it.
 * ---------------------------------------------------------------------------------------------- */

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

type Anchor = 'start' | 'middle' | 'end'
export type LabelPlacement = 'below' | 'above' | 'left' | 'right'

export interface TextSpot {
  x: number
  y: number
  anchor: Anchor
  rotate?: number // degrees, around (x, y)
}

export interface DiagramLayout {
  name: 'landscape' | 'portrait'
  viewBox: { width: number; height: number }
  nodes: Record<NodeId, Point>
  labels: Record<NodeId, { placement: LabelPlacement; dx?: number }>
  tunnelLabel: TextSpot
  httpsLine: { from: Point; to: Point; label: TextSpot }
  regularInternetLabel: TextSpot
  delivered: TextSpot // the check icon sits just before the text
  bubble: { x: number; y: number; width: number; compact: boolean } // compact: smaller text, tail on top
  item: { mode: 'float' | 'centered'; scale: number } // float = above the line on a stem; centered = on the line
  covers: { tunnel: Rect; regularInternet: Rect; vpnLabel: Rect } // labels that fade under the moving item
}

export const LANDSCAPE: DiagramLayout = {
  name: 'landscape',
  viewBox: VIEWBOX,
  nodes: NODES,
  labels: {
    you: { placement: 'below' },
    router: { placement: 'below' },
    vpn: { placement: 'above' },
    dest: { placement: 'below', dx: -30 },
    snooper: { placement: 'below' },
  },
  tunnelLabel: { x: 250, y: 204, anchor: 'middle' },
  httpsLine: { from: { x: 100, y: 272 }, to: { x: 1100, y: 272 }, label: { x: 750, y: 302, anchor: 'middle' } },
  regularInternetLabel: { x: 950, y: 185, anchor: 'start' },
  delivered: { x: 1036, y: 382, anchor: 'start' },
  bubble: { x: 478, y: 0, width: 452, compact: false },
  item: { mode: 'float', scale: 1 },
  covers: {
    tunnel: { x: 120, y: 180, width: 260, height: 30 },
    regularInternet: { x: 950, y: 163, width: 190, height: 28 },
    vpnLabel: { x: 690, y: 104, width: 140, height: 28 },
  },
}

const PORTRAIT: DiagramLayout = {
  name: 'portrait',
  viewBox: { width: 400, height: 720 },
  nodes: {
    you: { x: 290, y: 50 },
    router: { x: 290, y: 220 },
    vpn: { x: 352, y: 415 },
    dest: { x: 290, y: 610 },
    snooper: { x: 70, y: 220 },
  },
  labels: {
    you: { placement: 'right' },
    router: { placement: 'below' },
    vpn: { placement: 'below', dx: -16 }, // clear of the snooper bubble on the left
    dest: { placement: 'below' },
    snooper: { placement: 'below' },
  },
  tunnelLabel: { x: 236, y: 140, anchor: 'end' },
  httpsLine: { from: { x: 258, y: 50 }, to: { x: 258, y: 610 }, label: { x: 236, y: 300, anchor: 'start', rotate: 90 } },
  regularInternetLabel: { x: 276, y: 560, anchor: 'end' },
  delivered: { x: 210, y: 618, anchor: 'end' },
  bubble: { x: 2, y: 314, width: 232, compact: true }, // right edge 234 < the tunnel's left wall (266)
  item: { mode: 'centered', scale: 0.62 },
  covers: {
    tunnel: { x: 26, y: 118, width: 212, height: 28 },
    regularInternet: { x: 100, y: 540, width: 180, height: 28 },
    vpnLabel: { x: 272, y: 466, width: 128, height: 28 },
  },
}

export const LAYOUTS = { landscape: LANDSCAPE, portrait: PORTRAIT } as const
