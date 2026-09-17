import { describe, expect, it } from 'vitest'
import { WORKOUT_TYPES, getNextWorkoutType } from '../workoutTypes'
import { mockExercises, getDefaultSets } from '../../services/mockData'

describe('workout types', () => {
  it('rotates Push → Pull → Legs → Upper → Lower → Push', () => {
    expect(getNextWorkoutType(null)).toBe('push')
    expect(getNextWorkoutType('push')).toBe('pull')
    expect(getNextWorkoutType('pull')).toBe('legs')
    expect(getNextWorkoutType('legs')).toBe('upper')
    expect(getNextWorkoutType('upper')).toBe('lower')
    expect(getNextWorkoutType('lower')).toBe('push')
  })

  it('has a program for every workout type', () => {
    for (const type of WORKOUT_TYPES) {
      expect(mockExercises.filter((ex) => ex.category === type.id).length).toBeGreaterThanOrEqual(6)
    }
  })

  it('never repeats an exercise across days', () => {
    const names = mockExercises.map((ex) => ex.name.toLowerCase())
    expect(new Set(names).size).toBe(names.length)
  })

  it('keeps the original PPL set counts', () => {
    expect(getDefaultSets('push-1')).toBe(4)
    expect(getDefaultSets('push-3')).toBe(3)
    expect(getDefaultSets('legs-1')).toBe(3)
    expect(getDefaultSets('legs-2')).toBe(4)
  })
})
