import { useEffect, type Dispatch } from 'react'
import { IntroEmblem } from '../components/network/IntroEmblem'
import { copy } from '../content/copy'
import type { SiteAction } from '../site/types'
import styles from './IntroScreen.module.css'

interface IntroScreenProps {
  dispatch: Dispatch<SiteAction>
}

// Keys that never start the simulation: Esc (reset), lone modifiers, F-keys (F11 = fullscreen).
const IGNORED_KEYS = new Set(['Escape', 'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Fn'])

export function IntroScreen({ dispatch }: IntroScreenProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      if (IGNORED_KEYS.has(e.key) || /^F\d{1,2}$/.test(e.key)) return
      e.preventDefault()
      dispatch({ type: 'START' })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dispatch])

  return (
    <main className={styles.intro} onClick={() => dispatch({ type: 'START' })}>
      <div className={styles.hero}>
        <IntroEmblem />
        <p className={styles.eyebrow}>{copy.intro.subheading}</p>
        <h1 className={styles.heading}>{copy.intro.heading}</h1>
        <p className={styles.prompt}>
          <span className={styles.dot} aria-hidden="true" />
          {copy.intro.prompt}
        </p>
      </div>
    </main>
  )
}
