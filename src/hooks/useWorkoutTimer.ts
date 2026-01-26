import { useEffect, useState } from 'react'

export function useWorkoutTimer(startTime?: Date | null) {
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    if (!startTime) {
      setElapsedTime(0)
      return
    }

    const startMs = startTime.getTime()
    const tick = () => {
      setElapsedTime(Math.max(0, Math.floor((Date.now() - startMs) / 1000)))
    }

    tick()

    const intervalId = window.setInterval(tick, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [startTime])

  return elapsedTime
}

