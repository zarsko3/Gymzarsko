import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Workout } from '../../types'
import { ToastProvider } from '../../contexts/ToastContext'

const day = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000)

function bench(id: string, daysAgo: number, weight: number): Workout {
  return {
    id,
    type: 'push',
    date: day(daysAgo),
    startTime: day(daysAgo),
    completed: true,
    exercises: [
      {
        id: `${id}-e`,
        exerciseId: 'push-1',
        exercise: { id: 'push-1', name: 'Bench Press', muscleGroup: 'Chest', category: 'push', repRange: '6-8' },
        sets: [{ id: `${id}-s`, weight, reps: 6, completed: true }],
      },
    ],
  }
}

const history = [bench('c', 2, 85), bench('b', 9, 82.5), bench('a', 16, 80)]

vi.mock('../../hooks/useWorkoutsSubscription', () => ({
  useWorkoutsSubscription: () => ({ workouts: history, isLoading: false, error: null }),
}))
vi.mock('../../services/workoutServiceFacade', () => ({ getWorkouts: vi.fn(async () => history) }))

import ProgressPage from '../AnalyticsPage'
import ExerciseDetailPage from '../ExerciseDetailPage'

function renderAt(path: string) {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/analytics" element={<ProgressPage />} />
          <Route path="/progress/exercise/:exerciseId" element={<ExerciseDetailPage />} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  )
}

describe('Progress screen', () => {
  it('lists strength trends and opens an exercise', async () => {
    renderAt('/analytics')
    expect(screen.getByRole('heading', { name: 'Progress' })).toBeInTheDocument()
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    // 85 × 6 ≈ 102 kg estimated 1RM
    expect(screen.getByText('102 kg')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Bench Press'))
    expect(await screen.findByRole('heading', { name: 'Bench Press' })).toBeInTheDocument()
  })
})

describe('Exercise screen', () => {
  it('shows the estimate, best set and every session', async () => {
    renderAt('/progress/exercise/Bench%20Press')
    expect(await screen.findByText('85 × 6')).toBeInTheDocument()
    expect(screen.getByText('Sessions')).toBeInTheDocument()
    expect(screen.getAllByText(/kg 1RM$/)).toHaveLength(3)
    expect(screen.getByText(/since/)).toHaveTextContent('+')
  })
})
