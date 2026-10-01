import { Check } from 'lucide-react'
import styles from './Chip.module.css'

interface ChipProps {
  label: string
  selected: boolean
  onSelect: () => void
}

export function Chip({ label, selected, onSelect }: ChipProps) {
  return (
    <button
      type="button"
      className={selected ? `${styles.chip} ${styles.selected}` : styles.chip}
      aria-pressed={selected}
      onClick={onSelect}
    >
      {selected && <Check size={18} strokeWidth={2.5} aria-hidden="true" />}
      {label}
    </button>
  )
}
