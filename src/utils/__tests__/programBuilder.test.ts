import { describe, expect, it } from 'vitest'
import { buildProgramExercises } from '../programBuilder'

describe('buildProgramExercises', () => {
  it('builds the default program with slots and set counts', () => {
    const push = buildProgramExercises('push')
    expect(push).toHaveLength(7)
    expect(push[0]).toMatchObject({ exerciseId: 'push-1', slotId: 'push-1', exercise: { name: 'Bench Press' } })
    expect(push[0].sets).toHaveLength(4)
    expect(push[0].sets.every((set) => set.weight === 0 && !set.completed)).toBe(true)
  })

  it('applies a permanent swap but keeps the slot and its set count', () => {
    const push = buildProgramExercises('push', {
      push: { 'push-1': { id: 'alt-chest-2', name: 'Smith Machine Bench Press', muscleGroup: 'Chest', repRange: '8-10' } },
      pull: { 'pull-1': { id: 'alt-back-3', name: 'Pull-Ups', muscleGroup: 'Back' } },
    })
    expect(push[0]).toMatchObject({
      exerciseId: 'alt-chest-2',
      slotId: 'push-1',
      exercise: { name: 'Smith Machine Bench Press', category: 'push', repRange: '8-10' },
    })
    expect(push[0].sets).toHaveLength(4)
    expect(push[1].exercise.name).toBe('Overhead Shoulder Press (machine, seated)')
  })
})
