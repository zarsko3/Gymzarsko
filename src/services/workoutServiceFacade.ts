/**
 * Workout Service Facade
 * 
 * This file acts as a facade that routes calls to either:
 * - Local Storage (for development/offline)
 * - Firestore (for production/cloud)
 * 
 * Based on the USE_FIRESTORE configuration
 */

import { USE_FIRESTORE } from './config'
import type { Exercise, Workout, WorkoutType } from '../types'

// Import both implementations
import * as localStorageService from './workoutService'
import * as firestoreService from './firestoreWorkoutService'
import { mockExercises } from './mockData'

/**
 * Get all workouts
 */
export async function getWorkouts(): Promise<Workout[]> {
  if (USE_FIRESTORE) {
    return await firestoreService.getWorkouts()
  }
  return Promise.resolve(localStorageService.getWorkouts())
}

/**
 * Get workout by ID
 */
export async function getWorkoutById(id: string): Promise<Workout | null> {
  if (USE_FIRESTORE) {
    return await firestoreService.getWorkoutById(id)
  }
  return Promise.resolve(localStorageService.getWorkoutById(id))
}

/**
 * Start a new workout
 */
export async function startWorkout(type: WorkoutType): Promise<Workout> {
  if (USE_FIRESTORE) {
    return await firestoreService.startWorkout(type)
  }
  return Promise.resolve(localStorageService.startWorkout(type))
}

/**
 * Create a workout with a specific date (for adding past workouts)
 */
export async function createWorkoutWithDate(type: WorkoutType, date: Date): Promise<Workout> {
  if (USE_FIRESTORE) {
    return await firestoreService.createWorkoutWithDate(type, date)
  }
  // For localStorage, create workout with custom date
  const workout = localStorageService.startWorkout(type)
  workout.date = new Date(date)
  workout.date.setHours(0, 0, 0, 0)
  workout.completed = true
  localStorageService.completeWorkout(workout)
  return workout
}

/**
 * Update workout
 */
export async function updateWorkout(workout: Workout): Promise<void> {
  if (USE_FIRESTORE) {
    return await firestoreService.updateWorkout(workout)
  }
  localStorageService.updateCurrentWorkout(workout)
  return Promise.resolve()
}

/**
 * Complete workout
 */
export async function completeWorkout(workout: Workout): Promise<Workout> {
  if (USE_FIRESTORE) {
    return await firestoreService.completeWorkout(workout)
  }
  return Promise.resolve(localStorageService.completeWorkout(workout))
}

/**
 * Cancel workout (delete active workout if needed)
 */
export async function cancelWorkout(workoutId?: string): Promise<void> {
  if (USE_FIRESTORE) {
    const targetId =
      workoutId || (await firestoreService.getCurrentWorkout())?.id
    if (targetId) {
      await firestoreService.deleteWorkout(targetId)
    }
    return
  }
  localStorageService.cancelWorkout()
  return Promise.resolve()
}

/**
 * Delete workout
 */
export async function deleteWorkout(id: string): Promise<void> {
  if (USE_FIRESTORE) {
    return await firestoreService.deleteWorkout(id)
  }
  localStorageService.deleteWorkout(id)
  return Promise.resolve()
}

/**
 * Get current active workout
 */
export async function getCurrentWorkout(): Promise<Workout | null> {
  if (USE_FIRESTORE) {
    return await firestoreService.getCurrentWorkout()
  }
  return Promise.resolve(localStorageService.getCurrentWorkout())
}

/**
 * Subscribe to workouts for real-time updates (Firestore only)
 * Returns an unsubscribe function
 */
export function subscribeToWorkouts(
  callback: (workouts: Workout[]) => void,
  onError?: (error: unknown) => void
): (() => void) {
  if (USE_FIRESTORE) {
    return firestoreService.subscribeToWorkouts(callback, onError)
  }
  // For localStorage, just call the callback once with current data
  const workouts = localStorageService.getWorkouts()
  callback(workouts)
  // Return a no-op unsubscribe function
  return () => {}
}

/**
 * Get static exercise catalog used across services
 */
export function getExerciseCatalog(): Exercise[] {
  return mockExercises
}

