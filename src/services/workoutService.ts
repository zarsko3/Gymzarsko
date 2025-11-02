import type { Workout, WorkoutType, Exercise } from '../types'
import { mockExercises, generateMockWorkout } from './mockData'

// Local storage keys
const WORKOUTS_KEY = 'gymzarski_workouts'
const CURRENT_WORKOUT_KEY = 'gymzarski_current_workout'

// Get all workouts from local storage
export const getWorkouts = (): Workout[] => {
  try {
    const data = localStorage.getItem(WORKOUTS_KEY)
    if (!data) return []
    
    const workouts = JSON.parse(data)
    // Convert date strings back to Date objects
    return workouts.map((w: any) => ({
      ...w,
      date: new Date(w.date),
      startTime: w.startTime ? new Date(w.startTime) : undefined,
      endTime: w.endTime ? new Date(w.endTime) : undefined,
    }))
  } catch (error) {
    console.error('Error loading workouts:', error)
    return []
  }
}

// Save workout to local storage
export const saveWorkout = (workout: Workout): void => {
  try {
    const workouts = getWorkouts()
    const index = workouts.findIndex(w => w.id === workout.id)
    
    if (index >= 0) {
      workouts[index] = workout
    } else {
      workouts.push(workout)
    }
    
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts))
  } catch (error) {
    console.error('Error saving workout:', error)
  }
}

// Delete workout
export const deleteWorkout = (workoutId: string): void => {
  try {
    const workouts = getWorkouts().filter(w => w.id !== workoutId)
    localStorage.setItem(WORKOUTS_KEY, JSON.stringify(workouts))
  } catch (error) {
    console.error('Error deleting workout:', error)
  }
}

// Get current workout in progress
export const getCurrentWorkout = (): Workout | null => {
  try {
    const data = localStorage.getItem(CURRENT_WORKOUT_KEY)
    if (!data) return null
    
    const workout = JSON.parse(data)
    return {
      ...workout,
      date: new Date(workout.date),
      startTime: workout.startTime ? new Date(workout.startTime) : undefined,
      endTime: workout.endTime ? new Date(workout.endTime) : undefined,
    }
  } catch (error) {
    console.error('Error loading current workout:', error)
    return null
  }
}

// Start a new workout
export const startWorkout = (type: WorkoutType): Workout => {
  const workout = generateMockWorkout(type)
  workout.startTime = new Date()
  localStorage.setItem(CURRENT_WORKOUT_KEY, JSON.stringify(workout))
  return workout
}

// Update current workout
export const updateCurrentWorkout = (workout: Workout): void => {
  localStorage.setItem(CURRENT_WORKOUT_KEY, JSON.stringify(workout))
}

// Complete and save current workout
export const completeWorkout = (workout: Workout): void => {
  workout.completed = true
  workout.endTime = new Date()
  saveWorkout(workout)
  localStorage.removeItem(CURRENT_WORKOUT_KEY)
}

// Cancel current workout
export const cancelWorkout = (): void => {
  localStorage.removeItem(CURRENT_WORKOUT_KEY)
}

// Get exercises by category
export const getExercisesByCategory = (category: string): Exercise[] => {
  return mockExercises.filter(ex => ex.category === category)
}

// Get all exercises
export const getAllExercises = (): Exercise[] => {
  return mockExercises
}

