import type { WorkoutTemplate, TemplateExercise, WorkoutType, Workout } from '../types'
import { mockExercises } from './mockData'

const TEMPLATES_KEY = 'gymzarski_templates'

// Default templates - Updated to match PPL Workout Routine
const defaultTemplates: WorkoutTemplate[] = [
  {
    id: 'default-push-1',
    name: 'PPL Push Day',
    type: 'push',
    description: 'Chest, shoulders, and triceps - 6 exercises',
    exercises: [
      {
        exerciseId: 'push-1',
        exercise: mockExercises.find(e => e.id === 'push-1')!,
        sets: 4,
        targetReps: 10,
        notes: '8-12 reps'
      },
      {
        exerciseId: 'push-2',
        exercise: mockExercises.find(e => e.id === 'push-2')!,
        sets: 4,
        targetReps: 10,
        notes: '8-12 reps'
      },
      {
        exerciseId: 'push-3',
        exercise: mockExercises.find(e => e.id === 'push-3')!,
        sets: 3,
        targetReps: 11,
        notes: '10-12 reps'
      },
      {
        exerciseId: 'push-4',
        exercise: mockExercises.find(e => e.id === 'push-4')!,
        sets: 3,
        targetReps: 13,
        notes: '12-15 reps'
      },
      {
        exerciseId: 'push-5',
        exercise: mockExercises.find(e => e.id === 'push-5')!,
        sets: 3,
        targetReps: 11,
        notes: '10-12 reps'
      },
      {
        exerciseId: 'push-6',
        exercise: mockExercises.find(e => e.id === 'push-6')!,
        sets: 3,
        targetReps: 11,
        notes: '10-12 reps'
      },
    ],
    createdAt: new Date('2024-01-01'),
    useCount: 0,
    isCustom: false,
  },
  {
    id: 'default-pull-1',
    name: 'PPL Pull Day',
    type: 'pull',
    description: 'Back, traps, and biceps - 6 exercises',
    exercises: [
      {
        exerciseId: 'pull-1',
        exercise: mockExercises.find(e => e.id === 'pull-1')!,
        sets: 4,
        targetReps: 10,
        notes: '8-12 reps'
      },
      {
        exerciseId: 'pull-2',
        exercise: mockExercises.find(e => e.id === 'pull-2')!,
        sets: 4,
        targetReps: 10,
        notes: '8-12 reps'
      },
      {
        exerciseId: 'pull-3',
        exercise: mockExercises.find(e => e.id === 'pull-3')!,
        sets: 3,
        targetReps: 13,
        notes: '12-15 reps'
      },
      {
        exerciseId: 'pull-4',
        exercise: mockExercises.find(e => e.id === 'pull-4')!,
        sets: 3,
        targetReps: 13,
        notes: '12-15 reps'
      },
      {
        exerciseId: 'pull-5',
        exercise: mockExercises.find(e => e.id === 'pull-5')!,
        sets: 3,
        targetReps: 11,
        notes: '10-12 reps'
      },
      {
        exerciseId: 'pull-6',
        exercise: mockExercises.find(e => e.id === 'pull-6')!,
        sets: 3,
        targetReps: 11,
        notes: '10-12 reps'
      },
    ],
    createdAt: new Date('2024-01-01'),
    useCount: 0,
    isCustom: false,
  },
  {
    id: 'default-legs-1',
    name: 'PPL Legs Day',
    type: 'legs',
    description: 'Quads, hamstrings, calves, and core - 6 exercises',
    exercises: [
      {
        exerciseId: 'legs-1',
        exercise: mockExercises.find(e => e.id === 'legs-1')!,
        sets: 4,
        targetReps: 10,
        notes: '8-12 reps'
      },
      {
        exerciseId: 'legs-2',
        exercise: mockExercises.find(e => e.id === 'legs-2')!,
        sets: 4,
        targetReps: 11,
        notes: '10-12 reps'
      },
      {
        exerciseId: 'legs-3',
        exercise: mockExercises.find(e => e.id === 'legs-3')!,
        sets: 3,
        targetReps: 11,
        notes: '10-12 reps each leg'
      },
      {
        exerciseId: 'legs-4',
        exercise: mockExercises.find(e => e.id === 'legs-4')!,
        sets: 3,
        targetReps: 13,
        notes: '12-15 reps'
      },
      {
        exerciseId: 'legs-5',
        exercise: mockExercises.find(e => e.id === 'legs-5')!,
        sets: 3,
        targetReps: 17,
        notes: '15-20 reps'
      },
      {
        exerciseId: 'legs-6',
        exercise: mockExercises.find(e => e.id === 'legs-6')!,
        sets: 3,
        targetReps: 15,
        notes: '30-60 sec hold or 15 reps'
      },
    ],
    createdAt: new Date('2024-01-01'),
    useCount: 0,
    isCustom: false,
  },
]

