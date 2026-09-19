import { describe, expect, it } from 'vitest'
import {
  BUILT_IN_EXERCISES,
  MUSCLE_GROUPS,
  getAlternatives,
  getExerciseCues,
  getHowToVideoUrl,
  formatExerciseName,
  searchExercises,
  type LibraryExercise,
} from '../exerciseLibrary'

describe('exercise library', () => {
  it('gives every built-in exercise three form cues', () => {
    const missing = BUILT_IN_EXERCISES.filter(
      (exercise) => exercise.name !== 'Plank / Hanging Leg Raises' && getExerciseCues(exercise.id, exercise.name)?.length !== 3
    )
    expect(missing.map((exercise) => exercise.name)).toEqual([])
  })

  it('never repeats a name and only uses known muscle groups', () => {
    const names = BUILT_IN_EXERCISES.map((exercise) => exercise.name.toLowerCase())
    expect(new Set(names).size).toBe(names.length)
    const groups = new Set<string>(MUSCLE_GROUPS)
    expect(BUILT_IN_EXERCISES.filter((exercise) => !groups.has(exercise.muscleGroup))).toEqual([])
  })

  it('offers alternatives for the same muscle, including custom ones, minus exclusions', () => {
    const custom: LibraryExercise[] = [{ id: 'c1', name: 'Landmine Row', muscleGroup: 'Back', source: 'custom' }]
    const names = getAlternatives('Back', custom, new Set(['lat pulldown'])).map((exercise) => exercise.name)
    expect(names).toContain('Seated Cable Row')
    expect(names).toContain('Landmine Row')
    expect(names).not.toContain('Lat Pulldown')
    expect(names).not.toContain('Bench Press')
  })

  it('searches by name or muscle, custom exercises first on ties of name', () => {
    expect(searchExercises('cable fly', []).map((e) => e.name)).toEqual(['Cable Fly (high to low)', 'Cable Fly (low to high)'])
    expect(searchExercises('glutes', []).every((e) => e.muscleGroup === 'Glutes')).toBe(true)
  })

  it('links to a YouTube form search without the parenthesised notes', () => {
    expect(getHowToVideoUrl('Leg Extension (warm-up + isolation)')).toBe(
      'https://www.youtube.com/results?search_query=Leg%20Extension%20proper%20form'
    )
  })
})

describe('formatExerciseName', () => {
  it('capitalises names typed in lowercase and keeps deliberate capitals', () => {
    expect(formatExerciseName('  landmine   row ')).toBe('Landmine Row')
    expect(formatExerciseName('cable fly (low-to-high)')).toBe('Cable Fly (Low-To-High)')
    expect(formatExerciseName('JM Press')).toBe('JM Press')
  })
})
