import { doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { WorkoutType } from '../types'

/** Exercise that permanently replaces a program slot */
export interface SwappedExercise {
  id: string
  name: string
  muscleGroup: string
  repRange?: string
}

/** workout type -> program slot id (the original exercise id) -> replacement */
export type ProgramSwaps = Partial<Record<WorkoutType, Record<string, SwappedExercise>>>

const USERS_COLLECTION = 'users'

function getUserId(): string {
  const userId = auth?.currentUser?.uid
  if (!userId) {
    throw new Error('User must be authenticated to perform this action')
  }
  return userId
}

/** Swaps chosen with "every workout of this type", stored on the user profile */
export async function getProgramSwaps(): Promise<ProgramSwaps> {
  try {
    const snapshot = await getDoc(doc(db, USERS_COLLECTION, getUserId()))
    return (snapshot.data()?.programSwaps as ProgramSwaps | undefined) ?? {}
  } catch (error) {
    console.error('Error loading program swaps:', error)
    return {}
  }
}

/** Save a permanent swap, or pass null to go back to the program's exercise */
export async function setProgramSwap(
  type: WorkoutType,
  slotId: string,
  exercise: SwappedExercise | null
): Promise<void> {
  const userRef = doc(db, USERS_COLLECTION, getUserId())
  if (exercise) {
    const value: SwappedExercise = { id: exercise.id, name: exercise.name, muscleGroup: exercise.muscleGroup }
    if (exercise.repRange) value.repRange = exercise.repRange
    // merge keeps the other slots and workout types
    await setDoc(userRef, { programSwaps: { [type]: { [slotId]: value } } }, { merge: true })
  } else {
    await updateDoc(userRef, { [`programSwaps.${type}.${slotId}`]: deleteField() })
  }
}
