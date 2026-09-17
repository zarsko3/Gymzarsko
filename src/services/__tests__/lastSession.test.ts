import { describe, expect, it } from 'vitest'
import { formatSessionSets, getTopSet, type LastSession } from '../firestoreProgressService'

const session: LastSession = {
  sets: [
    { weight: 65, reps: 10 },
    { weight: 70, reps: 8 },
    { weight: 60, reps: 10 },
  ],
  date: new Date('2026-09-10'),
}

describe('last session helpers', () => {
  it('formats the sets as they were logged', () => {
    expect(formatSessionSets(session)).toBe('65×10, 70×8, 60×10')
  })

  it('picks the heaviest set to prefill today', () => {
    expect(getTopSet(session)).toEqual({ weight: 70, reps: 8 })
  })

  it('handles a missing session', () => {
    expect(getTopSet(undefined)).toBeNull()
  })
})
