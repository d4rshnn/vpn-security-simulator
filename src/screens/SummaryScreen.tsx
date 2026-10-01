import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, CircleCheck, CircleX, Lock, RotateCcw, Shield, ShieldCheck, TriangleAlert } from 'lucide-react'
import { PostalArt } from '../components/network/PostalArt'
import { Button } from '../components/ui/Button'
import { copy } from '../content/copy'
import { useReset } from '../site/reset'
import { summaryCards } from '../site/summary'
import type { RunResult, Scenario } from '../site/types'
import styles from './SummaryScreen.module.css'

interface SummaryScreenProps {
  results: Partial<Record<Scenario, RunResult>>
  message: string
}

const ICONS = { insecure: TriangleAlert, https: Lock, vpn: Shield } as const

/** R2: three postal cards, one bottom line, details behind "Learn more", and Start over. */
export function SummaryScreen({ results, message }: SummaryScreenProps) {
  const reset = useReset()
  const titleId = useId()
  const learnId = useId()
  const [open, setOpen] = useState(false)
  const learnRef = useRef<HTMLDivElement>(null)

  // Bring the details into view when they open (no animation under reduced motion).
  useEffect(() => {
    if (!open) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    learnRef.current?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' })
  }, [open])

  return (
    <section className={styles.screen} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.title}>
        {copy.summary.title}
      </h2>

      <ul className={styles.cards}>
        {summaryCards(results).map(({ scenario, ran }) => {
          const Icon = ICONS[scenario]
          return (
            <li key={scenario} className={`${styles.card} ${styles[scenario]} ${ran ? '' : styles.muted}`}>
              <PostalArt scenario={scenario} message={message} />
              <h3 className={styles.cardTitle}>
                <Icon size={22} aria-hidden="true" />
                {copy.simulate.scenarios[scenario]}
              </h3>
              <p className={styles.cardText}>{copy.summary.cards[scenario]}</p>
              {!ran && <p className={styles.notRun}>{copy.summary.notRun}</p>}
            </li>
          )
        })}
      </ul>

      <p className={styles.bottomLine}>{copy.summary.bottomLine}</p>

      <div className={styles.actions}>
        <Button variant="ghost" aria-expanded={open} aria-controls={learnId} onClick={() => setOpen((o) => !o)}>
          <ChevronDown size={20} aria-hidden="true" className={open ? styles.chevronOpen : styles.chevron} />
          {open ? copy.summary.showLess : copy.summary.learnMore}
        </Button>
        <Button variant="primary" className={styles.startOver} onClick={reset}>
          <RotateCcw size={22} aria-hidden="true" />
          {copy.summary.startOver}
        </Button>
      </div>

      {open && (
        <div id={learnId} ref={learnRef} className={styles.learn}>
          <section className={`${styles.list} ${styles.does}`}>
            <h4 className={styles.listTitle}>
              <CircleCheck size={22} aria-hidden="true" />
              {copy.summary.does.title}
            </h4>
            <ul>
              {copy.summary.does.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section className={`${styles.list} ${styles.doesNot}`}>
            <h4 className={styles.listTitle}>
              <CircleX size={22} aria-hidden="true" />
              {copy.summary.doesNot.title}
            </h4>
            <ul>
              {copy.summary.doesNot.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <p className={styles.together}>{copy.summary.together}</p>
        </div>
      )}

      <p className={styles.note}>
        <ShieldCheck size={20} aria-hidden="true" />
        {copy.summary.note}
      </p>
    </section>
  )
}
