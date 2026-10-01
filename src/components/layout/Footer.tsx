import { copy } from '../../content/copy'
import styles from './Footer.module.css'

export function Footer() {
  return <footer className={styles.footer}>{copy.site.footer}</footer>
}
