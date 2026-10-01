import { copy } from '../../content/copy'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>{copy.site.footer}</span>
      <span className={styles.dot} aria-hidden="true">
        ·
      </span>
      <span>{copy.site.credit}</span>
    </footer>
  )
}
