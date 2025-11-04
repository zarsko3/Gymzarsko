import { collection, getDocs, addDoc, query, where, Timestamp } from 'firebase/firestore'
import { db, auth } from '../lib/firebase'
import type { Plan, WorkoutType } from '../types'
import { mockExercises } from './mockData'

const PLANS_COLLECTION = 'plans'

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
  // Define sets per exercise based on workout program
  const setsPerExercise: Record<string, number> = {
    // Push: 4, 4, 3, 3, 3, 3, 3 sets
    'push-1': 4, 'push-2': 4, 'push-3': 3, 'push-4': 3, 'push-5': 3, 'push-6': 3, 'push-7': 3,
    // Pull: 4, 4, 3, 3, 3, 3, 3 sets
    'pull-1': 4, 'pull-2': 4, 'pull-3': 3, 'pull-4': 3, 'pull-5': 3, 'pull-6': 3, 'pull-7': 3,
    // Legs: 3, 4, 4, 3, 3, 3 sets
    'legs-1': 3, 'legs-2': 4, 'legs-3': 4, 'legs-4': 3, 'legs-5': 3, 'legs-6': 3,
  }

  // Default reps per exercise
  const defaultReps = 10

  const plans: Plan[] = ['push', 'pull', 'legs'].map((type) => {
    const exercises = mockExercises
      .filter(ex => ex.category === type)
      .map(exercise => ({
        name: exercise.name,
        defaultSets: setsPerExercise[exercise.id] || 3,
        defaultReps,
        muscleGroup: exercise.muscleGroup,
      }))

    return {
      id: `default-${type}`,
      name: type.charAt(0).toUpperCase() + type.slice(1),
      type: type as WorkoutType,
      exercises,
    }
  })

  return plans
}

/**
 * Get user's custom plans from Firestore
 */
export async function getUserPlans(userId: string): Promise<Plan[]> {
  try {
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
    const userId = getUserId()
    const userPlans = await getUserPlans(userId)
    return [...defaultPlans, ...userPlans]
  } catch (error) {
    // If not authenticated, return only default plans
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

