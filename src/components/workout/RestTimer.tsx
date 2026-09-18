import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Timer } from 'lucide-react'
import { hapticSuccess } from '../../utils/haptic'

export const DEFAULT_REST_SECONDS = 90

interface RestTimerProps {
  /** Timestamp (ms) the rest started, or null when no rest is running */
  startedAt: number | null
  durationSeconds: number
  onExtend: (seconds: number) => void
  onDismiss: () => void
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Countdown bar shown above the bottom navigation after completing a set.
 * Time is derived from a timestamp, so it stays correct if the phone
 * throttles timers while the screen is off.
 *
 * Rendered into <body>: pages sit inside an animated wrapper with
 * `will-change: transform`, which would pin a fixed element to the bottom of
 * the page instead of the bottom of the screen.
 */
function RestTimer({ startedAt, durationSeconds, onExtend, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(durationSeconds)

  useEffect(() => {
    if (startedAt === null) return

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setRemaining(Math.max(0, durationSeconds - elapsed))
    }

    tick()
    const interval = window.setInterval(tick, 500)
    return () => window.clearInterval(interval)
  }, [startedAt, durationSeconds])

  // Buzz once when the rest is over, then clear the bar shortly after
  useEffect(() => {
    if (startedAt === null || remaining > 0) return

    hapticSuccess()
    const timeout = window.setTimeout(onDismiss, 5000)
    return () => window.clearTimeout(timeout)
  }, [startedAt, remaining, onDismiss])

  if (startedAt === null) return null

  const isDone = remaining === 0
  const progress = Math.min(100, Math.max(0, (remaining / durationSeconds) * 100))

  return createPortal(
    <div
      className="fixed left-0 right-0 z-40 px-4 pointer-events-none"
      style={{ bottom: 'calc(64px + env(safe-area-inset-bottom, 0px) + 8px)' }}
      role="status"
      aria-live="polite"
    >
      <div className="max-w-md mx-auto bg-card border-2 border-primary-500 rounded-xl shadow-lg overflow-hidden pointer-events-auto">
        <div className="flex items-center gap-3 px-4 py-3">
          <Timer size={20} className="text-primary-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-lg font-semibold text-[var(--text-primary)] tabular-nums">
              {isDone ? 'Rest done' : formatTime(remaining)}
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              {isDone ? 'Ready for the next set' : 'Rest'}
            </div>
          </div>
          <button
            onClick={() => onExtend(30)}
            className="px-3 min-h-[44px] rounded-lg bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm font-medium hover:opacity-80"
            type="button"
          >
            +30s
          </button>
          <button
            onClick={onDismiss}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            aria-label="Skip rest"
            type="button"
          >
            <X size={20} />
          </button>
        </div>
        <div className="h-1 bg-[var(--bg-secondary)]">
          <div
            className="h-full bg-primary-500 transition-[width] duration-500 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}

export default RestTimer
