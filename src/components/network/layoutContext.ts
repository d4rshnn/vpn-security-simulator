import { createContext, useContext } from 'react'
import { LANDSCAPE, type DiagramLayout } from '../../simulation/network'
import type { Placement } from '../../simulation/packetText'

/** The diagram layout in use (landscape on laptops, portrait on phones). Set by the Simulate screen. */
export const LayoutContext = createContext<DiagramLayout>(LANDSCAPE)

export function useDiagramLayout(): DiagramLayout {
  return useContext(LayoutContext)
}

export function placementOf(layout: DiagramLayout): Placement {
  return { mode: layout.item.mode, scale: layout.item.scale, viewWidth: layout.viewBox.width }
}
