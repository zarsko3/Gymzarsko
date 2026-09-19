import { describe, expect, it } from 'vitest'
import type { Workout, WorkoutType } from '../../types'
import { describeLastDone, getGreeting, getWorkoutTypeStats } from '../workoutTypeStats'

const NOW = new Date(2026, 8, 19, 20, 0)

function workout(type: WorkoutType, daysAgo: number, minutes: number | null, completed = true): Workout {
  const start = new Date(NOW.getTime() - daysAgo * 86400000)
  return {
    id: `${type}-${daysAgo}`,
    type,
    date: start,
    startTime: start,
    endTime: minutes === null ? undefined : new Date(start.getTime() + minutes * 60000),
    completed,
    exercises: [],
  }
}

describe('workout type stats', () => {
  it('averages the last three sessions of the type and finds the last one', () => {
    const workouts = [
      workout('upper', 6, 50),
      workout('upper', 13, 60),
      workout('upper', 20, 55),
      workout('upper', 27, 90), // older than the last three
      workout('push', 1, 45),
      workout('upper', 2, 30, false), // not finished
    ]
    const stats = getWorkoutTypeStats(workouts, 'upper')
    expect(stats.estimatedMinutes).toBe(55)
    expect(stats.exerciseCount).toBe(7)
    expect(describeLastDone(stats.lastDone, NOW)).toBe('6 days ago')
  })

  it('estimates from the program when there is no usable history', () => {
    const stats = getWorkoutTypeStats([workout('lower', 3, null)], 'lower')
    // 7 lower exercises, 22 sets in total at 2.5 minutes, rounded to 5
    expect(stats.estimatedMinutes).toBe(55)
  })

  it('describes recency and greets by time of day', () => {
    expect(describeLastDone(null, NOW)).toBe('not done yet')
    expect(describeLastDone(new Date(2026, 8, 19, 7, 0), NOW)).toBe('today')
    expect(describeLastDone(new Date(2026, 8, 18, 22, 0), NOW)).toBe('yesterday')
    expect(getGreeting(new Date(2026, 8, 19, 8))).toBe('Good morning')
    expect(getGreeting(NOW)).toBe('Good evening')
  })
})
