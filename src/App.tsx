import { useReducer, type Dispatch, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { SiteShell } from './components/layout/SiteShell'
import { useHotkeys } from './hooks/useHotkeys'
import { IntroScreen } from './screens/IntroScreen'
import { MessageScreen } from './screens/MessageScreen'
import { SimulateScreen } from './screens/SimulateScreen'
import { SummaryScreen } from './screens/SummaryScreen'
import { useReset } from './site/reset'
import { initialState, siteReducer } from './site/state'
import type { Screen, SiteAction, SiteState } from './site/types'
import styles from './App.module.css'

const STEP_INDEX: Record<Exclude<Screen, 'intro'>, number> = {
  message: 0,
  simulate: 1,
  summary: 2,
}

function renderScreen(state: SiteState, dispatch: Dispatch<SiteAction>): ReactNode {
  switch (state.screen) {
    case 'intro':
      return <IntroScreen dispatch={dispatch} />
    case 'message':
      return <MessageScreen message={state.message} dispatch={dispatch} />
    case 'simulate':
      return <SimulateScreen state={state} dispatch={dispatch} />
    case 'summary':
      return <SummaryScreen results={state.results} message={state.message} />
  }
}

function App() {
  const [state, dispatch] = useReducer(siteReducer, initialState)
  const reset = useReset()
  // On Intro there is nothing to reset, and any key (including R) starts instead.
  useHotkeys(state.screen === 'intro' ? {} : { r: reset, Escape: reset })

  const content = (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={state.screen}
        className={styles.screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {renderScreen(state, dispatch)}
      </motion.div>
    </AnimatePresence>
  )

  return (
    <MotionConfig reducedMotion="user">
      {state.screen === 'intro' ? content : <SiteShell step={STEP_INDEX[state.screen]}>{content}</SiteShell>}
    </MotionConfig>
  )
}

export default App
