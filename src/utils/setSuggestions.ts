import type { Workout, WorkoutExercise, WorkoutSet } from '../types'
import { mockExercises } from '../services/mockData'
import { getTopSet, type LastSession } from '../services/firestoreProgressService'

export interface SetValues {
  weight: number
  reps: number
}

export interface RepRange {
  min: number
  max: number
}

/** "8-10" or "8-10 / leg" -> { min: 8, max: 10 } */
export function parseRepRange(range: string | undefined): RepRange | null {
  const match = range?.match(/(\d+)\s*-\s*(\d+)/)
  if (!match) return null
  const min = Number(match[1])
  const max = Number(match[2])
  return min > 0 && max >= min ? { min, max } : null
}

/**
 * Target rep range for an exercise. Workouts store a copy of the exercise, so
 * ones started before a range was added fall back to the current catalog.
 */
export function getRepRange(exercise: WorkoutExercise): RepRange | null {
  const own = parseRepRange(exercise.exercise.repRange)
  if (own) return own
  const catalogEntry = mockExercises.find(
    (entry) =>
      entry.id === exercise.exerciseId ||
      entry.name.toLowerCase() === exercise.exercise.name.toLowerCase()
  )
  return parseRepRange(catalogEntry?.repRange)
}

// Big lower-body lifts progress in larger jumps
const LARGE_INCREMENT_PATTERN = /squat|deadlift|leg press|hip thrust/i

export function getWeightIncrement(exerciseName: string): number {
  return LARGE_INCREMENT_PATTERN.test(exerciseName) ? 5 : 2.5
}

export interface Progression extends SetValues {
  increment: number
  /** Reps reached on every set last time */
  topReps: number
}

/**
 * Double progression: once every set of the last session reached the top of the
 * rep range, add weight and aim for the bottom of the range again.
 */
export function getProgression(
  session: LastSession | undefined,
  range: RepRange | null,
  exerciseName: string
): Progression | null {
  const topSet = getTopSet(session)
  if (!session || !range || !topSet) return null
  if (!session.sets.every((set) => set.reps >= range.max)) return null

  const increment = getWeightIncrement(exerciseName)
  return {
    weight: topSet.weight + increment,
    reps: range.min,
    increment,
    topReps: range.max,
  }
}

/**
 * What to show greyed out in a set's fields: the previous set of this workout if
 * it has numbers, otherwise the applied progression, otherwise last session's top set.
 */
export function getSetSuggestion(
  sets: WorkoutSet[],
  setIndex: number,
  base: SetValues | null
): SetValues | null {
  for (let i = setIndex - 1; i >= 0; i--) {
    const previous = sets[i]
    if (previous.weight > 0 || previous.reps > 0) {
      return { weight: previous.weight, reps: previous.reps }
    }
  }
  return base
}

/** Accepting a set fills any empty field from the suggestion */
export function fillFromSuggestion(set: WorkoutSet, suggestion: SetValues | null): WorkoutSet {
  if (!suggestion) return set
  return {
    ...set,
    weight: set.weight > 0 ? set.weight : suggestion.weight,
    reps: set.reps > 0 ? set.reps : suggestion.reps,
  }
}

export interface UnloggedSets {
  exerciseName: string
  count: number
}

/** Sets with numbers typed in but not marked done — they would silently not count */
export function findUnmarkedSets(workout: Workout): UnloggedSets[] {
  return workout.exercises
    .map((exercise) => ({
      exerciseName: exercise.exercise.name,
      count: exercise.sets.filter((set) => !set.completed && (set.weight > 0 || set.reps > 0)).length,
    }))
    .filter((entry) => entry.count > 0)
}

export function markSetsWithNumbersDone(workout: Workout): Workout {
  return {
    ...workout,
    exercises: workout.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) =>
        !set.completed && (set.weight > 0 || set.reps > 0) ? { ...set, completed: true } : set
      ),
    })),
  }
}
