import { useState, useEffect } from 'react'
import type { Workout, WorkoutType } from '../types'
import {
  getCurrentWorkout,
  startWorkout as startWorkoutService,
  updateCurrentWorkout,
  completeWorkout as completeWorkoutService,
  cancelWorkout as cancelWorkoutService,
} from '../services/workoutService'

export const useWorkout = () => {
  const [currentWorkout, setCurrentWorkout] = useState<Workout | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load current workout on mount
  useEffect(() => {
    const workout = getCurrentWorkout()
    setCurrentWorkout(workout)
    setIsLoading(false)
  }, [])

  // Start a new workout
  const startWorkout = (type: WorkoutType) => {
    const workout = startWorkoutService(type)
    setCurrentWorkout(workout)
    return workout
  }

  // Update current workout
  const updateWorkout = (workout: Workout) => {
    updateCurrentWorkout(workout)
    setCurrentWorkout(workout)
  }

  // Complete workout
  const completeWorkout = () => {
    if (currentWorkout) {
      completeWorkoutService(currentWorkout)
      setCurrentWorkout(null)
    }
  }

  // Cancel workout
  const cancelWorkout = () => {
    cancelWorkoutService()
    setCurrentWorkout(null)
  }

  return {
    currentWorkout,
    isLoading,
    startWorkout,
    updateWorkout,
    completeWorkout,
    cancelWorkout,
    hasActiveWorkout: currentWorkout !== null,
  }
}

