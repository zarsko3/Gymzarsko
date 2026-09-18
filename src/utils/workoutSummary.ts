import type { Workout, WorkoutExercise } from '../types'
import { toDateSafe } from './formatters'

interface TopSet {
  weight: number
  reps: number
}

function workoutTime(workout: Workout): number {
  return (toDateSafe(workout.startTime) ?? toDateSafe(workout.date))?.getTime() ?? 0
}

/** Completed workouts that happened before this one, newest first */
function earlierWorkouts(workout: Workout, all: Workout[]): Workout[] {
  const time = workoutTime(workout)
  return all
    .filter((other) => other.id !== workout.id && other.completed && workoutTime(other) < time)
    .sort((a, b) => workoutTime(b) - workoutTime(a))
}

function completedSets(exercise: WorkoutExercise) {
  return exercise.sets.filter((set) => set.completed && set.weight > 0 && set.reps > 0)
}

/** Heaviest completed set; ties go to the one with more reps */
export function getTopSet(exercise: WorkoutExercise): TopSet | null {
  return completedSets(exercise).reduce<TopSet | null>((top, set) => {
    if (!top || set.weight > top.weight || (set.weight === top.weight && set.reps > top.reps)) {
      return { weight: set.weight, reps: set.reps }
    }
    return top
  }, null)
}

const sameExercise = (a: WorkoutExercise, b: WorkoutExercise) =>
  a.exercise.name.toLowerCase() === b.exercise.name.toLowerCase()

// ── Totals and comparison with the previous workout of the same type ──

export interface WorkoutTotals {
  durationMinutes: number | null
  sets: number
  volume: number
}

export function getWorkoutTotals(workout: Workout): WorkoutTotals {
  const start = toDateSafe(workout.startTime)
  const end = toDateSafe(workout.endTime)
  let sets = 0
  let volume = 0
  for (const exercise of workout.exercises) {
    for (const set of completedSets(exercise)) {
      sets++
      volume += set.weight * set.reps
    }
  }
  return {
    durationMinutes: start && end ? Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)) : null,
    sets,
    volume,
  }
}

export interface WorkoutComparison {
  previous: WorkoutTotals
  durationMinutes: number | null
  sets: number
  volume: number
}

export function compareWithPreviousOfType(workout: Workout, all: Workout[]): WorkoutComparison | null {
  const previousWorkout = earlierWorkouts(workout, all).find((other) => other.type === workout.type)
  if (!previousWorkout) return null

  const current = getWorkoutTotals(workout)
  const previous = getWorkoutTotals(previousWorkout)
  return {
    previous,
    durationMinutes:
      current.durationMinutes !== null && previous.durationMinutes !== null
        ? current.durationMinutes - previous.durationMinutes
        : null,
    sets: current.sets - previous.sets,
    volume: current.volume - previous.volume,
  }
}

// ── Records broken in this workout ──

export interface SessionRecord {
  exerciseName: string
  weight: number
  reps: number
  kind: 'weight' | 'reps'
  /** kg added for a weight record, reps added for a reps record */
  improvement: number
}

/**
 * Weight record: heavier than ever before. Reps record: more reps than ever at
 * the heaviest weight used. Exercises with no earlier history don't count.
 */
export function getSessionRecords(workout: Workout, all: Workout[]): SessionRecord[] {
  const history = earlierWorkouts(workout, all)
  const records: SessionRecord[] = []

  for (const exercise of workout.exercises) {
    const top = getTopSet(exercise)
    if (!top) continue

    let bestWeight = 0
    let repsAtBest = 0
    for (const past of history) {
      for (const pastExercise of past.exercises) {
        if (!sameExercise(pastExercise, exercise)) continue
        for (const set of completedSets(pastExercise)) {
          if (set.weight > bestWeight) {
            bestWeight = set.weight
            repsAtBest = set.reps
          } else if (set.weight === bestWeight && set.reps > repsAtBest) {
            repsAtBest = set.reps
          }
        }
      }
    }
    if (bestWeight === 0) continue

    if (top.weight > bestWeight) {
      records.push({ exerciseName: exercise.exercise.name, ...top, kind: 'weight', improvement: top.weight - bestWeight })
    } else if (top.weight === bestWeight && top.reps > repsAtBest) {
      records.push({ exerciseName: exercise.exercise.name, ...top, kind: 'reps', improvement: top.reps - repsAtBest })
    }
  }

  return records
}

// ── Per-exercise trend vs the last time it was done ──

export type Trend = 'up' | 'same' | 'down'

export function getExerciseTrend(exercise: WorkoutExercise, workout: Workout, all: Workout[]): Trend | null {
  const top = getTopSet(exercise)
  if (!top) return null

  for (const past of earlierWorkouts(workout, all)) {
    const pastExercise = past.exercises.find((candidate) => sameExercise(candidate, exercise))
    const pastTop = pastExercise ? getTopSet(pastExercise) : null
    if (!pastTop) continue

    if (top.weight > pastTop.weight || (top.weight === pastTop.weight && top.reps > pastTop.reps)) return 'up'
    if (top.weight === pastTop.weight && top.reps === pastTop.reps) return 'same'
    return 'down'
  }
  return null
}
