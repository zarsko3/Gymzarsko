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
} from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
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
 * Safely convert Date, string, or Timestamp to Timestamp
 */
function toTimestampSafe(input: Date | string | Timestamp | any): Timestamp {
  if (input instanceof Timestamp) return input
  if (typeof input === 'string') {
    const d = new Date(input)
    if (isNaN(d.getTime())) {
      throw new Error(`Invalid date string: ${input}`)
    }
    return Timestamp.fromDate(d)
  }
  if (input instanceof Date) {
    return Timestamp.fromDate(input)
  }
  // Fallback: try to convert
  try {
    const d = input?.toDate?.() || new Date(input)
    return Timestamp.fromDate(d)
  } catch {
    throw new Error(`Cannot convert to Timestamp: ${input}`)
  }
}

/**
 * Safely convert Timestamp or string to Date
 */
function toDateSafe(input: Date | string | Timestamp | any): Date {
  if (input instanceof Date) return input
  if (input instanceof Timestamp) return input.toDate()
  if (typeof input === 'string') {
    const d = new Date(input)
    if (isNaN(d.getTime())) {
      return new Date() // Fallback to current date
    }
    return d
  }
  // Try toDate method
  if (input?.toDate) {
    return input.toDate()
  }
  // Fallback
  return new Date()
}

/**
 * Convert Firestore document to Workout object
 */
function firestoreToWorkout(docId: string, data: any): Workout {
  return {
    ...data,
    id: docId,
    date: toDateSafe(data.date),
    startTime: data.startTime ? toDateSafe(data.startTime) : undefined,
    endTime: data.endTime ? toDateSafe(data.endTime) : undefined,
  } as Workout
}

/**
 * Sanitize object for Firestore - remove undefined and NaN values
 */
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): any {
  if (obj === null || obj === undefined) {
    return null
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeForFirestore(item))
  }
  
  if (typeof obj === 'object' && obj.constructor === Object) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(obj)) {
      // Skip undefined values
      if (value === undefined) {
        continue
      }
      
      // Skip NaN values
      if (typeof value === 'number' && Number.isNaN(value)) {
        continue
      }
      
      // Recursively sanitize nested objects and arrays
      sanitized[key] = sanitizeForFirestore(value)
    }
    return sanitized
  }
  
  // Return primitive values as-is
  return obj
}

/**
 * Convert Workout object to Firestore document
 */
function workoutToFirestore(workout: Workout) {
  const { startTime, endTime, ...rest } = workout
  
  const firestoreData = {
    ...rest,
    date: toTimestampSafe(workout.date),
    startTime: startTime ? toTimestampSafe(startTime) : null,
    endTime: endTime ? toTimestampSafe(endTime) : null,
  }
  
  // Sanitize to remove undefined and NaN values
  return sanitizeForFirestore(firestoreData)
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
 * Verifies that the workout belongs to the current user
 */
export async function getWorkoutById(id: string): Promise<Workout | null> {
  try {
    const userId = getUserId()
    const workoutRef = doc(db, WORKOUTS_COLLECTION, id)
    const workoutDoc = await getDoc(workoutRef)
    
    if (workoutDoc.exists()) {
      const data = workoutDoc.data()
      // Verify workout belongs to current user
      if (data.userId !== userId) {
        console.warn('Attempted to access workout that does not belong to current user')
        return null
      }
      return firestoreToWorkout(workoutDoc.id, data)
    }
    return null
  } catch (error) {
    console.error('Error getting workout:', error)
    return null
  }
}

// Global flag to prevent duplicate workout creation across multiple calls
let isCreatingWorkout = false
let lastWorkoutCreationTime = 0
const WORKOUT_CREATION_DEBOUNCE_MS = 2000 // 2 second debounce

// Track recently completed workouts to prevent immediate duplicates
let recentlyCompletedWorkouts: Map<string, number> = new Map() // type -> timestamp
const RECENTLY_COMPLETED_WINDOW_MS = 5000 // 5 second window to prevent duplicates after completion

/**
 * Start a new workout
 * Makes creation idempotent by checking for existing active workout first
 * Uses debounce and in-flight flag to prevent duplicates
 */
export async function startWorkout(type: WorkoutType): Promise<Workout> {
  const userId = getUserId()
  
  // Debounce: prevent rapid successive calls
  const now = Date.now()
  if (isCreatingWorkout || (now - lastWorkoutCreationTime < WORKOUT_CREATION_DEBOUNCE_MS)) {
    console.log('Workout creation debounced or in progress, checking for existing workout...')
    // Try to get existing workout instead
    try {
      const existingWorkout = await getCurrentWorkout()
      if (existingWorkout && existingWorkout.type === type && !existingWorkout.completed) {
        console.log('Returning existing active workout')
        return existingWorkout
      }
    } catch (error) {
      // If check fails, wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 500))
      try {
        const existingWorkout = await getCurrentWorkout()
        if (existingWorkout && existingWorkout.type === type && !existingWorkout.completed) {
          console.log('Returning existing active workout (retry)')
          return existingWorkout
        }
      } catch (retryError) {
        console.warn('Could not check for existing workout:', retryError)
      }
    }
    
    // If still creating, throw error to prevent duplicate
    if (isCreatingWorkout) {
      throw new Error('Workout creation already in progress. Please wait...')
    }
  }
  
  // Check for existing active workout of the same type to prevent duplicates
  try {
    const existingWorkout = await getCurrentWorkout()
    if (existingWorkout && existingWorkout.type === type && !existingWorkout.completed) {
      console.log('Active workout of same type already exists, returning existing workout')
      return existingWorkout
    }
  } catch (error) {
    // If getCurrentWorkout fails (e.g., index not ready), log but continue
    // This prevents blocking workout creation if index is still building
    console.warn('Could not check for existing workout (index may be building):', error)
  }
  
  // Check if a workout of this type was recently completed to prevent duplicates
  const recentlyCompletedTime = recentlyCompletedWorkouts.get(type)
  if (recentlyCompletedTime && (now - recentlyCompletedTime < RECENTLY_COMPLETED_WINDOW_MS)) {
    const timeSinceCompletion = now - recentlyCompletedTime
    console.log(`Workout of type ${type} was completed ${timeSinceCompletion}ms ago, checking for active workout again...`)
    
    // Wait a bit for Firestore to propagate the completion update, then check again
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Double-check for active workout - if completion hasn't propagated, we might still find it
    try {
      const existingWorkout = await getCurrentWorkout()
      if (existingWorkout && existingWorkout.type === type && !existingWorkout.completed) {
        console.log('Found active workout after waiting, returning it instead of creating duplicate')
        return existingWorkout
      }
    } catch (checkError) {
      console.warn('Error checking for active workout after completion:', checkError)
    }
    
    // If we still don't find an active workout, it's safe to create a new one
    // (the recently completed workout has been properly saved)
    console.log('No active workout found after completion, proceeding with new workout creation')
  }
  
  // Set flag and timestamp
  isCreatingWorkout = true
  lastWorkoutCreationTime = now
  
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
    
    const createdWorkout = {
      ...newWorkout,
      id: docRef.id,
    } as Workout
    
    // Reset flag after successful creation
    isCreatingWorkout = false
    
    return createdWorkout
  } catch (error) {
    // Reset flag on error
    isCreatingWorkout = false
    console.error('Error starting workout:', error)
    throw error
  }
}

