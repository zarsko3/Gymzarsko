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
import type { Workout, WorkoutType } from '../types'

// Import both implementations
import * as localStorageService from './workoutService'
import * as firestoreService from './firestoreWorkoutService'

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

