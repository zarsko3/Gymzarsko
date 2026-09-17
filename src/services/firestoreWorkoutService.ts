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
import { mockExercises, getDefaultSets } from './mockData'
import { getCustomExercises } from './firestorePlanService'
import { ABANDONED_WORKOUT_AFTER_MS, getWorkoutStart, hasCompletedSets, isAbandonedWorkout } from '../utils/workoutStatus'

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

// In-flight starts per type: concurrent callers share one request instead of racing
const pendingStarts = new Map<WorkoutType, Promise<Workout>>()

// Last workout created per type. Covers the gap where a lookup fails (e.g. index
// still building) right after creation; cleared when that workout ends.
const lastCreated = new Map<WorkoutType, { workout: Workout; at: number }>()
const LAST_CREATED_TTL_MS = 60 * 1000

function forgetCreatedWorkout(workoutId: string) {
  for (const [type, entry] of lastCreated) {
    if (entry.workout.id === workoutId) lastCreated.delete(type)
  }
}

/**
 * Start a workout of the given type, or return the one already in progress.
 * Safe to call concurrently — it never creates two workouts for the same start.
 */
export function startWorkout(type: WorkoutType): Promise<Workout> {
  const pending = pendingStarts.get(type)
  if (pending) return pending

  const promise = findOrCreateWorkout(type).finally(() => {
    pendingStarts.delete(type)
  })
  pendingStarts.set(type, promise)
  return promise
}

async function findOrCreateWorkout(type: WorkoutType): Promise<Workout> {
  const userId = getUserId()

  try {
    const existingWorkout = await getCurrentWorkout()
    if (existingWorkout && existingWorkout.type === type) {
      return existingWorkout
    }
  } catch (error) {
    // Don't block starting a workout if the lookup fails (e.g. index still building)
    console.warn('Could not check for existing workout:', error)
    const recent = lastCreated.get(type)
    if (recent && Date.now() - recent.at < LAST_CREATED_TTL_MS) {
      return recent.workout
    }
  }

  // Get default exercises for this workout type
  const defaultExercises = mockExercises
    .filter(ex => ex.category === type)
    .map(exercise => ({
      id: `we-${exercise.id}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      exerciseId: exercise.id,
      exercise,
      sets: Array(getDefaultSets(exercise.id)).fill(null).map((_, i) => ({
        id: `set-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        weight: 0,
        reps: 0,
        completed: false,
      })),
    }))

  // Fetch user's saved custom exercises for this workout type and append them
  let customExerciseEntries: typeof defaultExercises = []
  try {
    const customExercises = await getCustomExercises(type)
    // Exclude any that share a name with a default exercise (case-insensitive)
    const defaultNames = new Set(mockExercises.filter(ex => ex.category === type).map(ex => ex.name.toLowerCase()))
    customExerciseEntries = customExercises
      .filter(ce => !defaultNames.has(ce.name.toLowerCase()))
      .map(ce => ({
        id: `we-custom-${ce.id}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        exerciseId: ce.id,
        exercise: {
          id: ce.id,
          name: ce.name,
          muscleGroup: ce.muscleGroup,
          category: ce.category,
        },
        sets: Array(ce.defaultSets || 3).fill(null).map((_, i) => ({
          id: `set-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          weight: 0,
          reps: 0,
          completed: false,
        })),
      }))
  } catch (error) {
    // Non-blocking: if custom exercises fail to load, proceed with defaults
    console.warn('Could not load custom exercises:', error)
  }

  const exercises = [...defaultExercises, ...customExerciseEntries]

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

    lastCreated.set(type, { workout: createdWorkout, at: Date.now() })
    return createdWorkout
  } catch (error) {
    console.error('Error starting workout:', error)
    throw error
  }
}

/**
 * Create a workout with a specific date (for adding past workouts)
 */
