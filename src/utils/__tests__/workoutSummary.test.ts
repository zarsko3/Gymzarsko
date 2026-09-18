import { describe, expect, it } from 'vitest'
import type { Workout, WorkoutType } from '../../types'
import {
  compareWithPreviousOfType,
  getSessionRecords,
  getExerciseTrend,
  getWorkoutTotals,
} from '../workoutSummary'

type Sets = Array<[number, number, boolean?]>

function workout(id: string, day: number, type: WorkoutType, exercises: Record<string, Sets>, minutes = 60): Workout {
  const start = new Date(2026, 8, day, 10, 0)
  return {
    id,
    type,
    date: start,
    startTime: start,
    endTime: new Date(start.getTime() + minutes * 60000),
    completed: true,
    exercises: Object.entries(exercises).map(([name, sets], i) => ({
      id: `${id}-${i}`,
      exerciseId: name,
      exercise: { id: name, name, muscleGroup: 'Back', category: type },
      sets: sets.map(([weight, reps, completed = true], j) => ({ id: `${j}`, weight, reps, completed })),
    })),
  }
}

const history = [
  workout('pull-1', 4, 'pull', { 'Lat Pulldown': [[60, 10], [65, 8]], 'EZ Bar Curl': [[30, 8]] }, 62),
  workout('legs-1', 6, 'legs', { Squats: [[100, 5]] }),
  workout('pull-2', 11, 'pull', { 'Lat Pulldown': [[65, 9]], 'EZ Bar Curl': [[30, 7]] }, 60),
]
const today = workout(
  'pull-3',
  18,
  'pull',
  { 'Lat Pulldown': [[65, 10], [70, 9]], 'EZ Bar Curl': [[30, 10]], 'Face Pulls': [[20, 13]], Shrugs: [[40, 12, false]] },
  56
)
const all = [...history, today]

describe('workout summary', () => {
  it('totals only completed sets', () => {
    expect(getWorkoutTotals(today)).toEqual({ durationMinutes: 56, sets: 4, volume: 65 * 10 + 70 * 9 + 30 * 10 + 20 * 13 })
  })

  it('compares with the previous workout of the same type, not the latest overall', () => {
    const comparison = compareWithPreviousOfType(today, all)
    expect(comparison?.previous.volume).toBe(65 * 9 + 30 * 7)
    expect(comparison?.durationMinutes).toBe(-4)
    expect(comparison?.sets).toBe(2)
  })

  it('finds weight and reps records, skipping first-time exercises', () => {
    expect(getSessionRecords(today, all)).toEqual([
      { exerciseName: 'Lat Pulldown', weight: 70, reps: 9, kind: 'weight', improvement: 5 },
      { exerciseName: 'EZ Bar Curl', weight: 30, reps: 10, kind: 'reps', improvement: 2 },
    ])
  })

  it('ignores later workouts when judging records', () => {
    expect(getSessionRecords(history[0], all)).toEqual([])
  })

  it('trends each exercise against the last time it was done', () => {
    const [pulldown, curl, facePulls] = today.exercises
    expect(getExerciseTrend(pulldown, today, all)).toBe('up')
    expect(getExerciseTrend(curl, today, all)).toBe('up')
    expect(getExerciseTrend(facePulls, today, all)).toBeNull()

    const sameAgain = workout('pull-4', 25, 'pull', { 'Lat Pulldown': [[70, 9]], 'EZ Bar Curl': [[27.5, 10]] })
    const withNext = [...all, sameAgain]
    expect(getExerciseTrend(sameAgain.exercises[0], sameAgain, withNext)).toBe('same')
    expect(getExerciseTrend(sameAgain.exercises[1], sameAgain, withNext)).toBe('down')
  })
})
