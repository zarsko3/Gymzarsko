import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'

const EXERCISES_SUBCOLLECTION = 'exercises'
const WORKOUTS_COLLECTION = 'workouts'

/**
 * Get current user ID
 */
function getUserId(): string {
  const userId = auth.currentUser?.uid
  if (!userId) {
    throw new Error('User must be authenticated to perform this action')
  }
  return userId
}

/**
 * Verify that the current user owns the specified workout
 * @throws Error if workout doesn't exist or user doesn't own it
 */
async function verifyWorkoutOwnership(workoutId: string): Promise<void> {
  const userId = getUserId()
  const workoutRef = doc(db, WORKOUTS_COLLECTION, workoutId)
  const workoutDoc = await getDoc(workoutRef)

  if (!workoutDoc.exists()) {
    throw new Error('Workout not found')
  }

  const workoutData = workoutDoc.data()
  if (workoutData?.userId !== userId) {
    throw new Error('Unauthorized: You do not own this workout')
  }
}

/**
 * Update exercise name in Firestore
 */
export async function updateExerciseName(
  workoutId: string,
  exerciseId: string,
  name: string
): Promise<void> {
  try {
    await verifyWorkoutOwnership(workoutId)
    const exerciseRef = doc(db, 'workouts', workoutId, EXERCISES_SUBCOLLECTION, exerciseId)
    await updateDoc(exerciseRef, {
      name: name.trim(),
      updatedAt: serverTimestamp(),
    })
  } catch (error) {
    console.error('Error updating exercise name:', error)
    throw error
  }
}

/**
 * Add a new exercise to a workout
 */
export async function addExerciseToWorkout(
  workoutId: string,
  exerciseData: {
    name: string
    sets: number
    reps: number
    weight: number
    notes?: string
  }
): Promise<string> {
  try {
    await verifyWorkoutOwnership(workoutId)
    const userId = getUserId()
    const exercisesRef = collection(db, 'workouts', workoutId, EXERCISES_SUBCOLLECTION)
    
    const docRef = await addDoc(exercisesRef, {
      name: exerciseData.name.trim(),
      sets: exerciseData.sets,
      reps: exerciseData.reps,
      weight: exerciseData.weight,
      notes: exerciseData.notes || '',
      userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    
    return docRef.id
  } catch (error) {
    console.error('Error adding exercise:', error)
    throw error
  }
}

/**
 * Update exercise in Firestore
 */
export async function updateExercise(
  workoutId: string,
  exerciseId: string,
  updates: {
    name?: string
    sets?: number
    reps?: number
    weight?: number
    notes?: string
  }
): Promise<void> {
  try {
    await verifyWorkoutOwnership(workoutId)
    const exerciseRef = doc(db, 'workouts', workoutId, EXERCISES_SUBCOLLECTION, exerciseId)
    const updateData: any = {
      updatedAt: serverTimestamp(),
    }
    
    if (updates.name !== undefined) updateData.name = updates.name.trim()
    if (updates.sets !== undefined) updateData.sets = updates.sets
    if (updates.reps !== undefined) updateData.reps = updates.reps
    if (updates.weight !== undefined) updateData.weight = updates.weight
    if (updates.notes !== undefined) updateData.notes = updates.notes
    
    await updateDoc(exerciseRef, updateData)
  } catch (error) {
    console.error('Error updating exercise:', error)
    throw error
  }
}

/**
 * Delete exercise from Firestore
 */
export async function deleteExercise(workoutId: string, exerciseId: string): Promise<void> {
  try {
    await verifyWorkoutOwnership(workoutId)
    const exerciseRef = doc(db, 'workouts', workoutId, EXERCISES_SUBCOLLECTION, exerciseId)
    await deleteDoc(exerciseRef)
  } catch (error) {
    console.error('Error deleting exercise:', error)
    throw error
  }
}

