import type { Exercise, Workout, WorkoutType, UserProfile } from '../types'

// Mock Exercise Database - Updated to match PPL Workout Routine
export const mockExercises: Exercise[] = [
  // Push Exercises (6 exercises)
  { id: 'push-1', name: 'Bench Press', muscleGroup: 'Chest', category: 'push' },
  { id: 'push-2', name: 'Overhead Shoulder Press', muscleGroup: 'Shoulders', category: 'push' },
  { id: 'push-3', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', category: 'push' },
  { id: 'push-4', name: 'Lateral Raises', muscleGroup: 'Shoulders', category: 'push' },
  { id: 'push-5', name: 'Triceps Pushdowns', muscleGroup: 'Triceps', category: 'push' },
  { id: 'push-6', name: 'Skull Crushers', muscleGroup: 'Triceps', category: 'push' },

  // Pull Exercises (6 exercises)
  { id: 'pull-1', name: 'Pull-Ups', muscleGroup: 'Back', category: 'pull' },
  { id: 'pull-2', name: 'Barbell Row', muscleGroup: 'Back', category: 'pull' },
  { id: 'pull-3', name: 'Face Pulls', muscleGroup: 'Rear Delts', category: 'pull' },
  { id: 'pull-4', name: 'Dumbbell Shrugs', muscleGroup: 'Traps', category: 'pull' },
  { id: 'pull-5', name: 'Cable Bicep Curls', muscleGroup: 'Biceps', category: 'pull' },
  { id: 'pull-6', name: 'Hammer Curls', muscleGroup: 'Biceps', category: 'pull' },

  // Leg Exercises (6 exercises)
  { id: 'legs-1', name: 'Squats', muscleGroup: 'Quads', category: 'legs' },
  { id: 'legs-2', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', category: 'legs' },
  { id: 'legs-3', name: 'Lunges', muscleGroup: 'Quads/Glutes', category: 'legs' },
  { id: 'legs-4', name: 'Leg Curl Machine', muscleGroup: 'Hamstrings', category: 'legs' },
  { id: 'legs-5', name: 'Standing Calf Raises', muscleGroup: 'Calves', category: 'legs' },
  { id: 'legs-6', name: 'Plank', muscleGroup: 'Core', category: 'legs' },
]

// Mock User Profile
export const mockUserProfile: UserProfile = {
  id: 'user1',
  displayName: 'Guest User',
  email: 'guest@gymzarsko.app',
  photoURL: undefined,
  theme: 'light',
  notifications: {
    workoutReminders: true,
    progressUpdates: true,
    emailNotifications: false,
  },
  language: 'en',
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Helper to generate mock workouts with correct sets per exercise
export const generateMockWorkout = (type: WorkoutType): Workout => {
  const exercises = mockExercises.filter(ex => ex.category === type)
  
  // Define number of sets per exercise based on workout program
  const setsPerExercise: Record<string, number> = {
    // Push: 4, 4, 3, 3, 3, 3 sets
    'push-1': 4, 'push-2': 4, 'push-3': 3, 'push-4': 3, 'push-5': 3, 'push-6': 3,
    // Pull: 4, 4, 3, 3, 3, 3 sets
    'pull-1': 4, 'pull-2': 4, 'pull-3': 3, 'pull-4': 3, 'pull-5': 3, 'pull-6': 3,
    // Legs: 4, 4, 3, 3, 3, 3 sets
    'legs-1': 4, 'legs-2': 4, 'legs-3': 3, 'legs-4': 3, 'legs-5': 3, 'legs-6': 3,
  }
  
  return {
    id: `workout-${Date.now()}`,
    type,
    date: new Date(),
    exercises: exercises.map(exercise => ({
      id: `we-${exercise.id}-${Date.now()}`,
      exerciseId: exercise.id,
      exercise,
      sets: Array(setsPerExercise[exercise.id] || 3).fill(null).map((_, i) => ({
        id: `set-${i}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        weight: 0,
        reps: 0,
        completed: false,
      })),
    })),
    completed: false,
  }
}

