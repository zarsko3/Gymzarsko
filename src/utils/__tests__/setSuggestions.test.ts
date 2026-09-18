import { describe, expect, it } from 'vitest'
import type { Workout, WorkoutExercise, WorkoutSet } from '../../types'
import {
  parseRepRange,
  getRepRange,
  getProgression,
  getSetSuggestion,
  fillFromSuggestion,
  findUnmarkedSets,
  markSetsWithNumbersDone,
} from '../setSuggestions'

const set = (weight: number, reps: number, completed = false): WorkoutSet => ({
  id: `${weight}-${reps}-${completed}`,
  weight,
  reps,
  completed,
})

const exercise = (name: string, sets: WorkoutSet[], repRange?: string, exerciseId = 'x'): WorkoutExercise => ({
  id: name,
  exerciseId,
  exercise: { id: exerciseId, name, muscleGroup: 'Chest', category: 'push', repRange },
  sets,
})

describe('rep ranges', () => {
  it('parses plain and per-leg ranges', () => {
    expect(parseRepRange('8-10')).toEqual({ min: 8, max: 10 })
    expect(parseRepRange('8-10 / leg')).toEqual({ min: 8, max: 10 })
    expect(parseRepRange(undefined)).toBeNull()
  })

  it('falls back to the catalog for workouts started before ranges existed', () => {
    expect(getRepRange(exercise('Bench Press', [], undefined, 'push-1'))).toEqual({ min: 6, max: 8 })
  })
})

describe('progression', () => {
  const session = (reps: number[]) => ({ sets: reps.map((r) => ({ weight: 30, reps: r })), date: new Date() })

  it('suggests more weight once every set hit the top of the range', () => {
    expect(getProgression(session([10, 10, 10]), { min: 8, max: 10 }, 'Flat Dumbbell Press')).toEqual({
      weight: 32.5,
      reps: 8,
      increment: 2.5,
      topReps: 10,
    })
  })

  it('uses a bigger jump for heavy lower-body lifts', () => {
    expect(getProgression(session([6, 6, 6]), { min: 4, max: 6 }, 'Deadlift (conventional or trap bar)')?.weight).toBe(35)
  })

  it('stays quiet if any set fell short', () => {
    expect(getProgression(session([10, 10, 9]), { min: 8, max: 10 }, 'Bench')).toBeNull()
  })
})

describe('set suggestions', () => {
  it('prefers the previous set of this workout, then the base suggestion', () => {
    const sets = [set(60, 8, true), set(0, 0)]
    expect(getSetSuggestion(sets, 1, { weight: 55, reps: 10 })).toEqual({ weight: 60, reps: 8 })
    expect(getSetSuggestion(sets, 0, { weight: 55, reps: 10 })).toEqual({ weight: 55, reps: 10 })
  })

  it('fills only the empty fields when a set is accepted', () => {
    expect(fillFromSuggestion(set(0, 0), { weight: 60, reps: 8 })).toMatchObject({ weight: 60, reps: 8 })
    expect(fillFromSuggestion(set(62.5, 0), { weight: 60, reps: 8 })).toMatchObject({ weight: 62.5, reps: 8 })
  })
})

describe('unmarked sets', () => {
  const workout: Workout = {
    id: 'w',
    type: 'push',
    date: new Date(),
    completed: false,
    exercises: [
      exercise('Bench', [set(80, 6, true), set(80, 5), set(0, 0)]),
      exercise('Lateral raise', [set(10, 12), set(10, 12)]),
      exercise('Dips', [set(0, 0)]),
    ],
  }

  it('lists sets with numbers that are not marked done', () => {
    expect(findUnmarkedSets(workout)).toEqual([
      { exerciseName: 'Bench', count: 1 },
      { exerciseName: 'Lateral raise', count: 2 },
    ])
  })

  it('marks exactly those sets done', () => {
    const marked = markSetsWithNumbersDone(workout)
    expect(findUnmarkedSets(marked)).toEqual([])
    expect(marked.exercises[0].sets[2].completed).toBe(false)
  })
})
