import type { ReactNode } from 'react'
import { Footer } from './Footer'
import { TopBar } from './TopBar'
import styles from './SiteShell.module.css'

interface SiteShellProps {
  step: number
  children: ReactNode
}

/** Persistent frame for every screen except Intro. */
export function SiteShell({ step, children }: SiteShellProps) {
  return (
    <div className={styles.shell}>
      <TopBar step={step} />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  )
}
