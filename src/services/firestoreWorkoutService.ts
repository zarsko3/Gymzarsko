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
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Workout, WorkoutType } from '../types'
import { mockExercises } from './mockData'

const WORKOUTS_COLLECTION = 'workouts'

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
  return {
    ...workout,
    date: Timestamp.fromDate(workout.date),
    startTime: Timestamp.fromDate(workout.startTime),
    endTime: workout.endTime ? Timestamp.fromDate(workout.endTime) : null,
  }
}

/**
 * Get all workouts for current user
 */
export async function getWorkouts(): Promise<Workout[]> {
  try {
    const workoutsRef = collection(db, WORKOUTS_COLLECTION)
    const q = query(workoutsRef, orderBy('date', 'desc'))
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
  // Get exercises for this workout type
  const exercises = mockExercises
    .filter(ex => ex.category === type)
    .slice(0, 5)
    .map(exercise => ({
      id: `we-${exercise.id}-${Date.now()}`,
      exerciseId: exercise.id,
      exercise,
      sets: Array(3).fill(null).map((_, i) => ({
        id: `set-${i}-${Date.now()}`,
        weight: 0,
        reps: 0,
        completed: false,
      })),
    }))

  const newWorkout: Omit<Workout, 'id'> = {
    type,
    date: new Date(),
    startTime: new Date(),
    duration: 0,
    exercises,
    completed: false,
  }

  try {
    const workoutsRef = collection(db, WORKOUTS_COLLECTION)
    const docRef = await addDoc(workoutsRef, workoutToFirestore(newWorkout as Workout))
    
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
  const startTime = workout.startTime || workout.date
  const completedWorkout = {
    ...workout,
    endTime: new Date(),
    duration: (new Date().getTime() - startTime.getTime()) / 1000,
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
    const workoutsRef = collection(db, WORKOUTS_COLLECTION)
    const q = query(
      workoutsRef,
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

