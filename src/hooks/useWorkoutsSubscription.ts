import { useEffect, useState } from 'react'
import type { Workout } from '../types'
import { subscribeToWorkouts } from '../services/workoutServiceFacade'

interface WorkoutsSubscriptionResult {
  workouts: Workout[]
  isLoading: boolean
  error: Error | null
}

export function useWorkoutsSubscription(): WorkoutsSubscriptionResult {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    setIsLoading(true)

    const unsubscribe = subscribeToWorkouts(
      (data) => {
        setWorkouts(data)
        setIsLoading(false)
        setError(null)
      },
      (err) => {
        const normalizedError = err instanceof Error ? err : new Error(String(err))
        console.error('Workout subscription error:', normalizedError)
        setError(normalizedError)
        setIsLoading(false)
      }
    )

    return () => {
      unsubscribe()
    }
  }, [])

  return { workouts, isLoading, error }
}

