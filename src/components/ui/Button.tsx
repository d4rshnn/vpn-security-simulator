import type { ButtonHTMLAttributes } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  /** Gently pulse to suggest the next step. */
  pulse?: boolean
}

export function Button({ variant = 'secondary', pulse = false, className, type = 'button', ...rest }: ButtonProps) {
  const classes = [styles.button, styles[variant], pulse ? styles.pulse : '', className].filter(Boolean).join(' ')
  return <button type={type} className={classes} {...rest} />
}
