import { describe, expect, it } from 'vitest'
import type { Workout } from '../../types'
import {
  ABANDONED_WORKOUT_AFTER_MS,
  findActiveWorkout,
  findWorkoutsWithoutDuration,
  hasCompletedSets,
  isAbandonedWorkout,
} from '../workoutStatus'

const NOW = new Date('2026-01-10T12:00:00Z').getTime()

function makeWorkout(overrides: Partial<Workout>): Workout {
  return {
    id: 'w',
    type: 'push',
    date: new Date(NOW),
    startTime: new Date(NOW),
    exercises: [],
    completed: false,
    ...overrides,
  }
}

describe('workoutStatus', () => {
  it('treats workouts open longer than the threshold as abandoned', () => {
    const old = makeWorkout({ startTime: new Date(NOW - ABANDONED_WORKOUT_AFTER_MS) })
    const recent = makeWorkout({ startTime: new Date(NOW - 30 * 60 * 1000) })

    expect(isAbandonedWorkout(old, NOW)).toBe(true)
    expect(isAbandonedWorkout(recent, NOW)).toBe(false)
    expect(isAbandonedWorkout({ ...old, completed: true }, NOW)).toBe(false)
  })

  it('finds the most recently started in-progress workout', () => {
    const workouts = [
      makeWorkout({ id: 'done', completed: true, startTime: new Date(NOW - 1000) }),
      makeWorkout({ id: 'older', startTime: new Date(NOW - 60 * 60 * 1000) }),
      makeWorkout({ id: 'newer', startTime: new Date(NOW - 10 * 60 * 1000) }),
      makeWorkout({ id: 'abandoned', startTime: new Date(NOW - 2 * ABANDONED_WORKOUT_AFTER_MS) }),
    ]

    expect(findActiveWorkout(workouts, NOW)?.id).toBe('newer')
    expect(findActiveWorkout([workouts[0], workouts[3]], NOW)).toBeNull()
  })

  it('detects logged sets', () => {
    const exercise = {
      id: 'e',
      exerciseId: 'e',
      exercise: { id: 'e', name: 'Bench', muscleGroup: 'Chest', category: 'push' as const },
      sets: [{ id: 's', weight: 60, reps: 8, completed: false }],
    }
    expect(hasCompletedSets(makeWorkout({ exercises: [exercise] }))).toBe(false)
    expect(
      hasCompletedSets(makeWorkout({ exercises: [{ ...exercise, sets: [{ ...exercise.sets[0], completed: true }] }] }))
    ).toBe(true)
  })

  it('finds workouts without a duration but keeps the one in progress', () => {
    const workouts = [
      makeWorkout({ id: 'finished', completed: true, startTime: new Date(NOW - 7200000), endTime: new Date(NOW - 3600000) }),
      makeWorkout({ id: 'added-from-history', completed: true, endTime: undefined }),
      makeWorkout({ id: 'in-progress', startTime: new Date(NOW - 600000) }),
      makeWorkout({ id: 'abandoned', startTime: new Date(NOW - 2 * ABANDONED_WORKOUT_AFTER_MS) }),
    ]

    expect(findWorkoutsWithoutDuration(workouts, NOW).map((w) => w.id)).toEqual(['added-from-history', 'abandoned'])
  })
})