/**
 * Create a workout with a specific date (for adding past workouts)
 */
export async function createWorkoutWithDate(type: WorkoutType, date: Date): Promise<Workout> {
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
  
  // Get all exercises for this workout type
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

  // Set the date to start of day for consistency
  const workoutDate = new Date(date)
  workoutDate.setHours(0, 0, 0, 0)

  const newWorkout = {
    type,
    date: workoutDate,
    startTime: workoutDate,
    exercises,
    completed: true, // Mark as completed since it's a past workout
    userId,
  }

  try {
    const workoutsRef = collection(db, WORKOUTS_COLLECTION)
    const docRef = await addDoc(workoutsRef, {
      ...workoutToFirestore(newWorkout as Workout),
      userId,
    })
    
    return {
      ...newWorkout,
      id: docRef.id,
    } as Workout
  } catch (error) {
    console.error('Error creating workout with date:', error)
    throw error
  }
}

/**
 * Update an existing workout
 */
export async function updateWorkout(workout: Workout): Promise<void> {
  try {
    const workoutRef = doc(db, WORKOUTS_COLLECTION, workout.id)
    const payload = {
      ...workoutToFirestore(workout),
      updatedAt: serverTimestamp(),
    }
    
    // Debug: Check for undefined values before sending
    const undefinedFields: string[] = []
    const checkUndefined = (obj: any, path = ''): void => {
      if (obj === null || typeof obj !== 'object') return
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key
        if (value === undefined) {
          undefinedFields.push(currentPath)
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          checkUndefined(value, currentPath)
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'object' && item !== null) {
              checkUndefined(item, `${currentPath}[${index}]`)
            }
          })
        }
      }
    }
    checkUndefined(payload)
    
    if (undefinedFields.length > 0) {
      console.warn('Found undefined fields in workout payload:', undefinedFields)
    }
    
    console.log('Updating workout with payload:', JSON.stringify(payload, null, 2))
    await updateDoc(workoutRef, payload)
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
    
    // Track this completed workout to prevent immediate duplicates
    recentlyCompletedWorkouts.set(workout.type, Date.now())
    
    // Clean up old entries after window expires
    setTimeout(() => {
      recentlyCompletedWorkouts.delete(workout.type)
    }, RECENTLY_COMPLETED_WINDOW_MS)
    
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
 * In Firestore, we'll query for workouts without an endTime and not completed
 * Note: This query requires a composite index: userId (Ascending), endTime (Ascending), startTime (Descending)
 */
export async function getCurrentWorkout(): Promise<Workout | null> {
  try {
    const userId = getUserId()
    const workoutsRef = collection(db, WORKOUTS_COLLECTION)
    
    // Query order must match index: userId, endTime, startTime
    const q = query(
      workoutsRef,
      where('userId', '==', userId),
      where('endTime', '==', null),
      orderBy('startTime', 'desc')
    )
    const querySnapshot = await getDocs(q)
    
    if (!querySnapshot.empty) {
      const firstDoc = querySnapshot.docs[0]
      const workout = firestoreToWorkout(firstDoc.id, firstDoc.data())
      // Double-check that the workout is not completed (safety check)
      if (workout.completed || workout.endTime) {
        console.warn('Found workout with endTime or completed flag set, ignoring it')
        return null
      }
      return workout
    }
    return null
  } catch (error: any) {
    // Check if it's an index error
    if (error?.code === 'failed-precondition' && error?.message?.includes('index')) {
      console.error('Firestore index required. Please create the composite index:', error.message)
      // Extract index creation link if available
      const indexLinkMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
      if (indexLinkMatch) {
        console.error('Create index at:', indexLinkMatch[0])
      }
      // Re-throw with more context for error handler
      throw new Error(`Firestore index required. ${indexLinkMatch ? `Create it at: ${indexLinkMatch[0]}` : 'Check Firebase console for required indexes.'}`)
    }
    console.error('Error getting current workout:', error)
    throw error
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

