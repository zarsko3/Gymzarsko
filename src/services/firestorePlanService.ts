import { collection, getDocs, addDoc, deleteDoc, doc, query, where, Timestamp, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { Plan, WorkoutType } from '../types'
import { mockExercises, getDefaultSets } from './mockData'
import { WORKOUT_TYPES } from '../constants/workoutTypes'

const PLANS_COLLECTION = 'plans'
const CUSTOM_EXERCISES_COLLECTION = 'customExercises'

export interface CustomExercise {
  id: string
  name: string
  muscleGroup: string
  category: WorkoutType
  defaultSets: number
  defaultReps: number
  /**
   * true: added to every new workout of `category`. false: only kept in the
   * exercise library (search and swaps). Older entries have no flag and were
   * always template exercises.
   */
  inTemplate?: boolean
  createdAt?: Date
}

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
 * Get default plans (Push, Pull, Legs)
 */
export function getDefaultPlans(): Plan[] {
  // Default reps per exercise
  const defaultReps = 10

  const plans: Plan[] = WORKOUT_TYPES.map(({ id: type, shortName }) => {
    const exercises = mockExercises
      .filter(ex => ex.category === type)
      .map(exercise => ({
        name: exercise.name,
        defaultSets: getDefaultSets(exercise.id),
        defaultReps,
        muscleGroup: exercise.muscleGroup,
      }))

    return {
      id: `default-${type}`,
      name: shortName,
      type,
      exercises,
    }
  })

  return plans
}

/**
 * Get current user's custom plans from Firestore
 * Note: Only fetches plans for the authenticated user (no userId parameter for security)
 */
export async function getUserPlans(): Promise<Plan[]> {
  try {
    const userId = getUserId()
    const plansRef = collection(db, 'users', userId, PLANS_COLLECTION)
    const querySnapshot = await getDocs(plansRef)

    return querySnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.() || data.updatedAt,
      } as Plan
    })
  } catch (error) {
    console.error('Error getting user plans:', error)
    return []
  }
}

/**
 * Get all available plans (default + user custom)
 */
export async function getAllPlans(): Promise<Plan[]> {
  const defaultPlans = getDefaultPlans()

  try {
    // Check if user is authenticated before trying to get user plans
    if (!auth.currentUser) {
      console.log('User not authenticated, returning default plans only')
      return defaultPlans
    }

    const userPlans = await getUserPlans()
    return [...defaultPlans, ...userPlans]
  } catch (error) {
    console.error('Error getting all plans:', error)
    // If there's an error (e.g., permission denied), return only default plans
    return defaultPlans
  }
}

/**
 * Create a custom plan for the user
 */
export async function createPlan(plan: Omit<Plan, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<Plan> {
  const userId = getUserId()

  try {
    const plansRef = collection(db, 'users', userId, PLANS_COLLECTION)
    const docRef = await addDoc(plansRef, {
      ...plan,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return {
      ...plan,
      id: docRef.id,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error('Error creating plan:', error)
    throw error
  }
}

/**
 * Save a custom exercise to the user's template for a specific workout type.
 * Prevents duplicates by checking if an exercise with the same name already exists.
 */
export async function saveCustomExercise(
  exercise: Omit<CustomExercise, 'id' | 'createdAt' | 'inTemplate'>,
  options: { inTemplate?: boolean } = {},
): Promise<CustomExercise> {
  const userId = getUserId()
  const inTemplate = options.inTemplate ?? true

  try {
    const exercisesRef = collection(db, 'users', userId, CUSTOM_EXERCISES_COLLECTION)
    const toExercise = (d: { id: string; data: () => Record<string, any> }) =>
      ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() }) as CustomExercise

    if (!inTemplate) {
      // Library entry: one per name, whichever workout type it was created in
      const existing = await getDocs(query(exercisesRef, where('name', '==', exercise.name)))
      if (!existing.empty) return toExercise(existing.docs[0])
    } else {
      // Template entry: one per name and workout type
      const existing = await getDocs(
        query(exercisesRef, where('category', '==', exercise.category), where('name', '==', exercise.name))
      )
      if (!existing.empty) {
        const existingDoc = existing.docs[0]
        // A library-only entry becomes part of the template
        if (existingDoc.data().inTemplate === false) {
          await updateDoc(existingDoc.ref, { inTemplate: true })
        }
        return { ...toExercise(existingDoc), inTemplate: true }
      }
    }

    const docRef = await addDoc(exercisesRef, {
      ...exercise,
      inTemplate,
      createdAt: serverTimestamp(),
    })

    return {
      ...exercise,
      inTemplate,
      id: docRef.id,
      createdAt: new Date(),
    }
  } catch (error) {
    console.error('Error saving custom exercise:', error)
    throw error
  }
}

/**
 * Every exercise the user created, for search and swaps.
 */
export async function getLibraryExercises(): Promise<CustomExercise[]> {
  try {
    const userId = getUserId()
    const snapshot = await getDocs(collection(db, 'users', userId, CUSTOM_EXERCISES_COLLECTION))
    return snapshot.docs.map(d => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() })) as CustomExercise[]
  } catch (error) {
    console.error('Error getting exercise library:', error)
    return []
  }
}

/**
 * Custom exercises that belong in every new workout of this type
 * (library-only entries are left out).
 */
export async function getCustomExercises(workoutType: WorkoutType): Promise<CustomExercise[]> {
  try {
    const userId = getUserId()
    const exercisesRef = collection(db, 'users', userId, CUSTOM_EXERCISES_COLLECTION)
    const q = query(exercisesRef, where('category', '==', workoutType))
    const snapshot = await getDocs(q)

    return (snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.(),
    })) as CustomExercise[]).filter(exercise => exercise.inTemplate !== false)
  } catch (error) {
    console.error('Error getting custom exercises:', error)
    return []
  }
}

/**
 * Remove a custom exercise from the user's template.
 */
export async function removeCustomExercise(exerciseId: string): Promise<void> {
  const userId = getUserId()

  try {
    const exerciseRef = doc(db, 'users', userId, CUSTOM_EXERCISES_COLLECTION, exerciseId)
    await deleteDoc(exerciseRef)
  } catch (error) {
    console.error('Error removing custom exercise:', error)
    throw error
  }
}



