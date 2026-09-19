import type { Workout } from '../types'
import { toDateSafe } from '../utils/formatters'
import { startOfWeek, endOfWeek, subWeeks, subDays, startOfDay, isWithinInterval } from 'date-fns'

// ── Home screen summaries ──

export interface WeeklyProgress {
  completed: number
  goal: number
  /** Consecutive weeks (including this one if already met) that hit the goal */
  streakWeeks: number
}

function countCompletedInWeek(workouts: Workout[], weekStart: Date): number {
  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 0 })
  return workouts.filter((workout) => {
    if (!workout.completed) return false
    const date = toDateSafe(workout.date)
    return !!date && isWithinInterval(date, { start: startOfWeek(weekStart, { weekStartsOn: 0 }), end: weekEnd })
  }).length
}

export function getWeeklyProgress(workouts: Workout[], goal: number, now: Date = new Date()): WeeklyProgress {
  const thisWeek = startOfWeek(now, { weekStartsOn: 0 })
  const completed = countCompletedInWeek(workouts, thisWeek)

  // Count back week by week; the current week only breaks the streak once it's over
  let streakWeeks = 0
  let cursor = completed >= goal ? thisWeek : subWeeks(thisWeek, 1)
  while (countCompletedInWeek(workouts, cursor) >= goal) {
    streakWeeks++
    cursor = subWeeks(cursor, 1)
  }

  return { completed, goal, streakWeeks }
}

export interface MuscleGroupVolume {
  muscleGroup: string
  sets: number
}

/** Completed sets per muscle group over the last `days` days, most trained first */
export function getSetsPerMuscleGroup(
  workouts: Workout[],
  days: number = 7,
  now: Date = new Date()
): MuscleGroupVolume[] {
  const since = startOfDay(subDays(now, days - 1))
  const counts = new Map<string, number>()

  for (const workout of workouts) {
    const date = toDateSafe(workout.date)
    if (!workout.completed || !date || date < since) continue

    for (const exercise of workout.exercises) {
      const group = exercise.exercise.muscleGroup?.trim()
      if (!group) continue
      const sets = exercise.sets.filter((set) => set.completed).length
      if (sets > 0) counts.set(group, (counts.get(group) ?? 0) + sets)
    }
  }

  return [...counts.entries()]
    .map(([muscleGroup, sets]) => ({ muscleGroup, sets }))
    .sort((a, b) => b.sets - a.sets)
}

export interface PersonalRecord {
  exerciseName: string
  weight: number
  reps: number
  date: Date
}

/**
 * Personal records set in the last `days` days. An exercise counts only once it
 * has been trained in more than one session, so a first attempt is not a "record".
 */
export function getRecentPersonalRecords(
  workouts: Workout[],
  days: number = 14,
  now: Date = new Date()
): PersonalRecord[] {
  const since = startOfDay(subDays(now, days - 1))
  const best = new Map<string, PersonalRecord>()
  const sessionCount = new Map<string, number>()

  const dated = workouts
    .filter((workout) => workout.completed)
    .map((workout) => ({ workout, date: toDateSafe(workout.date) }))
    .filter((entry): entry is { workout: Workout; date: Date } => !!entry.date)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  for (const { workout, date } of dated) {
    for (const exercise of workout.exercises) {
      const name = exercise.exercise.name
      const key = name.toLowerCase()
      const topSet = exercise.sets
        .filter((set) => set.completed && set.weight > 0 && set.reps > 0)
        .reduce<{ weight: number; reps: number } | null>(
          (top, set) => (!top || set.weight > top.weight ? { weight: set.weight, reps: set.reps } : top),
          null
        )
      if (!topSet) continue

      sessionCount.set(key, (sessionCount.get(key) ?? 0) + 1)
      const current = best.get(key)
      if (!current || topSet.weight > current.weight) {
        best.set(key, { exerciseName: name, weight: topSet.weight, reps: topSet.reps, date })
      }
    }
  }

  return [...best.entries()]
    .filter(([key, record]) => (sessionCount.get(key) ?? 0) > 1 && record.date >= since)
    .map(([, record]) => record)
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}
