import type { Exercise, Workout, WorkoutType, UserProfile } from '../types'

// Mock Exercise Database - Updated to match PPL Workout Routine
export const mockExercises: Exercise[] = [
  // Push Exercises (Chest, Front Delts, Triceps)
  { id: 'push-1', name: 'Bench Press', muscleGroup: 'Chest', category: 'push' },
  { id: 'push-2', name: 'Overhead Shoulder Press (machine, seated)', muscleGroup: 'Front Delts', category: 'push' },
  { id: 'push-3', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', category: 'push' },
  { id: 'push-4', name: 'Lateral Raises', muscleGroup: 'Front Delts', category: 'push' },
  { id: 'push-5', name: 'Triceps Pushdowns', muscleGroup: 'Triceps', category: 'push' },
  { id: 'push-6', name: 'Skull Crushers', muscleGroup: 'Triceps', category: 'push' },
  { id: 'push-7', name: 'Chest Press (machine)', muscleGroup: 'Chest', category: 'push' },

  // Pull Exercises (Back, Rear Delts, Biceps)
  { id: 'pull-1', name: 'Lat Pulldown', muscleGroup: 'Back', category: 'pull' },
  { id: 'pull-2', name: 'Dumbbell Row', muscleGroup: 'Back', category: 'pull' },
  { id: 'pull-3', name: 'Face Pulls', muscleGroup: 'Rear Delts', category: 'pull' },
  { id: 'pull-4', name: 'Dumbbell Shrugs (Smith Machine)', muscleGroup: 'Traps', category: 'pull' },
  { id: 'pull-5', name: 'Cable Bicep Curls', muscleGroup: 'Biceps', category: 'pull' },
  { id: 'pull-6', name: 'EZ Bar Curl (W bar)', muscleGroup: 'Biceps', category: 'pull' },
  { id: 'pull-7', name: 'Incline Dumbbell Curls (60° bench, supinated grip)', muscleGroup: 'Biceps', category: 'pull' },

  // Leg Exercises (Quads, Hamstrings, Glutes, Calves, Core)
  { id: 'legs-1', name: 'Leg Extension (warm-up + isolation)', muscleGroup: 'Quads', category: 'legs' },
  { id: 'legs-2', name: 'Squats', muscleGroup: 'Quads', category: 'legs' },
  { id: 'legs-3', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', category: 'legs' },
  { id: 'legs-4', name: 'Leg Curl Machine', muscleGroup: 'Hamstrings', category: 'legs' },
  { id: 'legs-5', name: 'Standing Calf Raises', muscleGroup: 'Calves', category: 'legs' },
  { id: 'legs-6', name: 'Plank / Hanging Leg Raises', muscleGroup: 'Core', category: 'legs' },
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
    // Push: 4, 4, 3, 3, 3, 3, 3 sets
    'push-1': 4, 'push-2': 4, 'push-3': 3, 'push-4': 3, 'push-5': 3, 'push-6': 3, 'push-7': 3,
    // Pull: 4, 4, 3, 3, 3, 3, 3 sets
    'pull-1': 4, 'pull-2': 4, 'pull-3': 3, 'pull-4': 3, 'pull-5': 3, 'pull-6': 3, 'pull-7': 3,
    // Legs: 3, 4, 4, 3, 3, 3 sets
    'legs-1': 3, 'legs-2': 4, 'legs-3': 4, 'legs-4': 3, 'legs-5': 3, 'legs-6': 3,
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

