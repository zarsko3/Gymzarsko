import {
  addMonths,
  addWeeks,
  differenceInCalendarWeeks,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import type { Workout, WorkoutExercise, WorkoutType } from '../types'
import { toDateSafe } from './formatters'
import { getSessionRecords } from './workoutSummary'

export type ProgressPeriod = '4w' | '3m' | '1y'

export const PERIOD_LABELS: Record<ProgressPeriod, string> = {
  '4w': '4 weeks',
  '3m': '3 months',
  '1y': 'Year',
}

/** Epley estimate of a one-rep max, rounded to 0.5 kg */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0
  const estimate = reps === 1 ? weight : weight * (1 + reps / 30)
  return Math.round(estimate * 2) / 2
}

interface DatedWorkout {
  workout: Workout
  date: Date
}

function completedByDate(workouts: Workout[]): DatedWorkout[] {
  return workouts
    .filter((workout) => workout.completed)
    .map((workout) => ({ workout, date: toDateSafe(workout.date) }))
    .filter((entry): entry is DatedWorkout => !!entry.date)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}

function completedSets(exercise: WorkoutExercise) {
  return exercise.sets.filter((set) => set.completed && set.weight > 0 && set.reps > 0)
}

export function getPeriodStart(period: ProgressPeriod, now: Date = new Date()): Date {
  if (period === '4w') return startOfDay(subWeeks(now, 4))
  if (period === '3m') return startOfDay(subMonths(now, 3))
  return startOfDay(subMonths(now, 12))
}

// ── Summary with comparison to the previous period of the same length ──

export interface PeriodTotals {
  workouts: number
  volume: number
  records: number
}

export interface PeriodSummary {
  current: PeriodTotals
  previous: PeriodTotals
}

function totalsBetween(all: Workout[], dated: DatedWorkout[], start: Date, end: Date): PeriodTotals {
  const inRange = dated.filter(({ date }) => date >= start && date <= end)
  let volume = 0
  let records = 0
  for (const { workout } of inRange) {
    for (const exercise of workout.exercises) {
      for (const set of completedSets(exercise)) volume += set.weight * set.reps
    }
    records += getSessionRecords(workout, all).length
  }
  return { workouts: inRange.length, volume, records }
}

export function summarizePeriod(workouts: Workout[], period: ProgressPeriod, now: Date = new Date()): PeriodSummary {
  const dated = completedByDate(workouts)
  const start = getPeriodStart(period, now)
  const previousStart = new Date(start.getTime() - (now.getTime() - start.getTime()))
  return {
    current: totalsBetween(workouts, dated, start, now),
    previous: totalsBetween(workouts, dated, previousStart, new Date(start.getTime() - 1)),
  }
}

// ── Strength: estimated 1RM per exercise over time ──

export interface StrengthPoint {
  date: Date
  oneRepMax: number
}

export interface StrengthTrend {
  name: string
  muscleGroup: string
  points: StrengthPoint[]
  current: number
  /** Change from the first to the last session in the period, as a fraction */
  change: number
}

/** Best estimated 1RM per session for one exercise, oldest first */
export function getExerciseStrengthSeries(workouts: Workout[], exerciseName: string): StrengthPoint[] {
  const key = exerciseName.toLowerCase()
  const points: StrengthPoint[] = []
  for (const { workout, date } of completedByDate(workouts)) {
    const best = workout.exercises
      .filter((exercise) => exercise.exercise.name.toLowerCase() === key)
      .flatMap(completedSets)
      .reduce((max, set) => Math.max(max, estimateOneRepMax(set.weight, set.reps)), 0)
    if (best > 0) points.push({ date, oneRepMax: best })
  }
  return points
}

