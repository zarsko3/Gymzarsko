import type { Exercise, Workout, WorkoutType, UserProfile } from '../types'

// Mock Exercise Database - Updated to match PPL Workout Routine
export const mockExercises: Exercise[] = [
  // Push Exercises (Chest, Front Delts, Triceps)
  { id: 'push-1', name: 'Bench Press', muscleGroup: 'Chest', category: 'push', repRange: '6-8' },
  { id: 'push-2', name: 'Overhead Shoulder Press (machine, seated)', muscleGroup: 'Front Delts', category: 'push', repRange: '8-10' },
  { id: 'push-3', name: 'Incline Dumbbell Press', muscleGroup: 'Chest', category: 'push', repRange: '8-10' },
  { id: 'push-4', name: 'Lateral Raises', muscleGroup: 'Front Delts', category: 'push', repRange: '12-15' },
  { id: 'push-5', name: 'Triceps Pushdowns', muscleGroup: 'Triceps', category: 'push', repRange: '10-12' },
  { id: 'push-6', name: 'Skull Crushers', muscleGroup: 'Triceps', category: 'push', repRange: '8-12' },
  { id: 'push-7', name: 'Chest Press (machine)', muscleGroup: 'Chest', category: 'push', repRange: '10-12' },

  // Pull Exercises (Back, Rear Delts, Biceps)
  { id: 'pull-1', name: 'Lat Pulldown', muscleGroup: 'Back', category: 'pull', repRange: '8-10' },
  { id: 'pull-2', name: 'Dumbbell Row', muscleGroup: 'Back', category: 'pull', repRange: '8-10' },
  { id: 'pull-3', name: 'Face Pulls', muscleGroup: 'Rear Delts', category: 'pull', repRange: '12-15' },
  { id: 'pull-4', name: 'Dumbbell Shrugs (Smith Machine)', muscleGroup: 'Traps', category: 'pull', repRange: '10-12' },
  { id: 'pull-5', name: 'Cable Bicep Curls', muscleGroup: 'Biceps', category: 'pull', repRange: '10-12' },
  { id: 'pull-6', name: 'EZ Bar Curl (W bar)', muscleGroup: 'Biceps', category: 'pull', repRange: '8-10' },
  { id: 'pull-7', name: 'Incline Dumbbell Curls (60° bench, supinated grip)', muscleGroup: 'Biceps', category: 'pull', repRange: '10-12' },

  // Leg Exercises (Quads, Hamstrings, Glutes, Calves, Core)
  { id: 'legs-1', name: 'Leg Extension (warm-up + isolation)', muscleGroup: 'Quads', category: 'legs', repRange: '12-15' },
  { id: 'legs-2', name: 'Squats', muscleGroup: 'Quads', category: 'legs', repRange: '6-8' },
  { id: 'legs-3', name: 'Romanian Deadlift', muscleGroup: 'Hamstrings', category: 'legs', repRange: '8-10' },
  { id: 'legs-4', name: 'Leg Curl Machine', muscleGroup: 'Hamstrings', category: 'legs', repRange: '10-12' },
  { id: 'legs-5', name: 'Standing Calf Raises', muscleGroup: 'Calves', category: 'legs', repRange: '12-15' },
  { id: 'legs-6', name: 'Plank / Hanging Leg Raises', muscleGroup: 'Core', category: 'legs' },

  // Upper Exercises — balanced push/pull, different movements and angles than PPL days
  { id: 'upper-1', name: 'Weighted Pull-Ups', muscleGroup: 'Back', category: 'upper', repRange: '6-8' },
  { id: 'upper-2', name: 'Flat Dumbbell Press', muscleGroup: 'Chest', category: 'upper', repRange: '8-10' },
  { id: 'upper-3', name: 'Chest-Supported T-Bar Row', muscleGroup: 'Back', category: 'upper', repRange: '8-10' },
  { id: 'upper-4', name: 'Seated Dumbbell Arnold Press', muscleGroup: 'Front Delts', category: 'upper', repRange: '8-12' },
  { id: 'upper-5', name: 'Single-Arm Cable Lateral Raise', muscleGroup: 'Side Delts', category: 'upper', repRange: '12-15' },
  { id: 'upper-6', name: 'Hammer Curls', muscleGroup: 'Biceps', category: 'upper', repRange: '10-12' },
  { id: 'upper-7', name: 'Overhead Cable Triceps Extension', muscleGroup: 'Triceps', category: 'upper', repRange: '10-12' },

  // Lower Exercises — hinge and single-leg focus to complement the squat-based Legs day
  { id: 'lower-1', name: 'Deadlift (conventional or trap bar)', muscleGroup: 'Hamstrings', category: 'lower', repRange: '4-6' },
  { id: 'lower-2', name: 'Bulgarian Split Squat', muscleGroup: 'Quads', category: 'lower', repRange: '8-10 / leg' },
  { id: 'lower-3', name: 'Leg Press', muscleGroup: 'Quads', category: 'lower', repRange: '10-12' },
  { id: 'lower-4', name: 'Barbell Hip Thrust', muscleGroup: 'Glutes', category: 'lower', repRange: '8-10' },
  { id: 'lower-5', name: 'Nordic Hamstring Curl (assisted)', muscleGroup: 'Hamstrings', category: 'lower', repRange: '6-8' },
  { id: 'lower-6', name: 'Seated Calf Raises', muscleGroup: 'Calves', category: 'lower', repRange: '12-15' },
  { id: 'lower-7', name: 'Cable Crunch', muscleGroup: 'Core', category: 'lower', repRange: '12-15' },
]

// Working sets per exercise; anything not listed defaults to 3
const DEFAULT_SETS: Record<string, number> = {
  'push-1': 4, 'push-2': 4,
  'pull-1': 4, 'pull-2': 4,
  'legs-2': 4, 'legs-3': 4,
  'upper-1': 4, 'upper-2': 4,
  'lower-1': 3, 'lower-2': 3, 'lower-6': 4,
}

export function getDefaultSets(exerciseId: string): number {
  return DEFAULT_SETS[exerciseId] ?? 3
}

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
  
  return {
    id: `workout-${Date.now()}`,
    type,
    date: new Date(),
    exercises: exercises.map(exercise => ({
      id: `we-${exercise.id}-${Date.now()}`,
      exerciseId: exercise.id,
      exercise,
      sets: Array(getDefaultSets(exercise.id)).fill(null).map((_, i) => ({
        id: `set-${i}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        weight: 0,
        reps: 0,
        completed: false,
      })),
    })),
    completed: false,
  }
}

