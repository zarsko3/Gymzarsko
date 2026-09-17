import { describe, expect, it } from 'vitest'
import type { Workout, WorkoutType } from '../../types'
import {
  getWeeklyProgress,
  getSetsPerMuscleGroup,
  getRecentPersonalRecords,
} from '../workoutAnalyticsService'

// Wednesday
const NOW = new Date('2026-09-16T12:00:00')

function workout(
  date: string,
  opts: { type?: WorkoutType; completed?: boolean; exercises?: Array<[string, string, Array<[number, number]>]> } = {}
): Workout {
  const { type = 'push', completed = true, exercises = [] } = opts
  return {
    id: `w-${date}-${Math.random()}`,
    type,
    date: new Date(date),
    completed,
    exercises: exercises.map(([name, muscleGroup, sets], i) => ({
      id: `e${i}`,
      exerciseId: `e${i}`,
      exercise: { id: `e${i}`, name, muscleGroup, category: type },
      sets: sets.map(([weight, reps], j) => ({ id: `s${j}`, weight, reps, completed: true })),
    })),
  }
}

describe('weekly progress', () => {
  it('counts completed workouts in the current week', () => {
    const workouts = [
      workout('2026-09-14T10:00:00'),
      workout('2026-09-15T10:00:00'),
      workout('2026-09-15T18:00:00', { completed: false }),
      workout('2026-09-10T10:00:00'),
    ]
    expect(getWeeklyProgress(workouts, 5, NOW).completed).toBe(2)
  })

  it('counts a streak of weeks that hit the goal, ignoring an unfinished current week', () => {
    const workouts = [
      // current week (Sun 13 Sep): only 1 so far — must not break the streak
      workout('2026-09-14T10:00:00'),
      // previous two full weeks: 2 each
      workout('2026-09-07T10:00:00'),
      workout('2026-09-08T10:00:00'),
      workout('2026-08-31T10:00:00'),
      workout('2026-09-01T10:00:00'),
    ]
    expect(getWeeklyProgress(workouts, 2, NOW).streakWeeks).toBe(2)
  })
})

describe('sets per muscle group', () => {
  it('sums completed sets in the window, most trained first', () => {
    const workouts = [
      workout('2026-09-15T10:00:00', { exercises: [['Bench', 'Chest', [[60, 8], [60, 8]]], ['Row', 'Back', [[50, 10]]]] }),
      workout('2026-09-12T10:00:00', { exercises: [['Row', 'Back', [[50, 10], [50, 10], [50, 9]]]] }),
      workout('2026-09-01T10:00:00', { exercises: [['Squat', 'Quads', [[100, 5]]]] }),
    ]
    expect(getSetsPerMuscleGroup(workouts, 7, NOW)).toEqual([
      { muscleGroup: 'Back', sets: 4 },
      { muscleGroup: 'Chest', sets: 2 },
    ])
  })
})

describe('recent personal records', () => {
  it('reports a new best weight from the last two weeks', () => {
    const workouts = [
      workout('2026-09-01T10:00:00', { exercises: [['Bench', 'Chest', [[70, 8]]]] }),
      workout('2026-09-15T10:00:00', { exercises: [['Bench', 'Chest', [[80, 6]]]] }),
    ]
    expect(getRecentPersonalRecords(workouts, 14, NOW)).toEqual([
      { exerciseName: 'Bench', weight: 80, reps: 6, date: new Date('2026-09-15T10:00:00') },
    ])
  })

  it('ignores a first-ever attempt and older records', () => {
    const workouts = [
      workout('2026-09-15T10:00:00', { exercises: [['Hip Thrust', 'Glutes', [[60, 10]]]] }),
      workout('2026-07-01T10:00:00', { exercises: [['Curl', 'Biceps', [[20, 10]]]] }),
      workout('2026-07-08T10:00:00', { exercises: [['Curl', 'Biceps', [[15, 12]]]] }),
    ]
    expect(getRecentPersonalRecords(workouts, 14, NOW)).toEqual([])
  })
})