/** Exercises trained at least twice in the period, most trained first */
export function getStrengthTrends(
  workouts: Workout[],
  period: ProgressPeriod,
  now: Date = new Date()
): StrengthTrend[] {
  const start = getPeriodStart(period, now)
  const inPeriod = workouts.filter((workout) => {
    const date = toDateSafe(workout.date)
    return workout.completed && !!date && date >= start && date <= now
  })

  const muscles = new Map<string, { name: string; muscleGroup: string }>()
  for (const workout of inPeriod) {
    for (const exercise of workout.exercises) {
      if (completedSets(exercise).length === 0) continue
      const key = exercise.exercise.name.toLowerCase()
      if (!muscles.has(key)) muscles.set(key, { name: exercise.exercise.name, muscleGroup: exercise.exercise.muscleGroup })
    }
  }

  const trends: StrengthTrend[] = []
  for (const { name, muscleGroup } of muscles.values()) {
    const points = getExerciseStrengthSeries(inPeriod, name)
    if (points.length < 2) continue
    const first = points[0].oneRepMax
    const current = points[points.length - 1].oneRepMax
    trends.push({ name, muscleGroup, points, current, change: first > 0 ? (current - first) / first : 0 })
  }

  return trends.sort((a, b) => b.points.length - a.points.length || b.current - a.current)
}

// ── Weekly (or monthly) volume split by workout type ──

export interface VolumeBucket {
  start: Date
  label: string
  byType: Partial<Record<WorkoutType, number>>
  total: number
}

export function getVolumeBuckets(workouts: Workout[], period: ProgressPeriod, now: Date = new Date()): VolumeBucket[] {
  const monthly = period === '1y'
  const count = period === '4w' ? 4 : period === '3m' ? 13 : 12
  const currentStart = monthly ? startOfMonth(now) : startOfWeek(now, { weekStartsOn: 0 })

  const buckets: VolumeBucket[] = Array.from({ length: count }, (_, i) => {
    const offset = count - 1 - i
    const start = monthly ? subMonths(currentStart, offset) : subWeeks(currentStart, offset)
    const label = monthly
      ? start.toLocaleDateString('en-US', { month: 'short' })
      : start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return { start, label, byType: {}, total: 0 }
  })

  for (const { workout, date } of completedByDate(workouts)) {
    const index = buckets.findIndex((bucket, i) => {
      const end = i + 1 < buckets.length
        ? buckets[i + 1].start
        : monthly ? addMonths(bucket.start, 1) : addWeeks(bucket.start, 1)
      return date >= bucket.start && date < end
    })
    if (index === -1) continue
    const volume = workout.exercises
      .flatMap(completedSets)
      .reduce((sum, set) => sum + set.weight * set.reps, 0)
    const bucket = buckets[index]
    bucket.byType[workout.type] = (bucket.byType[workout.type] ?? 0) + volume
    bucket.total += volume
  }
  return buckets
}

// ── Consistency: completed workouts per week ──

export function getWeeklyCounts(workouts: Workout[], weeks: number, now: Date = new Date()): number[] {
  const thisWeek = startOfWeek(now, { weekStartsOn: 0 })
  const counts = Array.from({ length: weeks }, () => 0)
  for (const { date } of completedByDate(workouts)) {
    const weeksAgo = differenceInCalendarWeeks(thisWeek, date, { weekStartsOn: 0 })
    if (weeksAgo >= 0 && weeksAgo < weeks) counts[weeks - 1 - weeksAgo]++
  }
  return counts
}

// ── Stall detection ──

export const STALL_SESSIONS = 3

/**
 * An exercise is stalled when none of its last few sessions beat the best
 * estimated 1RM from before them. Needs a baseline session plus the window.
 */
export function isStalled(points: StrengthPoint[], sessions: number = STALL_SESSIONS): boolean {
  if (points.length < sessions + 1) return false
  const before = points.slice(0, points.length - sessions)
  const recent = points.slice(-sessions)
  const bestBefore = Math.max(...before.map((point) => point.oneRepMax))
  return recent.every((point) => point.oneRepMax <= bestBefore)
}

/** Classic reset: about 10% lighter, rounded to the nearest loadable 2.5 kg step */
export function getDeloadWeight(topWeight: number): number {
  return Math.max(0, Math.round((topWeight * 0.9) / 2.5) * 2.5)
}
