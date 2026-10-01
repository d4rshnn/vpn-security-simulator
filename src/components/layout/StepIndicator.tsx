import { Fragment } from 'react'
import { Check, ChevronRight } from 'lucide-react'
import { copy } from '../../content/copy'
import styles from './StepIndicator.module.css'

interface StepIndicatorProps {
  current: number // index into copy.site.steps
}

/**
 * Display-only progress indicator: "1 Message → 2 Simulate → 3 Summary".
 * Plain text, not buttons: no hover or pointer, and it is not navigable (Reset and the screens' own buttons are).
 */
export function StepIndicator({ current }: StepIndicatorProps) {
  return (
    <ol className={styles.steps} aria-label={copy.site.progress}>
      {copy.site.steps.map((label, i) => {
        const state = i === current ? styles.current : i < current ? styles.done : styles.upcoming
        return (
          <Fragment key={label}>
            {i > 0 && (
              <li className={styles.arrow} aria-hidden="true">
                <ChevronRight size={16} />
              </li>
            )}
            <li className={`${styles.step} ${state}`} aria-current={i === current ? 'step' : undefined}>
              <span className={styles.number} aria-hidden="true">
                {i < current ? <Check size={14} strokeWidth={3} /> : i + 1}
              </span>
              <span className={styles.label}>{label}</span>
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
