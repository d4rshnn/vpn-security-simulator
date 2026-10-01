import { useId, type Dispatch, type FormEvent } from 'react'
import { TriangleAlert, Coffee, ShieldCheck, Wifi } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Chip } from '../components/ui/Chip'
import { copy } from '../content/copy'
import { MAX_MESSAGE_LENGTH, SAMPLE_MESSAGES } from '../content/samples'
import { looksSensitive } from '../simulation/realDataCheck'
import { isMessageAllowed } from '../site/state'
import type { SiteAction } from '../site/types'
import styles from './MessageScreen.module.css'

interface MessageScreenProps {
  message: string
  dispatch: Dispatch<SiteAction>
}

export function MessageScreen({ message, dispatch }: MessageScreenProps) {
  const inputId = useId()
  const counterId = useId()
  const warningId = useId()
  const flagged = looksSensitive(message) !== null
  const canContinue = isMessageAllowed(message)

  function setMessage(value: string) {
    dispatch({ type: 'SET_MESSAGE', message: value })
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!canContinue) return
    setMessage(message.trim())
    dispatch({ type: 'GO', screen: 'simulate' })
  }

  return (
    <section className={styles.screen}>
      <form className={styles.card} onSubmit={submit} autoComplete="off" noValidate>
        <p className={styles.scenario}>
          <span className={styles.icons} aria-hidden="true">
            <Coffee size={28} />
            <Wifi size={28} />
          </span>
          {copy.message.scenario}
        </p>

        <fieldset className={styles.samples}>
          <legend className={styles.label}>{copy.message.pickSample}</legend>
          <div className={styles.chips}>
            {SAMPLE_MESSAGES.map((sample) => (
              <Chip key={sample} label={sample} selected={message === sample} onSelect={() => setMessage(sample)} />
            ))}
          </div>
        </fieldset>

        <div className={styles.field}>
          <label className={styles.label} htmlFor={inputId}>
            {copy.message.inputLabel}
          </label>
          {/* Never type="password" and no name attribute: nothing here is a credential or a form submission. */}
          <input
            id={inputId}
            className={flagged ? `${styles.input} ${styles.inputFlagged}` : styles.input}
            type="text"
            value={message}
            maxLength={MAX_MESSAGE_LENGTH}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={flagged}
            aria-describedby={flagged ? `${counterId} ${warningId}` : counterId}
            onChange={(e) => setMessage(e.target.value)}
          />
          <span id={counterId} className={styles.counter}>
            {copy.message.counter(message.length, MAX_MESSAGE_LENGTH)}
          </span>
        </div>

        {flagged && (
          <p id={warningId} className={styles.warning} role="alert">
            <TriangleAlert size={24} aria-hidden="true" />
            {copy.message.realDataWarning}
          </p>
        )}

        <div className={styles.footer}>
          <p className={styles.safety}>
            <ShieldCheck size={22} aria-hidden="true" />
            {copy.message.safety}
          </p>
          <Button type="submit" variant="primary" disabled={!canContinue}>
            {copy.message.next}
          </Button>
        </div>
      </form>
    </section>
  )
}
