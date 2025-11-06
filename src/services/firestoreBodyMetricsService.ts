import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  limit,
} from 'firebase/firestore'
import type { Unsubscribe } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { BodyMetricEntry, BodyMetricGoal } from '../types'

const BODY_METRICS_COLLECTION = 'bodyMetrics'
const BODY_METRIC_GOALS_COLLECTION = 'bodyMetricGoals'

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
 * Normalize date to start of day
 */
function normalizeDate(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  normalized.setMilliseconds(0)
  return normalized
}

/**
 * Convert Firestore document to BodyMetricEntry
 */
function firestoreToBodyMetric(docId: string, data: any): BodyMetricEntry {
  return {
    id: docId,
    userId: data.userId,
    date: toDateSafe(data.date),
    weight: data.weight,
    createdAt: toDateSafe(data.createdAt),
    updatedAt: toDateSafe(data.updatedAt),
  }
}

/**
 * Convert BodyMetricEntry to Firestore document
 */
function bodyMetricToFirestore(entry: BodyMetricEntry) {
  return {
    userId: entry.userId,
    date: toTimestampSafe(normalizeDate(entry.date)),
    weight: entry.weight,
    createdAt: entry.createdAt ? toTimestampSafe(entry.createdAt) : serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

/**
 * Convert Firestore document to BodyMetricGoal
 */
function firestoreToBodyMetricGoal(data: any): BodyMetricGoal {
  return {
    userId: data.userId,
    targetWeight: data.targetWeight,
    targetDate: data.targetDate ? toDateSafe(data.targetDate) : undefined,
    createdAt: toDateSafe(data.createdAt),
    updatedAt: toDateSafe(data.updatedAt),
  }
}

/**
 * Convert BodyMetricGoal to Firestore document
 */
function bodyMetricGoalToFirestore(goal: BodyMetricGoal) {
  return {
    userId: goal.userId,
    targetWeight: goal.targetWeight,
    targetDate: goal.targetDate ? toTimestampSafe(goal.targetDate) : null,
    createdAt: goal.createdAt ? toTimestampSafe(goal.createdAt) : serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

/**
 * Add a new body metric entry
 */
export async function addBodyMetric(weight: number, date: Date): Promise<BodyMetricEntry> {
  const userId = getUserId()
  
  // Validate weight
  if (weight <= 0 || weight > 300) {
    throw new Error('Weight must be between 0 and 300 kg')
  }
  
  // Normalize date to start of day
  const normalizedDate = normalizeDate(date)
  
  // Check if entry already exists for this date
  const existingEntry = await getBodyMetricByDate(normalizedDate)
  if (existingEntry) {
    // Update existing entry instead of creating duplicate
    await updateBodyMetric(existingEntry.id, weight)
    // Return the updated entry
    return {
      ...existingEntry,
      weight,
      updatedAt: new Date(),
    }
  }
  
  const newEntry: Omit<BodyMetricEntry, 'id'> = {
    userId,
    date: normalizedDate,
    weight,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  try {
    const metricsRef = collection(db, 'users', userId, BODY_METRICS_COLLECTION)
    const docRef = await addDoc(metricsRef, bodyMetricToFirestore(newEntry as BodyMetricEntry))
    
    return {
      ...newEntry,
      id: docRef.id,
    }
  } catch (error) {
    console.error('Error adding body metric:', error)
    throw error
  }
}

/**
 * Get body metric entry by date
 */
export async function getBodyMetricByDate(date: Date): Promise<BodyMetricEntry | null> {
  const userId = getUserId()
  const normalizedDate = normalizeDate(date)
  
  try {
    const metricsRef = collection(db, 'users', userId, BODY_METRICS_COLLECTION)
    const startOfDay = Timestamp.fromDate(normalizedDate)
    const endOfDay = new Date(normalizedDate)
    endOfDay.setHours(23, 59, 59, 999)
    const endOfDayTimestamp = Timestamp.fromDate(endOfDay)
    
    const q = query(
      metricsRef,
      where('date', '>=', startOfDay),
      where('date', '<=', endOfDayTimestamp),
      limit(1)
    )
    
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      return null
    }
    
    const doc = querySnapshot.docs[0]
    return firestoreToBodyMetric(doc.id, doc.data())
  } catch (error) {
    console.error('Error getting body metric by date:', error)
    return null
  }
}

/**
 * Update an existing body metric entry
 */
export async function updateBodyMetric(entryId: string, weight: number, date?: Date): Promise<void> {
  const userId = getUserId()
  
  // Validate weight
  if (weight <= 0 || weight > 300) {
    throw new Error('Weight must be between 0 and 300 kg')
  }
  
  try {
    const metricRef = doc(db, 'users', userId, BODY_METRICS_COLLECTION, entryId)
    const updateData: any = {
      weight,
      updatedAt: serverTimestamp(),
    }
    
    // If date is provided and different, update it
    if (date) {
      const normalizedDate = normalizeDate(date)
      updateData.date = toTimestampSafe(normalizedDate)
    }
    
    await updateDoc(metricRef, updateData)
  } catch (error) {
    console.error('Error updating body metric:', error)
    throw error
  }
}

/**
 * Delete a body metric entry
 */
export async function deleteBodyMetric(entryId: string): Promise<void> {
  const userId = getUserId()
  
  try {
    const metricRef = doc(db, 'users', userId, BODY_METRICS_COLLECTION, entryId)
    await deleteDoc(metricRef)
  } catch (error) {
    console.error('Error deleting body metric:', error)
    throw error
  }
}

/**
 * Get body metrics within a date range
 */
export async function getBodyMetrics(
  startDate?: Date,
  endDate?: Date
): Promise<BodyMetricEntry[]> {
  const userId = getUserId()
  
  try {
    const metricsRef = collection(db, 'users', userId, BODY_METRICS_COLLECTION)
    let q = query(metricsRef, orderBy('date', 'desc'))
    
    if (startDate) {
      q = query(q, where('date', '>=', toTimestampSafe(startDate)))
    }
    if (endDate) {
      q = query(q, where('date', '<=', toTimestampSafe(endDate)))
    }
    
    const querySnapshot = await getDocs(q)
    const entries: BodyMetricEntry[] = []
    
    querySnapshot.forEach((doc) => {
      entries.push(firestoreToBodyMetric(doc.id, doc.data()))
    })
    
    return entries
  } catch (error) {
    console.error('Error getting body metrics:', error)
    return []
  }
}

/**
 * Get the latest body metric entry
 */
export async function getLatestBodyMetric(): Promise<BodyMetricEntry | null> {
  const userId = getUserId()
  
  try {
    const metricsRef = collection(db, 'users', userId, BODY_METRICS_COLLECTION)
    const q = query(metricsRef, orderBy('date', 'desc'), limit(1))
    
    const querySnapshot = await getDocs(q)
    if (querySnapshot.empty) {
      return null
    }
    
    const doc = querySnapshot.docs[0]
    return firestoreToBodyMetric(doc.id, doc.data())
  } catch (error) {
    console.error('Error getting latest body metric:', error)
    return null
  }
}

/**
 * Set body metric goal
 */
export async function setBodyMetricGoal(
  targetWeight: number,
  targetDate?: Date
): Promise<void> {
  const userId = getUserId()
  
  // Validate target weight
  if (targetWeight <= 0 || targetWeight > 300) {
    throw new Error('Target weight must be between 0 and 300 kg')
  }
  
  try {
    const goalRef = doc(db, 'users', userId, BODY_METRIC_GOALS_COLLECTION, 'goal')
    const goalDoc = await getDoc(goalRef)
    
    const goalData: BodyMetricGoal = {
      userId,
      targetWeight,
      targetDate,
      createdAt: goalDoc.exists() ? firestoreToBodyMetricGoal(goalDoc.data()).createdAt : new Date(),
      updatedAt: new Date(),
    }
    
    // Use setDoc with merge to create or update
    await setDoc(goalRef, bodyMetricGoalToFirestore(goalData), { merge: true })
  } catch (error) {
    console.error('Error setting body metric goal:', error)
    throw error
  }
}

/**
 * Get body metric goal
 */
export async function getBodyMetricGoal(): Promise<BodyMetricGoal | null> {
  const userId = getUserId()
  
  try {
    const goalRef = doc(db, 'users', userId, BODY_METRIC_GOALS_COLLECTION, 'goal')
    const goalDoc = await getDoc(goalRef)
    
    if (!goalDoc.exists()) {
      return null
    }
    
    return firestoreToBodyMetricGoal(goalDoc.data())
  } catch (error) {
    console.error('Error getting body metric goal:', error)
    return null
  }
}

/**
 * Delete body metric goal
 */
export async function deleteBodyMetricGoal(): Promise<void> {
  const userId = getUserId()
  
  try {
    const goalRef = doc(db, 'users', userId, BODY_METRIC_GOALS_COLLECTION, 'goal')
    await deleteDoc(goalRef)
  } catch (error) {
    console.error('Error deleting body metric goal:', error)
    throw error
  }
}

/**
 * Subscribe to body metrics for real-time updates
 */
export function subscribeToBodyMetrics(
  callback: (entries: BodyMetricEntry[]) => void
): Unsubscribe {
  const userId = auth.currentUser?.uid
  if (!userId) {
    // Return no-op unsubscribe if not authenticated
    return () => {}
  }
  
  try {
    const metricsRef = collection(db, 'users', userId, BODY_METRICS_COLLECTION)
    const q = query(metricsRef, orderBy('date', 'desc'))
    
    return onSnapshot(
      q,
      (querySnapshot) => {
        const entries: BodyMetricEntry[] = []
        querySnapshot.forEach((doc) => {
          entries.push(firestoreToBodyMetric(doc.id, doc.data()))
        })
        callback(entries)
      },
      (error) => {
        console.error('Error in body metrics subscription:', error)
        callback([])
      }
    )
  } catch (error) {
    console.error('Error setting up body metrics subscription:', error)
    return () => {}
  }
}

