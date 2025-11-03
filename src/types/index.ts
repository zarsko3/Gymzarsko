// Workout Types
export type WorkoutType = 'push' | 'pull' | 'legs'

export interface Exercise {
  id: string
  name: string
  muscleGroup: string
  category: string
}

export interface WorkoutSet {
  id: string
  weight: number
  reps: number
  completed: boolean
}

export interface WorkoutExercise {
  id: string
  exerciseId: string
  exercise: Exercise
  sets: WorkoutSet[]
  notes?: string
}

export interface Workout {
  id: string
  userId?: string // Firebase user ID for security rules
  type: WorkoutType
  date: Date
  startTime?: Date
  endTime?: Date
  exercises: WorkoutExercise[]
  notes?: string
  completed: boolean
}

// User Profile
export interface UserProfile {
  id: string // Firebase Auth UID
  displayName: string
  email: string
  photoURL?: string
  theme: 'light' | 'dark'
  notifications: {
    workoutReminders: boolean
    progressUpdates: boolean
    emailNotifications: boolean
  }
  language: 'en' | 'es' | 'he'
  createdAt: Date
  updatedAt: Date
}

// Progress Tracking
export interface ProgressEntry {
  id: string
  exerciseId: string
  date: Date
  weight: number
  reps: number
  volume: number // weight * reps
}


