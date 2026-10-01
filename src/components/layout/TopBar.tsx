import { RotateCcw, ShieldCheck } from 'lucide-react'
import { copy } from '../../content/copy'
import { useReset } from '../../site/reset'
import { Button } from '../ui/Button'
import { StepIndicator } from './StepIndicator'
import styles from './TopBar.module.css'

interface TopBarProps {
  step: number
}

export function TopBar({ step }: TopBarProps) {
  const reset = useReset()
  return (
    <header className={styles.bar}>
      <span className={styles.brand}>
        <span className={styles.mark} aria-hidden="true">
          <ShieldCheck size={20} />
        </span>
        <span className={styles.name}>{copy.site.name}</span>
      </span>
      <StepIndicator current={step} />
      <Button variant="ghost" className={styles.reset} onClick={reset} aria-keyshortcuts="R Escape">
        <RotateCcw size={20} aria-hidden="true" />
        {copy.site.reset}
      </Button>
    </header>
  )
}
