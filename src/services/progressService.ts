import type { Workout, Exercise, ProgressEntry } from '../types'
import { getWorkouts as fetchWorkouts } from './workoutServiceFacade'
import { calculateVolume } from '../utils/formatters'

export type ExercisePr = {
  weight: number
  reps: number
  date: Date
  volume: number
}

const resolveWorkouts = async (workouts?: Workout[]): Promise<Workout[]> => {
  if (workouts) {
    return workouts
  }
  try {
    return await fetchWorkouts()
  } catch (error) {
    console.error('Error loading workouts for progress calculations:', error)
    return []
  }
}

// Get all PRs (Personal Records) for each exercise
export const getExercisePRs = async (
  workouts?: Workout[],
): Promise<Map<string, ExercisePr>> => {
  const workoutList = await resolveWorkouts(workouts)
  const prMap = new Map<string, ExercisePr>()

  workoutList.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      const exerciseId = exercise.exercise.id
      const completedSets = exercise.sets.filter((s) => s.completed)

      completedSets.forEach((set) => {
        const existing = prMap.get(exerciseId)
        const currentVolume = calculateVolume(set.weight, set.reps)

        // PR is based on highest single-set volume
        if (!existing || currentVolume > existing.volume) {
          prMap.set(exerciseId, {
            weight: set.weight,
            reps: set.reps,
            date: workout.date instanceof Date ? workout.date : new Date(workout.date),
            volume: currentVolume,
          })
        }
      })
    })
  })

  return prMap
}

// Get exercise history for a specific exercise
export const getExerciseHistory = async (
  exerciseId: string,
  workouts?: Workout[],
): Promise<ProgressEntry[]> => {
  const workoutList = await resolveWorkouts(workouts)
  const history: ProgressEntry[] = []

  workoutList.forEach((workout) => {
    const exercise = workout.exercises.find((ex) => ex.exercise.id === exerciseId)
    if (exercise) {
      exercise.sets
        .filter((s) => s.completed)
        .forEach((set) => {
          history.push({
            id: `${workout.id}-${set.id}`,
            exerciseId,
            date: workout.date instanceof Date ? workout.date : new Date(workout.date),
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
export const getExerciseVolumeHistory = async (
  exerciseId: string,
  workouts?: Workout[],
): Promise<Array<{ date: Date; volume: number }>> => {
  const workoutList = await resolveWorkouts(workouts)
  const volumeByDate = new Map<string, number>()

  workoutList.forEach((workout) => {
    const exercise = workout.exercises.find((ex) => ex.exercise.id === exerciseId)
    if (exercise) {
      const dateKey = (workout.date instanceof Date ? workout.date : new Date(workout.date))
        .toISOString()
        .split('T')[0]
      const totalVolume = exercise.sets
        .filter((s) => s.completed)
        .reduce((sum, set) => sum + calculateVolume(set.weight, set.reps), 0)

      volumeByDate.set(dateKey, (volumeByDate.get(dateKey) || 0) + totalVolume)
    }
  })

  return Array.from(volumeByDate.entries())
    .map(([date, volume]) => ({ date: new Date(date), volume }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

// Get workout frequency stats
export const getWorkoutFrequency = async (
  workouts?: Workout[],
): Promise<Array<{ date: Date; count: number }>> => {
  const workoutList = await resolveWorkouts(workouts)
  const frequencyMap = new Map<string, number>()

  workoutList.forEach((workout) => {
    const dateKey = (workout.date instanceof Date ? workout.date : new Date(workout.date))
      .toISOString()
      .split('T')[0]
    frequencyMap.set(dateKey, (frequencyMap.get(dateKey) || 0) + 1)
  })

  return Array.from(frequencyMap.entries())
    .map(([date, count]) => ({ date: new Date(date), count }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

// Get all unique exercises that have been performed
export const getPerformedExercises = async (workouts?: Workout[]): Promise<Exercise[]> => {
  const workoutList = await resolveWorkouts(workouts)
  const exerciseMap = new Map<string, Exercise>()

  workoutList.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      if (!exerciseMap.has(exercise.exercise.id)) {
        exerciseMap.set(exercise.exercise.id, exercise.exercise)
      }
    })
  })

  return Array.from(exerciseMap.values())
}

