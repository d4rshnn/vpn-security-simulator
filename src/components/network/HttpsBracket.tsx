import { copy } from '../../content/copy'
import { useDiagramLayout } from './layoutContext'
import styles from './Network.module.css'

/** Rev 4: a thin blue hairline along the whole direct route, with a small label. No tunnel, no chip. */
export function HttpsBracket() {
  const { from, to, label } = useDiagramLayout().httpsLine
  return (
    <g>
      <path className={styles.bracket} d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`} />
      <text
        className={styles.bracketLabel}
        x={label.x}
        y={label.y}
        textAnchor={label.anchor}
        transform={label.rotate ? `rotate(${label.rotate} ${label.x} ${label.y})` : undefined}
      >
        {copy.diagram.httpsBracket}
      </text>
    </g>
  )
}
