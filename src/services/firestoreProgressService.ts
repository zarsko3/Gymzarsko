import { getWorkouts } from './workoutServiceFacade'
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

/**
 * Get latest weight and reps for an exercise by name
 * Returns the most recent completed set data for the exercise
 * Workouts are already sorted by date descending from getWorkouts()
 */
export async function getLatestExerciseData(exerciseName: string): Promise<{ weight: number; reps: number } | null> {
  try {
    const allWorkouts = await getWorkouts()
    
    // Workouts are already sorted by date descending (most recent first)
    // Find the most recent workout that contains this exercise with completed sets
    for (const workout of allWorkouts) {
      const exercise = workout.exercises.find(
        ex => ex.exercise.name.toLowerCase() === exerciseName.toLowerCase()
      )
      
      if (exercise) {
        // Find completed sets with actual data
        const completedSets = exercise.sets.filter(
          set => set.completed && set.weight > 0 && set.reps > 0
        )
        
        if (completedSets.length > 0) {
          // Get the set with the highest weight (or most recent if weights are equal)
          // For simplicity, we'll use the first completed set from the most recent workout
          // In practice, you might want to average or use the last set
          const latestSet = completedSets[completedSets.length - 1]
          return {
            weight: latestSet.weight,
            reps: latestSet.reps,
          }
        }
      }
    }
    
    return null
  } catch (error) {
    console.error('Error getting latest exercise data:', error)
    return null
  }
}

