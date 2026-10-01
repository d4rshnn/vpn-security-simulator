import { describe, expect, it } from 'vitest'
import {
  ADDRESSES,
  NODES,
  ROUTES,
  SCENARIO_ROUTE,
  SEGMENTS,
  TUNNEL_NODES,
  VIEWBOX,
  pathThrough,
  pointOnSegment,
  segmentPath,
  LAYOUTS,
  type SegmentId,
} from '../simulation/network'

describe('network geometry (spec §H)', () => {
  it('uses the spec viewBox and node coordinates', () => {
    expect(VIEWBOX).toEqual({ width: 1200, height: 520 })
    expect(NODES).toEqual({
      you: { x: 100, y: 250 },
      router: { x: 400, y: 250 },
      vpn: { x: 760, y: 180 },
      dest: { x: 1100, y: 250 },
      snooper: { x: 400, y: 430 },
    })
  })

  it('keeps every node inside the viewBox', () => {
    for (const { x, y } of Object.values(NODES)) {
      expect(x).toBeGreaterThan(0)
      expect(x).toBeLessThan(VIEWBOX.width)
      expect(y).toBeGreaterThan(0)
      expect(y).toBeLessThan(VIEWBOX.height)
    }
  })

  it('only connects nodes that exist', () => {
    for (const { from, to } of Object.values(SEGMENTS)) {
      expect(NODES[from]).toBeDefined()
      expect(NODES[to]).toBeDefined()
    }
  })
})

describe('routes', () => {
  function nodesOf(route: readonly SegmentId[]) {
    return [SEGMENTS[route[0]].from, ...route.map((id) => SEGMENTS[id].to)]
  }

  it('are connected chains', () => {
    for (const route of Object.values(ROUTES)) {
      for (let i = 1; i < route.length; i++) {
        expect(SEGMENTS[route[i]].from).toBe(SEGMENTS[route[i - 1]].to)
      }
    }
  })

  it('DIRECT goes you → router → dest; VPN goes you → router → vpn → dest; TAP goes router → snooper', () => {
    expect(nodesOf(ROUTES.DIRECT)).toEqual(['you', 'router', 'dest'])
    expect(nodesOf(ROUTES.VPN)).toEqual(['you', 'router', 'vpn', 'dest'])
    expect(nodesOf(ROUTES.TAP)).toEqual(['router', 'snooper'])
  })

  it('maps Insecure and HTTPS to DIRECT, VPN to VPN', () => {
    expect(SCENARIO_ROUTE).toEqual({ insecure: 'DIRECT', https: 'DIRECT', vpn: 'VPN' })
  })

  it('draws the tunnel from You through the router to the VPN server', () => {
    expect(TUNNEL_NODES).toEqual(['you', 'router', 'vpn'])
  })
})

describe('simulated addresses', () => {
  it('match the spec and come from documentation/private ranges', () => {
    expect(ADDRESSES).toEqual({
      you: '192.168.1.23',
      cafePublic: '198.51.100.50',
      vpn: '203.0.113.10',
      vpnHost: 'vpn.example',
      dest: '198.51.100.7',
      destHost: 'vjti-chat.example',
    })
    expect(ADDRESSES.you).toMatch(/^192\.168\./)
    for (const ip of [ADDRESSES.cafePublic, ADDRESSES.vpn, ADDRESSES.dest]) {
      expect(ip).toMatch(/^(198\.51\.100|203\.0\.113)\./)
    }
    for (const host of [ADDRESSES.vpnHost, ADDRESSES.destHost]) {
      expect(host).toMatch(/\.example$/)
    }
  })
})

describe('path helpers', () => {
  it('builds SVG path data', () => {
    expect(segmentPath('you-router')).toBe('M 100 250 L 400 250')
    expect(pathThrough(['you', 'router', 'vpn'])).toBe('M 100 250 L 400 250 L 760 180')
  })

  it('interpolates along a segment', () => {
    expect(pointOnSegment('you-router', 0)).toEqual({ x: 100, y: 250 })
    expect(pointOnSegment('you-router', 0.5)).toEqual({ x: 250, y: 250 })
    expect(pointOnSegment('router-vpn', 1)).toEqual({ x: 760, y: 180 })
  })
})

describe('diagram layouts (R2 Part C)', () => {
  const ALL = [LAYOUTS.landscape, LAYOUTS.portrait]

  it('landscape is exactly the original coordinates', () => {
    expect(LAYOUTS.landscape.nodes).toBe(NODES)
    expect(LAYOUTS.landscape.viewBox).toEqual(VIEWBOX)
  })

  it.each(ALL)('$name: every node sits inside its viewBox with room for a tile', (layout) => {
    for (const { x, y } of Object.values(layout.nodes)) {
      expect(x).toBeGreaterThanOrEqual(42)
      expect(x).toBeLessThanOrEqual(layout.viewBox.width - 42)
      expect(y).toBeGreaterThanOrEqual(40)
      expect(y).toBeLessThanOrEqual(layout.viewBox.height - 40)
    }
  })

  it('portrait is vertical: You (top) → Café Wi-Fi → VPN server → Destination server (bottom)', () => {
    const n = LAYOUTS.portrait.nodes
    expect(n.you.y).toBeLessThan(n.router.y)
    expect(n.router.y).toBeLessThan(n.vpn.y)
    expect(n.vpn.y).toBeLessThan(n.dest.y)
    expect(n.snooper.y).toBe(n.router.y) // beside the Café Wi-Fi
    expect(LAYOUTS.portrait.viewBox.height).toBeGreaterThan(LAYOUTS.portrait.viewBox.width)
  })

  it.each(ALL)('$name: the VPN server is off the direct route, so the two routes look different', (layout) => {
    const { router, dest, vpn } = layout.nodes
    const t = (vpn.y - router.y) / (dest.y - router.y || 1)
    const onDirect = { x: router.x + (dest.x - router.x) * t, y: router.y + (dest.y - router.y) * t }
    expect(Math.hypot(vpn.x - onDirect.x, vpn.y - onDirect.y)).toBeGreaterThan(50)
  })

  it.each(ALL)('$name: path helpers use the layout\'s own nodes', (layout) => {
    const { you, router } = layout.nodes
    expect(segmentPath('you-router', layout.nodes)).toBe(`M ${you.x} ${you.y} L ${router.x} ${router.y}`)
    expect(pointOnSegment('you-router', 1, layout.nodes)).toEqual(router)
  })
})
