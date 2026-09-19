import { differenceInCalendarDays } from 'date-fns'
import type { Workout, WorkoutType } from '../types'
import { mockExercises, getDefaultSets } from '../services/mockData'
import { toDateSafe } from './formatters'

// Rough time per working set including rest, used when there's no history yet
const MINUTES_PER_SET = 2.5

export interface WorkoutTypeStats {
  exerciseCount: number
  /** Average of the last few sessions, or an estimate from the program */
  estimatedMinutes: number
  lastDone: Date | null
}

export function getWorkoutTypeStats(workouts: Workout[], type: WorkoutType): WorkoutTypeStats {
  const program = mockExercises.filter((exercise) => exercise.category === type)
  const programSets = program.reduce((sum, exercise) => sum + getDefaultSets(exercise.id), 0)

  const completed = workouts
    .filter((workout) => workout.completed && workout.type === type)
    .map((workout) => ({ workout, date: toDateSafe(workout.date) }))
    .filter((entry): entry is { workout: Workout; date: Date } => !!entry.date)
    .sort((a, b) => b.date.getTime() - a.date.getTime())

  const recentDurations = completed
    .slice(0, 3)
    .map(({ workout }) => {
      const start = toDateSafe(workout.startTime)
      const end = toDateSafe(workout.endTime)
      return start && end ? (end.getTime() - start.getTime()) / 60000 : null
    })
    // Ignore missing or implausible durations (e.g. workouts added later without times)
    .filter((minutes): minutes is number => minutes !== null && minutes >= 10 && minutes <= 180)

  const estimatedMinutes = recentDurations.length > 0
    ? recentDurations.reduce((sum, minutes) => sum + minutes, 0) / recentDurations.length
    : programSets * MINUTES_PER_SET

  return {
    exerciseCount: program.length,
    estimatedMinutes: Math.round(estimatedMinutes / 5) * 5,
    lastDone: completed[0]?.date ?? null,
  }
}

/** "today", "yesterday", "6 days ago", "not done yet" */
export function describeLastDone(lastDone: Date | null, now: Date = new Date()): string {
  if (!lastDone) return 'not done yet'
  const days = differenceInCalendarDays(now, lastDone)
  if (days <= 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days} days ago`
}

/** Greeting that matches the time of day */
export function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours()
  if (hour < 5) return 'Good night'
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
