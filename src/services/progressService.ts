import type { Workout, Exercise, ProgressEntry } from '../types'
import { getWorkouts } from './workoutService'
import { calculateVolume } from '../utils/formatters'

// Get all PRs (Personal Records) for each exercise
export const getExercisePRs = () => {
  const workouts = getWorkouts()
  const prMap = new Map<string, { weight: number; reps: number; date: Date; volume: number }>()

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      const exerciseId = exercise.exercise.id
      const completedSets = exercise.sets.filter(s => s.completed)

      completedSets.forEach(set => {
        const existing = prMap.get(exerciseId)
        const currentVolume = calculateVolume(set.weight, set.reps)

        // PR is based on highest single-set volume
        if (!existing || currentVolume > existing.volume) {
          prMap.set(exerciseId, {
            weight: set.weight,
            reps: set.reps,
            date: workout.date,
            volume: currentVolume,
          })
        }
      })
    })
  })

  return prMap
}

// Get exercise history for a specific exercise
export const getExerciseHistory = (exerciseId: string): ProgressEntry[] => {
  const workouts = getWorkouts()
  const history: ProgressEntry[] = []

  workouts.forEach(workout => {
    const exercise = workout.exercises.find(ex => ex.exercise.id === exerciseId)
    if (exercise) {
      exercise.sets.filter(s => s.completed).forEach(set => {
        history.push({
          id: `${workout.id}-${set.id}`,
          exerciseId,
          date: workout.date,
          weight: set.weight,
          reps: set.reps,
          volume: calculateVolume(set.weight, set.reps),
        })
      })
    }
  })

  return history.sort((a, b) => a.date.getTime() - b.date.getTime())
}

// Get total volume per exercise over time
export const getExerciseVolumeHistory = (exerciseId: string) => {
  const workouts = getWorkouts()
  const volumeByDate = new Map<string, number>()

  workouts.forEach(workout => {
    const exercise = workout.exercises.find(ex => ex.exercise.id === exerciseId)
    if (exercise) {
      const dateKey = workout.date.toISOString().split('T')[0]
      const totalVolume = exercise.sets
        .filter(s => s.completed)
        .reduce((sum, set) => sum + calculateVolume(set.weight, set.reps), 0)
      
      volumeByDate.set(dateKey, (volumeByDate.get(dateKey) || 0) + totalVolume)
    }
  })

  return Array.from(volumeByDate.entries())
    .map(([date, volume]) => ({ date: new Date(date), volume }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

// Get workout frequency stats
export const getWorkoutFrequency = () => {
  const workouts = getWorkouts()
  const frequencyMap = new Map<string, number>()

  workouts.forEach(workout => {
    const dateKey = workout.date.toISOString().split('T')[0]
    frequencyMap.set(dateKey, (frequencyMap.get(dateKey) || 0) + 1)
  })

  return Array.from(frequencyMap.entries())
    .map(([date, count]) => ({ date: new Date(date), count }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

// Get all unique exercises that have been performed
export const getPerformedExercises = (): Exercise[] => {
  const workouts = getWorkouts()
  const exerciseMap = new Map<string, Exercise>()

  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      if (!exerciseMap.has(exercise.exercise.id)) {
        exerciseMap.set(exercise.exercise.id, exercise.exercise)
      }
    })
  })

  return Array.from(exerciseMap.values())
}

