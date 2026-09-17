import { useEffect, useRef } from 'react'

const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000 // 60 minutes

/**
 * Hook that auto-triggers a callback after a period of user inactivity.
 * Listens for DOM interaction events (touch, click, input, keydown, scroll)
 * on the document and resets the timer on each activity.
 *
 * Mobile browsers suspend timers while the app is in the background, so the
 * elapsed idle time is also checked against a timestamp when the page becomes
 * visible again instead of simply restarting the countdown.
 *
 * @param onTimeout - Called once when the inactivity threshold is reached
 * @param enabled - Set to false to pause the timer (e.g. during completion)
 */
export function useInactivityTimer(
  onTimeout: () => void,
  enabled: boolean = true
): void {
  const onTimeoutRef = useRef(onTimeout)

  // Keep callback ref up-to-date without causing effect re-runs
  useEffect(() => {
    onTimeoutRef.current = onTimeout
  }, [onTimeout])

  useEffect(() => {
    if (!enabled) return

    let timer: ReturnType<typeof setTimeout> | null = null
    let lastActivity = Date.now()
    let fired = false

    const fire = () => {
      if (fired) return
      fired = true
      onTimeoutRef.current()
    }

    const schedule = (delayMs: number) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(fire, delayMs)
    }

    const handleActivity = () => {
      if (fired) return
      lastActivity = Date.now()
      schedule(INACTIVITY_TIMEOUT_MS)
    }

    const handleVisibility = () => {
      if (fired || document.visibilityState !== 'visible') return
      const remaining = INACTIVITY_TIMEOUT_MS - (Date.now() - lastActivity)
      if (remaining <= 0) {
        fire()
      } else {
        schedule(remaining)
      }
    }

    schedule(INACTIVITY_TIMEOUT_MS)

    const events = ['pointerdown', 'keydown', 'input'] as const
    events.forEach((event) => document.addEventListener(event, handleActivity, { passive: true }))
    // scroll does not bubble from inner scroll containers, so listen in the capture phase
    document.addEventListener('scroll', handleActivity, { passive: true, capture: true })
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      if (timer) clearTimeout(timer)
      events.forEach((event) => document.removeEventListener(event, handleActivity))
      document.removeEventListener('scroll', handleActivity, { capture: true })
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [enabled])
}
