import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { Workout, WorkoutType } from '../types'
import { mockExercises } from './mockData'

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
 * Convert Firestore document to Workout object
 */
function firestoreToWorkout(docId: string, data: any): Workout {
  return {
    ...data,
    id: docId,
    date: data.date?.toDate() || new Date(),
    startTime: data.startTime?.toDate() || new Date(),
    endTime: data.endTime?.toDate(),
  } as Workout
}

/**
 * Convert Workout object to Firestore document
 */
function workoutToFirestore(workout: Workout) {
  const { startTime, endTime, ...rest } = workout
  return {
    ...rest,
    date: Timestamp.fromDate(workout.date),
    startTime: startTime ? Timestamp.fromDate(startTime) : null,
    endTime: endTime ? Timestamp.fromDate(endTime) : null,
  }
}

/**
 * Get all workouts for current user
 */
export async function getWorkouts(): Promise<Workout[]> {
  try {
    const userId = getUserId()
    const workoutsRef = collection(db, WORKOUTS_COLLECTION)
    const q = query(
      workoutsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    const workouts: Workout[] = []
    querySnapshot.forEach((doc) => {
      workouts.push(firestoreToWorkout(doc.id, doc.data()))
    })
    
    return workouts
  } catch (error) {
    console.error('Error getting workouts:', error)
    return []
  }
}

/**
 * Get a single workout by ID
 */
export async function getWorkoutById(id: string): Promise<Workout | null> {
  try {
    const workoutRef = doc(db, WORKOUTS_COLLECTION, id)
    const workoutDoc = await getDoc(workoutRef)
    
    if (workoutDoc.exists()) {
      return firestoreToWorkout(workoutDoc.id, workoutDoc.data())
    }
    return null
  } catch (error) {
    console.error('Error getting workout:', error)
    return null
  }
}

/**
 * Start a new workout
 */
export async function startWorkout(type: WorkoutType): Promise<Workout> {
  const userId = getUserId()
  
  // Define number of sets per exercise based on workout program
  const setsPerExercise: Record<string, number> = {
    // Push: 4, 4, 3, 3, 3, 3, 3 sets
    'push-1': 4, 'push-2': 4, 'push-3': 3, 'push-4': 3, 'push-5': 3, 'push-6': 3, 'push-7': 3,
    // Pull: 4, 4, 3, 3, 3, 3, 3 sets
    'pull-1': 4, 'pull-2': 4, 'pull-3': 3, 'pull-4': 3, 'pull-5': 3, 'pull-6': 3, 'pull-7': 3,
    // Legs: 3, 4, 4, 3, 3, 3 sets
    'legs-1': 3, 'legs-2': 4, 'legs-3': 4, 'legs-4': 3, 'legs-5': 3, 'legs-6': 3,
  }
  
  // Get all exercises for this workout type (not limited)
  const exercises = mockExercises
    .filter(ex => ex.category === type)
    .map(exercise => ({
      id: `we-${exercise.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: exercise.id,
      exercise,
      sets: Array(setsPerExercise[exercise.id] || 3).fill(null).map((_, i) => ({
        id: `set-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        weight: 0,
        reps: 0,
        completed: false,
      })),
    }))

  const newWorkout = {
    type,
    date: new Date(),
    startTime: new Date(),
    exercises,
    completed: false,
    userId, // Add userId for security rules
  }

  try {
    const workoutsRef = collection(db, WORKOUTS_COLLECTION)
    const docRef = await addDoc(workoutsRef, {
      ...workoutToFirestore(newWorkout as Workout),
      userId, // Ensure userId is included in Firestore doc
    })
    
    return {
      ...newWorkout,
      id: docRef.id,
    } as Workout
  } catch (error) {
    console.error('Error starting workout:', error)
    throw error
  }
}

/**
 * Update an existing workout
 */
export async function updateWorkout(workout: Workout): Promise<void> {
  try {
    const workoutRef = doc(db, WORKOUTS_COLLECTION, workout.id)
    await updateDoc(workoutRef, workoutToFirestore(workout))
  } catch (error) {
    console.error('Error updating workout:', error)
    throw error
  }
}

/**
 * Complete a workout
 */
export async function completeWorkout(workout: Workout): Promise<Workout> {
  const completedWorkout = {
    ...workout,
    endTime: new Date(),
    completed: true,
  }

  try {
    const workoutRef = doc(db, WORKOUTS_COLLECTION, workout.id)
    await updateDoc(workoutRef, workoutToFirestore(completedWorkout))
    return completedWorkout
  } catch (error) {
    console.error('Error completing workout:', error)
    throw error
  }
}

/**
 * Delete a workout
 */
export async function deleteWorkout(id: string): Promise<void> {
  try {
    const workoutRef = doc(db, WORKOUTS_COLLECTION, id)
    await deleteDoc(workoutRef)
  } catch (error) {
    console.error('Error deleting workout:', error)
    throw error
  }
}

/**
 * Get current active workout (if any)
 * In Firestore, we'll query for workouts without an endTime
 */
export async function getCurrentWorkout(): Promise<Workout | null> {
  try {
    const userId = getUserId()
    const workoutsRef = collection(db, WORKOUTS_COLLECTION)
    const q = query(
      workoutsRef,
      where('userId', '==', userId),
      where('endTime', '==', null),
      orderBy('startTime', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const firstDoc = querySnapshot.docs[0]
      return firestoreToWorkout(firstDoc.id, firstDoc.data())
    }
    return null
  } catch (error) {
    console.error('Error getting current workout:', error)
    return null
  }
}

/**
 * Subscribe to workouts for real-time updates
 * Returns an unsubscribe function
 */
export function subscribeToWorkouts(
  callback: (workouts: Workout[]) => void
): Unsubscribe {
  try {
    const userId = getUserId()
    const workoutsRef = collection(db, WORKOUTS_COLLECTION)
    const q = query(
      workoutsRef,
      where('userId', '==', userId),
      orderBy('date', 'desc')
    )
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        const workouts: Workout[] = []
        querySnapshot.forEach((doc) => {
          workouts.push(firestoreToWorkout(doc.id, doc.data()))
        })
        callback(workouts)
      },
      (error) => {
        console.error('Error in workouts subscription:', error)
        callback([])
      }
    )
  } catch (error) {
    console.error('Error setting up workouts subscription:', error)
    // Return a no-op unsubscribe function
    return () => {}
  }
}

