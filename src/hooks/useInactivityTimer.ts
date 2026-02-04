import { useEffect, useRef, useCallback } from 'react'

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000 // 60 minutes

/**
 * Hook that auto-triggers a callback after a period of user inactivity.
 * Listens for DOM interaction events (touch, click, input, keydown) via
 * event delegation on the document and resets the timer on each activity.
 *
 * @param onTimeout - Called once when the inactivity threshold is reached
 * @param enabled - Set to false to pause the timer (e.g. during completion)
 */
export function useInactivityTimer(
  onTimeout: () => void,
  enabled: boolean = true
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onTimeoutRef = useRef(onTimeout)
  const firedRef = useRef(false)

  // Keep callback ref up-to-date without causing effect re-runs
  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  const resetTimer = useCallback(() => {
    if (firedRef.current) return

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    timerRef.current = setTimeout(() => {
      firedRef.current = true
      onTimeoutRef.current()
    }, INACTIVITY_TIMEOUT_MS)
  }, [])

  useEffect(() => {
    if (!enabled) {
      // Clear timer when disabled
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      return
    }

    // Start the initial timer
    firedRef.current = false
    resetTimer()

    // Reset on any user interaction (event delegation on document)
    const events = ['pointerdown', 'keydown', 'input', 'scroll'] as const
    const handler = () => resetTimer()

    events.forEach((event) => document.addEventListener(event, handler, { passive: true }))

    // Also reset when tab becomes visible again
    const visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        resetTimer()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      events.forEach((event) => document.removeEventListener(event, handler))
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
  }, [enabled, resetTimer])
}
