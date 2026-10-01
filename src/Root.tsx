import { useCallback, useState } from 'react'
import App from './App.tsx'
import { ResetContext } from './site/reset'

// Reset = full remount: bumping sessionKey discards all state, timers and animation loops.
export function Root() {
  const [sessionKey, setSessionKey] = useState(0)
  const reset = useCallback(() => setSessionKey((k) => k + 1), [])
  return (
    <ResetContext.Provider value={reset}>
      <App key={sessionKey} />
    </ResetContext.Provider>
  )
}
