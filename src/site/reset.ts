import { createContext, useContext } from 'react'

// reset() is provided by the Root in main.tsx; it bumps sessionKey to remount the website.
export const ResetContext = createContext<() => void>(() => {})

export function useReset(): () => void {
  return useContext(ResetContext)
}
