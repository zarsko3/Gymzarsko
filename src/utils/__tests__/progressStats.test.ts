import { describe, expect, it } from 'vitest'
import type { Workout, WorkoutType } from '../../types'
import {
  estimateOneRepMax,
  getExerciseStrengthSeries,
  getStrengthTrends,
  getVolumeBuckets,
  getWeeklyCounts,
  summarizePeriod,
  isStalled,
  getDeloadWeight,
} from '../progressStats'

// Saturday
const NOW = new Date(2026, 8, 19, 20, 0)
const day = (daysAgo: number) => new Date(NOW.getTime() - daysAgo * 86400000)

function workout(id: string, daysAgo: number, type: WorkoutType, lifts: Record<string, Array<[number, number]>>): Workout {
  return {
    id,
    type,
    date: day(daysAgo),
    startTime: day(daysAgo),
    completed: true,
    exercises: Object.entries(lifts).map(([name, sets], i) => ({
      id: `${id}-${i}`,
      exerciseId: name,
      exercise: { id: name, name, muscleGroup: 'Chest', category: type },
      sets: sets.map(([weight, reps], j) => ({ id: `${j}`, weight, reps, completed: true })),
    })),
  }
}

describe('estimateOneRepMax', () => {
  it('uses the Epley formula and keeps singles as they are', () => {
    expect(estimateOneRepMax(100, 1)).toBe(100)
    expect(estimateOneRepMax(85, 6)).toBe(102)
    expect(estimateOneRepMax(0, 5)).toBe(0)
  })
})

describe('strength', () => {
  const workouts = [
    workout('a', 40, 'push', { Bench: [[70, 8]] }), // before the 4-week window
    workout('b', 20, 'push', { Bench: [[75, 8]], Flyes: [[20, 12]] }),
    workout('c', 10, 'push', { Bench: [[80, 6], [77.5, 8]] }),
    workout('d', 3, 'push', { Bench: [[82.5, 6]] }),
  ]

  it('builds a per-session series of the best estimate', () => {
    expect(getExerciseStrengthSeries(workouts, 'bench').map((p) => p.oneRepMax)).toEqual([88.5, 95, 98, 99])
  })

  it('lists exercises trained at least twice in the period with their change', () => {
    const trends = getStrengthTrends(workouts, '4w', NOW)
    expect(trends).toHaveLength(1)
    expect(trends[0]).toMatchObject({ name: 'Bench', current: 99 })
    expect(trends[0].change).toBeCloseTo((99 - 95) / 95)
  })
})

describe('period summary', () => {
  it('compares with the previous period of the same length', () => {
    const workouts = [
      workout('old', 40, 'push', { Bench: [[70, 10]] }),
      workout('new1', 10, 'push', { Bench: [[80, 10]] }),
      workout('new2', 5, 'pull', { Row: [[60, 10]] }),
    ]
    const summary = summarizePeriod(workouts, '4w', NOW)
    expect(summary.current).toEqual({ workouts: 2, volume: 1400, records: 1 })
    expect(summary.previous).toEqual({ workouts: 1, volume: 700, records: 0 })
  })
})

describe('volume and consistency', () => {
  const workouts = [
    workout('p', 1, 'push', { Bench: [[100, 10]] }), // this week
    workout('l', 2, 'legs', { Squat: [[100, 5]] }), // this week
    workout('u', 8, 'upper', { Row: [[50, 10]] }), // last week
  ]

  it('splits weekly volume by workout type', () => {
    const buckets = getVolumeBuckets(workouts, '4w', NOW)
    expect(buckets).toHaveLength(4)
    expect(buckets[3].byType).toEqual({ push: 1000, legs: 500 })
    expect(buckets[2].byType).toEqual({ upper: 500 })
    expect(buckets[0].total).toBe(0)
  })

  it('counts workouts per week, oldest first', () => {
    expect(getWeeklyCounts(workouts, 4, NOW)).toEqual([0, 0, 1, 2])
  })
})

describe('stall detection', () => {
  const points = (values: number[]) => values.map((oneRepMax, i) => ({ date: new Date(2026, 7, i + 1), oneRepMax }))

  it('flags three sessions in a row that did not beat the earlier best', () => {
    const { isStalled } = requireStall()
    expect(isStalled(points([90, 95, 95, 94, 95]))).toBe(true)
  })

  it('does not flag progress or too little history', () => {
    const { isStalled } = requireStall()
    expect(isStalled(points([90, 95, 94, 96]))).toBe(false)
    expect(isStalled(points([95, 95, 95]))).toBe(false)
  })

  it('suggests about 10% lighter on a 2.5 kg step', () => {
    const { getDeloadWeight } = requireStall()
    expect(getDeloadWeight(80)).toBe(72.5)
    expect(getDeloadWeight(100)).toBe(90)
  })
})

function requireStall() {
  return { isStalled, getDeloadWeight }
}
