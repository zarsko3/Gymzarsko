import { useState, useEffect } from 'react'
import type { Workout, WorkoutType } from '../types'
import {
  getCurrentWorkout,
  startWorkout as startWorkoutService,
  updateWorkout as updateWorkoutService,
  completeWorkout as completeWorkoutService,
  cancelWorkout as cancelWorkoutService,
} from '../services/workoutServiceFacade'

export const useWorkout = () => {
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load current workout on mount
  useEffect(() => {
    let isMounted = true

    const loadWorkout = async () => {
      try {
        setError(null)
        const workout = await getCurrentWorkout()
        if (isMounted) {
          setCurrentWorkout(workout)
        }
      } catch (err) {
        console.error('Error loading current workout:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load workout'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadWorkout()

    return () => {
      isMounted = false
    }
  }, [])

  // Start a new workout
  const startWorkout = async (type: WorkoutType) => {
    try {
      setError(null)
      const workout = await startWorkoutService(type)
      setCurrentWorkout(workout)
      return workout
    } catch (err) {
      console.error('Error starting workout:', err)
      const error = err instanceof Error ? err : new Error('Failed to start workout')
      setError(error)
      throw error
    }
  }

  // Update current workout
  const updateWorkout = async (workout: Workout) => {
    try {
      setError(null)
      await updateWorkoutService(workout)
      setCurrentWorkout(workout)
    } catch (err) {
      console.error('Error updating workout:', err)
      const error = err instanceof Error ? err : new Error('Failed to update workout')
      setError(error)
      throw error
    }
  }

  // Complete workout
  const completeWorkout = async () => {
    if (!currentWorkout) return null
    try {
      setError(null)
      const completed = await completeWorkoutService(currentWorkout)
      setCurrentWorkout(null)
      return completed
    } catch (err) {
      console.error('Error completing workout:', err)
      const error = err instanceof Error ? err : new Error('Failed to complete workout')
      setError(error)
      throw error
    }
  }

  // Cancel workout
  const cancelWorkout = async () => {
    if (!currentWorkout) return
    try {
      setError(null)
      await cancelWorkoutService(currentWorkout.id)
      setCurrentWorkout(null)
    } catch (err) {
      console.error('Error cancelling workout:', err)
      const error = err instanceof Error ? err : new Error('Failed to cancel workout')
      setError(error)
      throw error
    }
  }

  // Clear error
  const clearError = () => setError(null)

  return {
    currentWorkout,
    isLoading,
    error,
    startWorkout,
    updateWorkout,
    completeWorkout,
    cancelWorkout,
    clearError,
    hasActiveWorkout: currentWorkout !== null,
  }
}