// Get all templates
export function getTemplates(): WorkoutTemplate[] {
  const customTemplatesJson = localStorage.getItem(TEMPLATES_KEY)
  const customTemplates = customTemplatesJson ? JSON.parse(customTemplatesJson).map((t: WorkoutTemplate) => ({
    ...t,
    createdAt: new Date(t.createdAt),
    lastUsed: t.lastUsed ? new Date(t.lastUsed) : undefined,
  })) : []

  return [...defaultTemplates, ...customTemplates]
}

// Get templates by type
export function getTemplatesByType(type: WorkoutType): WorkoutTemplate[] {
  return getTemplates().filter(t => t.type === type)
}

// Get template by ID
export function getTemplateById(id: string): WorkoutTemplate | null {
  return getTemplates().find(t => t.id === id) || null
}

// Save custom template
export function saveTemplate(template: Omit<WorkoutTemplate, 'id' | 'createdAt' | 'useCount' | 'isCustom'>): WorkoutTemplate {
  const newTemplate: WorkoutTemplate = {
    ...template,
    id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
    useCount: 0,
    isCustom: true,
  }

  const customTemplates = getTemplates().filter(t => t.isCustom)
  customTemplates.push(newTemplate)
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(customTemplates))

  return newTemplate
}

// Update template
export function updateTemplate(id: string, updates: Partial<WorkoutTemplate>): void {
  const templates = getTemplates().filter(t => t.isCustom)
  const index = templates.findIndex(t => t.id === id)
  
  if (index !== -1) {
    templates[index] = { ...templates[index], ...updates }
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
  }
}

// Delete custom template
export function deleteTemplate(id: string): void {
  const templates = getTemplates().filter(t => t.isCustom && t.id !== id)
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates))
}

// Increment template use count
export function incrementTemplateUseCount(id: string): void {
  const template = getTemplateById(id)
  if (!template) return

  if (template.isCustom) {
    updateTemplate(id, {
      useCount: template.useCount + 1,
      lastUsed: new Date(),
    })
  }
}

// Create workout from template
export function createWorkoutFromTemplate(template: WorkoutTemplate): Omit<Workout, 'id'> {
  incrementTemplateUseCount(template.id)

  return {
    type: template.type,
    date: new Date(),
    startTime: new Date(),
    exercises: template.exercises.map(te => ({
      id: `ex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      exerciseId: te.exerciseId,
      exercise: te.exercise,
      sets: Array.from({ length: te.sets }, (_, i) => ({
        id: `set-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`,
        weight: te.targetWeight || 0,
        reps: te.targetReps || 0,
        completed: false,
      })),
      notes: te.notes,
    })),
    completed: false,
  }
}

// Save workout as template
export function saveWorkoutAsTemplate(
  workout: Workout,
  name: string,
  description?: string
): WorkoutTemplate {
  return saveTemplate({
    name,
    type: workout.type,
    description,
    exercises: workout.exercises.map(we => ({
      exerciseId: we.exerciseId,
      exercise: we.exercise,
      sets: we.sets.length,
      targetWeight: we.sets[0]?.weight,
      targetReps: we.sets[0]?.reps,
      notes: we.notes,
    })),
  })
}

