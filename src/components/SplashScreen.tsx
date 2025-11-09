import { useEffect, useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface SplashScreenProps {
  minDurationMs?: number
  onePerSession?: boolean
}

export default function SplashScreen({
  minDurationMs = 900,
  onePerSession = true,
}: SplashScreenProps) {
  const [show, setShow] = useState(true)
  const shouldReduceMotion = useReducedMotion() ?? false

  useEffect(() => {
    if (onePerSession && sessionStorage.getItem('splashShown')) {
      setShow(false)
      return
    }

    const t = setTimeout(() => {
      setShow(false)
      if (onePerSession) sessionStorage.setItem('splashShown', '1')
    }, minDurationMs)

    return () => clearTimeout(t)
  }, [minDurationMs, onePerSession])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[9999] bg-[var(--bg-primary)] flex items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={shouldReduceMotion ? { duration: 0.1 } : { duration: 0.35, ease: 'easeOut' }}
        >
          {/* Logo container */}
          <motion.img
            src="/Logo.png"
            alt="Gymzarski"
            className="w-40 h-40 object-contain select-none z-10 relative"
            initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
          />

          {/* Subtle breathing glow behind the logo - theme-aware */}
          {!shouldReduceMotion && (
            <>
              {/* Light mode glow */}
              <motion.div
                className="absolute w-48 h-48 rounded-full bg-primary-500/10 dark:bg-primary-400/20 blur-3xl"
                initial={{ opacity: 0.0, scale: 0.8 }}
                animate={{ opacity: 1, scale: [0.9, 1.05, 0.9] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              />
              {/* Additional subtle glow for depth in dark mode */}
              <motion.div
                className="absolute w-64 h-64 rounded-full bg-primary-500/5 dark:bg-primary-500/10 blur-3xl"
                initial={{ opacity: 0.0, scale: 0.7 }}
                animate={{ opacity: 1, scale: [0.85, 1.1, 0.85] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              />
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