export async function createWorkoutWithDate(type: WorkoutType, date: Date): Promise<Workout> {
  const userId = getUserId()
  
  // Get default exercises for this workout type
  const defaultExercises = mockExercises
    .filter(ex => ex.category === type)
    .map(exercise => ({
      id: `we-${exercise.id}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      exerciseId: exercise.id,
      exercise,
      sets: Array(getDefaultSets(exercise.id)).fill(null).map((_, i) => ({
        id: `set-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        weight: 0,
        reps: 0,
        completed: false,
      })),
    }))

  // Fetch user's saved custom exercises for this workout type and append them
  let customExerciseEntries: typeof defaultExercises = []
  try {
    const customExercises = await getCustomExercises(type)
    const defaultNames = new Set(mockExercises.filter(ex => ex.category === type).map(ex => ex.name.toLowerCase()))
    customExerciseEntries = customExercises
      .filter(ce => !defaultNames.has(ce.name.toLowerCase()))
      .map(ce => ({
        id: `we-custom-${ce.id}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        exerciseId: ce.id,
        exercise: {
          id: ce.id,
          name: ce.name,
          muscleGroup: ce.muscleGroup,
          category: ce.category,
        },
        sets: Array(ce.defaultSets || 3).fill(null).map((_, i) => ({
          id: `set-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          weight: 0,
          reps: 0,
          completed: false,
        })),
      }))
  } catch (error) {
    console.warn('Could not load custom exercises:', error)
  }

  const exercises = [...defaultExercises, ...customExerciseEntries]

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

    await updateDoc(workoutRef, payload)
  } catch (error) {
    console.error('Error updating workout:', error)
    throw error
  }
}

/**
 * Complete a workout
 * Uses a targeted update — only writes completion fields so that
 * stale in-flight updateWorkout() calls cannot overwrite them.
 */
export async function completeWorkout(workout: Workout): Promise<Workout> {
  const endTime = new Date()

  try {
    const workoutRef = doc(db, WORKOUTS_COLLECTION, workout.id)
    await updateDoc(workoutRef, {
      completed: true,
      endTime: Timestamp.fromDate(endTime),
      updatedAt: serverTimestamp(),
    })

    forgetCreatedWorkout(workout.id)

    return {
      ...workout,
      endTime,
      completed: true,
    }
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
    forgetCreatedWorkout(id)
  } catch (error) {
    console.error('Error deleting workout:', error)
    throw error
  }
}

/**
 * Close a workout that was left open: keep it (marked completed) if any set was
 * logged, otherwise delete the empty shell.
 */
export async function closeAbandonedWorkout(workout: Workout): Promise<void> {
  const workoutRef = doc(db, WORKOUTS_COLLECTION, workout.id)

  if (!hasCompletedSets(workout)) {
    await deleteDoc(workoutRef)
    return
  }

  // Best guess for when the session ended: the last save, capped to a sane length
  const start = getWorkoutStart(workout) ?? new Date()
  const lastSave = (workout as { updatedAt?: unknown }).updatedAt
  const lastSaveDate = lastSave instanceof Timestamp ? lastSave.toDate() : null
  const maxEnd = new Date(start.getTime() + ABANDONED_WORKOUT_AFTER_MS)
  const endTime = lastSaveDate && lastSaveDate > start && lastSaveDate < maxEnd
    ? lastSaveDate
    : new Date(start.getTime() + 60 * 60 * 1000)

  await updateDoc(workoutRef, {
    completed: true,
    endTime: Timestamp.fromDate(endTime),
    updatedAt: serverTimestamp(),
  })
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
    
    // Skip past workouts added from History (no endTime but completed) and
    // workouts left open long ago — those get closed by cleanUpAbandonedWorkouts
    const active = querySnapshot.docs
      .map((d) => firestoreToWorkout(d.id, d.data()))
      .find((workout) => !workout.completed && !isAbandonedWorkout(workout))
    return active ?? null
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
  callback: (workouts: Workout[]) => void,
  onError?: (error: unknown) => void
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
        onError?.(error)
      }
    )
  } catch (error) {
    console.error('Error setting up workouts subscription:', error)
    onError?.(error)
    // Return a no-op unsubscribe function
    return () => {}
  }
}

