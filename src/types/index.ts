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
  id: string
  name: string
  email?: string
  createdAt: Date
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

// Workout Templates
export interface TemplateExercise {
  exerciseId: string
  exercise: Exercise
  sets: number // Number of sets
  targetWeight?: number // Optional target weight
  targetReps?: number // Optional target reps
  notes?: string
}

export interface WorkoutTemplate {
  id: string
  name: string
  type: WorkoutType
  description?: string
  exercises: TemplateExercise[]
  createdAt: Date
  lastUsed?: Date
  useCount: number
  isCustom: boolean // true if user-created, false if default template
}

