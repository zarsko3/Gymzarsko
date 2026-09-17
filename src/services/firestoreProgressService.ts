import { getWorkouts } from './workoutServiceFacade'

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

type LatestSetData = { weight: number; reps: number }

/**
 * Map of lowercase exercise name -> last completed set from the most recent
 * workout containing that exercise. Fetches workout history once.
 */
export async function getLatestExerciseDataByName(): Promise<Map<string, LatestSetData>> {
  const latest = new Map<string, LatestSetData>()
  try {
    // Workouts are sorted by date descending, so the first match per name wins
    const allWorkouts = await getWorkouts()
    for (const workout of allWorkouts) {
      for (const exercise of workout.exercises) {
        const key = exercise.exercise.name.toLowerCase()
        if (latest.has(key)) continue
        const completedSets = exercise.sets.filter(set => set.completed && set.weight > 0 && set.reps > 0)
        if (completedSets.length > 0) {
          const lastSet = completedSets[completedSets.length - 1]
          latest.set(key, { weight: lastSet.weight, reps: lastSet.reps })
        }
      }
    }
  } catch (error) {
    console.error('Error getting latest exercise data:', error)
  }
  return latest
}

/**
 * Get latest weight and reps for a single exercise by name
 */
export async function getLatestExerciseData(exerciseName: string): Promise<LatestSetData | null> {
  const latest = await getLatestExerciseDataByName()
  return latest.get(exerciseName.toLowerCase()) ?? null
}
