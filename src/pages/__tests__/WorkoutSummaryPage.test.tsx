import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Workout, WorkoutType } from '../../types'
import { ToastProvider } from '../../contexts/ToastContext'

type Sets = Array<[number, number]>

function workout(id: string, day: number, type: WorkoutType, exercises: Record<string, Sets>, minutes: number): Workout {
  const start = new Date(2026, 8, day, 10, 0)
  return {
    id,
    type,
    date: start,
    startTime: start,
    endTime: new Date(start.getTime() + minutes * 60000),
    completed: true,
    exercises: Object.entries(exercises).map(([name, sets], i) => ({
      id: `${id}-${i}`,
      exerciseId: name,
      exercise: { id: name, name, muscleGroup: 'Back', category: type },
      sets: sets.map(([weight, reps], j) => ({ id: `${j}`, weight, reps, completed: true })),
    })),
  }
}

const previousPull = workout('p1', 11, 'pull', { 'Lat Pulldown': [[65, 9]], 'EZ Bar Curl': [[30, 8]] }, 62)
const legs = workout('l1', 14, 'legs', { Squats: [[100, 5], [100, 5], [100, 5]] }, 70)
const today = workout('p2', 18, 'pull', { 'Lat Pulldown': [[70, 9]], 'EZ Bar Curl': [[30, 10]], 'Face Pulls': [[20, 13]] }, 58)

vi.mock('../../services/workoutServiceFacade', () => ({
  getWorkouts: vi.fn(async () => [today, legs, previousPull]),
  getWorkoutById: vi.fn(async () => today),
  updateWorkout: vi.fn(),
}))

import WorkoutSummaryPage from '../WorkoutSummaryPage'

describe('WorkoutSummaryPage', () => {
  it('celebrates records and compares with the last workout of the same type', async () => {
    render(
      <ToastProvider>
        <MemoryRouter initialEntries={['/workout/summary?id=p2']}>
          <Routes>
            <Route path="/workout/summary" element={<WorkoutSummaryPage />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    )

    expect(await screen.findByText('2 new records')).toBeInTheDocument()
    expect(screen.getByText('+5 kg')).toBeInTheDocument()
    expect(screen.getByText('+2 reps')).toBeInTheDocument()

    // vs previous pull (not the more recent legs day): 58m vs 62m, 3 vs 2 sets
    expect(screen.getByText('−4m')).toBeInTheDocument()
    expect(screen.getByText('+1')).toBeInTheDocument()
    expect(screen.getByText('Compared to your last pull day')).toBeInTheDocument()

    expect(screen.getAllByLabelText('Better than last time')).toHaveLength(2)
    expect(screen.getByText('1 set · best 20×13')).toBeInTheDocument()
    expect(screen.queryByText(/one step closer/i)).not.toBeInTheDocument()
  })
})
