import { copy } from '../../content/copy'
import { Link } from './Link'
import { NetworkNode } from './NetworkNode'
import { SnooperArt } from './NodeIllustrations'
import { useDiagramLayout } from './layoutContext'

/** Dotted tap line from the router plus the snooper node. Present in every scenario. */
export function SnooperTapLine() {
  return <Link segment="router-snooper" state="tap" />
}

export function SnooperNode() {
  const placement = useDiagramLayout().labels.snooper.placement
  return <NetworkNode id="snooper" art={SnooperArt} label={copy.diagram.snooper} tone="danger" labelPlacement={placement} />
}
