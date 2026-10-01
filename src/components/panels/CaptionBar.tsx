import { AnimatePresence, motion } from 'motion/react'
import styles from './CaptionBar.module.css'

interface CaptionBarProps {
  text: string
}

/** One large sentence describing the current step; cross-fades when it changes. */
export function CaptionBar({ text }: CaptionBarProps) {
  return (
    <p className={styles.caption} aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={text}
          className={styles.text}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </p>
  )
}
