import { getWorkouts } from './firestoreWorkoutService'
import type { Workout } from '../types'

interface ExercisePR {
  exerciseId: string
  exerciseName: string
  maxWeight: number
  maxReps: number
  date: Date
}

interface ExerciseHistoryEntry {
  exerciseId: string
  exerciseName: string
  weight: number
  reps: number
  date: Date
  workoutType: string
  isPR: boolean
  maxWeight: number
  maxReps: number
}

/**
 * Get personal records for all exercises
 */
export async function getExercisePRs(): Promise<ExercisePR[]> {
  const allWorkouts = await getWorkouts()
  const prs: Record<string, ExercisePR> = {}

  allWorkouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      ex.sets.forEach(set => {
        if (set.completed && set.weight && set.reps) {
          const currentPR = prs[ex.exercise.id]
          
          if (
            !currentPR ||
            set.weight > currentPR.maxWeight ||
            (set.weight === currentPR.maxWeight && set.reps > currentPR.maxReps)
          ) {
            prs[ex.exercise.id] = {
              exerciseId: ex.exercise.id,
              exerciseName: ex.exercise.name,
              maxWeight: set.weight,
              maxReps: set.reps,
              date: workout.date,
            }
          }
        }
      })
    })
  })

  return Object.values(prs)
}

/**
 * Get exercise history for a specific exercise
 */
export async function getExerciseHistory(exerciseId: string): Promise<ExerciseHistoryEntry[]> {
  const allWorkouts = await getWorkouts()
  const history: ExerciseHistoryEntry[] = []

  allWorkouts.forEach(workout => {
    workout.exercises.forEach(ex => {
      if (ex.exercise.id === exerciseId) {
        // Find max weight/reps for this exercise in this workout
        let maxWeightInWorkout = 0
        let maxRepsInWorkout = 0

        ex.sets.forEach(set => {
          if (set.completed && set.weight && set.reps) {
            if (set.weight > maxWeightInWorkout) {
              maxWeightInWorkout = set.weight
              maxRepsInWorkout = set.reps
            } else if (set.weight === maxWeightInWorkout && set.reps > maxRepsInWorkout) {
              maxRepsInWorkout = set.reps
            }
          }
        })

        ex.sets.forEach(set => {
          if (set.completed && set.weight && set.reps) {
            history.push({
              exerciseId: ex.exercise.id,
              exerciseName: ex.exercise.name,
              weight: set.weight,
              reps: set.reps,
              date: workout.date,
              workoutType: workout.type,
              isPR: set.weight === maxWeightInWorkout && set.reps === maxRepsInWorkout,
              maxWeight: maxWeightInWorkout,
              maxReps: maxRepsInWorkout,
            })
          }
        })
      }
    })
  })

  // Sort by date, most recent first
  return history.sort((a, b) => b.date.getTime() - a.date.getTime())
}

