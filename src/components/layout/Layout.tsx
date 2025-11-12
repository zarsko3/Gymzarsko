import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import BottomNav from './BottomNav'

interface LayoutProps {
  children: ReactNode
}

// Container variants for staggered children
const getContainerVariants = (shouldReduceMotion: boolean) => ({
  initial: {},
  animate: {
    transition: shouldReduceMotion ? {} : {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
  exit: {},
})

function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const shouldReduceMotion = useReducedMotion() ?? false

  // Page transition variants - respect reduced motion
  const pageVariants = {
    initial: shouldReduceMotion ? {} : {
      opacity: 0,
      y: 8,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: shouldReduceMotion ? {} : {
      opacity: 0,
      y: -8,
    },
  }

  const pageTransition = shouldReduceMotion ? { duration: 0 } : {
    duration: 0.22,
    ease: [0.16, 1, 0.3, 1] as const, // easeOut cubic bezier
  }

  return (
    <div className="flex flex-col min-h-[100dvh] max-w-full w-full" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* Main content area */}
      <main 
        className="flex-1 overflow-y-auto overflow-x-hidden w-full"
        style={{
          paddingTop: 'max(env(safe-area-inset-top, 0px), 8px)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            className="max-w-md mx-auto w-full overflow-x-hidden px-0"
            variants={getContainerVariants(shouldReduceMotion)}
            initial="initial"
            animate="animate"
            exit="exit"
            style={{ isolation: 'isolate' }}
          >
            <motion.div
              variants={pageVariants}
              transition={pageTransition}
              style={{ willChange: 'transform, opacity', isolation: 'isolate' }}
            >
              {children}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </div>
  )
}

export default Layout

