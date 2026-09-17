import type { Workout } from '../types'
import { toDateSafe } from './formatters'

// A workout still open this long after it started was left behind, not in progress
export const ABANDONED_WORKOUT_AFTER_MS = 6 * 60 * 60 * 1000

export function getWorkoutStart(workout: Workout): Date | null {
  return toDateSafe(workout.startTime) ?? toDateSafe(workout.date)
}

export function hasCompletedSets(workout: Workout): boolean {
  return workout.exercises.some((exercise) => exercise.sets.some((set) => set.completed))
}

export function isAbandonedWorkout(workout: Workout, now: number = Date.now()): boolean {
  if (workout.completed) return false
  const start = getWorkoutStart(workout)
  return !!start && now - start.getTime() >= ABANDONED_WORKOUT_AFTER_MS
}

/** Most recently started workout that is still in progress */
export function findActiveWorkout(workouts: Workout[], now: number = Date.now()): Workout | null {
  let active: Workout | null = null
  let activeStart = -Infinity
  for (const workout of workouts) {
    if (workout.completed || isAbandonedWorkout(workout, now)) continue
    const start = getWorkoutStart(workout)?.getTime() ?? -Infinity
    if (start > activeStart) {
      active = workout
      activeStart = start
    }
  }
  return active
}

/** Workouts shown with an "N/A" duration: missing a start or end time */
export function isMissingDuration(workout: Workout): boolean {
  return !toDateSafe(workout.startTime) || !toDateSafe(workout.endTime)
}

/** Workouts without a duration, excluding the one currently in progress */
export function findWorkoutsWithoutDuration(workouts: Workout[], now: number = Date.now()): Workout[] {
  const active = findActiveWorkout(workouts, now)
  return workouts.filter((workout) => workout.id !== active?.id && isMissingDuration(workout))
}
