import { beforeEach, describe, expect, it, vi } from 'vitest'

const firestore = vi.hoisted(() => ({
  addDoc: vi.fn(),
  getDocs: vi.fn(),
}))

vi.mock('firebase/firestore', () => {
  class Timestamp {
    private readonly date: Date
    constructor(date: Date) {
      this.date = date
    }
    static fromDate(date: Date) {
      return new Timestamp(date)
    }
    toDate() {
      return this.date
    }
  }
  return {
    Timestamp,
    collection: vi.fn(() => ({})),
    doc: vi.fn(() => ({})),
    query: vi.fn(() => ({})),
    where: vi.fn(),
    orderBy: vi.fn(),
    addDoc: firestore.addDoc,
    getDocs: firestore.getDocs,
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    deleteDoc: vi.fn(),
    serverTimestamp: vi.fn(),
    onSnapshot: vi.fn(),
  }
})
vi.mock('../../lib/firebase', () => ({ db: {}, auth: { currentUser: { uid: 'user-1' } } }))
vi.mock('../firestorePlanService', () => ({ getCustomExercises: vi.fn(async () => []) }))

import { startWorkout } from '../firestoreWorkoutService'

describe('startWorkout', () => {
  beforeEach(() => {
    firestore.addDoc.mockReset()
    firestore.getDocs.mockReset()
  })

  it('creates a single workout when started twice at the same time', async () => {
    firestore.getDocs.mockResolvedValue({ docs: [] })
    let created = 0
    firestore.addDoc.mockImplementation(async () => ({ id: `workout-${++created}` }))

    const [first, second] = await Promise.all([startWorkout('upper'), startWorkout('upper')])

    expect(firestore.addDoc).toHaveBeenCalledTimes(1)
    expect(first.id).toBe('workout-1')
    expect(second.id).toBe('workout-1')
  })

  it('reuses the just-created workout if the lookup fails right after', async () => {
    firestore.getDocs.mockResolvedValueOnce({ docs: [] })
    firestore.addDoc.mockResolvedValue({ id: 'workout-a' })
    const first = await startWorkout('lower')

    firestore.getDocs.mockRejectedValueOnce(new Error('index building'))
    const second = await startWorkout('lower')

    expect(firestore.addDoc).toHaveBeenCalledTimes(1)
    expect(second.id).toBe(first.id)
  })
})
