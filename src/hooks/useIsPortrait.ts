import { useSyncExternalStore } from 'react'

/** Phones and portrait screens get the vertical diagram (R2 Part C). Must match the CSS media query. */
const PORTRAIT_QUERY = '(max-width: 767px), (orientation: portrait)'

function subscribe(onChange: () => void): () => void {
  const mq = window.matchMedia?.(PORTRAIT_QUERY)
  mq?.addEventListener('change', onChange)
  return () => mq?.removeEventListener('change', onChange)
}

export function useIsPortrait(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia?.(PORTRAIT_QUERY).matches ?? false,
    () => false,
  )
}
