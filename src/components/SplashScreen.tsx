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
          className="fixed inset-0 z-[9999] bg-[#F8FAFC] flex items-center justify-center"
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

          {/* Subtle breathing glow behind the logo */}
          {!shouldReduceMotion && (
            <motion.div
              className="absolute w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl"
              initial={{ opacity: 0.0, scale: 0.8 }}
              animate={{ opacity: 1, scale: [0.9, 1.05, 0.9] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

