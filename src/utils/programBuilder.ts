import type { WorkoutExercise, WorkoutType } from '../types'
import { mockExercises, getDefaultSets } from '../services/mockData'
import type { ProgramSwaps } from '../services/programService'

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function emptySets(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: uid(`set-${i}`),
    weight: 0,
    reps: 0,
    completed: false,
  }))
}

/**
 * The program's exercises for a workout type, with the user's permanent swaps
 * applied. Each entry keeps its program slot so the swap can be undone later.
 */
export function buildProgramExercises(type: WorkoutType, swaps: ProgramSwaps = {}): WorkoutExercise[] {
  const typeSwaps = swaps[type] ?? {}
  return mockExercises
    .filter((exercise) => exercise.category === type)
    .map((programExercise) => {
      const swap = typeSwaps[programExercise.id]
      const exercise = swap
        ? { id: swap.id, name: swap.name, muscleGroup: swap.muscleGroup, category: type, repRange: swap.repRange }
        : programExercise
      return {
        id: uid(`we-${exercise.id}`),
        exerciseId: exercise.id,
        slotId: programExercise.id,
        exercise,
        sets: emptySets(getDefaultSets(programExercise.id)),
      }
    })
}
