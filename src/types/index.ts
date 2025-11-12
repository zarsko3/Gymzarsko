// Workout Types
export type WorkoutType = 'push' | 'pull' | 'legs'

export interface Plan {
  id?: string
  name: string
  type: WorkoutType | 'custom'
  exercises: Array<{
    name: string
    defaultSets?: number
    defaultReps?: number
    muscleGroup?: string
  }>
  userId?: string
  createdAt?: Date | any // Timestamp from Firestore
  updatedAt?: Date | any // Timestamp from Firestore
}

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
  date: Date | string | any // Accept Date, string, or Timestamp - normalize on read/write
  startTime?: Date | string | any
  endTime?: Date | string | any
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

// Body Metrics Tracking
export interface BodyMetricEntry {
  id: string
  userId: string
  date: Date // Normalized to start of day
  weight: number // in kg
  createdAt: Date
  updatedAt: Date
}

export interface BodyMetricGoal {
  userId: string
  targetWeight: number // in kg
  targetDate?: Date // optional deadline
  createdAt: Date
  updatedAt: Date
}

// Analytics Types
export interface FilterOptions {
  dateRange: { start: Date; end: Date }
  workoutType: 'all' | WorkoutType
}

export type CompareMode = 'last-vs-average' | 'week-over-week' | 'none'

export interface ComparisonResult {
  current: number
  previous: number
  change: number
  changePercent: number
}

export interface WorkoutMetrics {
  workoutId: string
  date: Date
  type: WorkoutType
  totalVolume: number
  topSetWeight: number
  volumePerMinute: number
  totalSets: number
  intensity: number
  duration: number
}


