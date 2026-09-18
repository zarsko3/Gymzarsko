import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Workout } from '../../types'
import { ToastProvider } from '../../contexts/ToastContext'

const facade = vi.hoisted(() => ({
  startWorkout: vi.fn(),
  getCurrentWorkout: vi.fn(),
  getWorkoutById: vi.fn(),
  updateWorkout: vi.fn(async () => {}),
  completeWorkout: vi.fn(async (w: unknown) => w),
}))

vi.mock('../../services/workoutServiceFacade', () => facade)
vi.mock('../../services/firestorePlanService', () => ({ saveCustomExercise: vi.fn() }))
vi.mock('../../services/firestoreProgressService', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../services/firestoreProgressService')>()
  return {
    ...actual,
    getLastSessionByExerciseName: vi.fn(async () =>
      new Map([
        [
          'flat dumbbell press',
          { sets: [{ weight: 30, reps: 10 }, { weight: 30, reps: 10 }, { weight: 30, reps: 10 }], date: new Date('2026-09-10') },
        ],
      ])
    ),
  }
})

import ActiveWorkoutPage from '../ActiveWorkoutPage'

function makeWorkout(): Workout {
  return {
    id: 'w1',
    type: 'upper',
    date: new Date(),
    startTime: new Date(),
    completed: false,
    exercises: [
      {
        id: 'ex1',
        exerciseId: 'upper-2',
        exercise: { id: 'upper-2', name: 'Flat Dumbbell Press', muscleGroup: 'Chest', category: 'upper', repRange: '8-10' },
        sets: [
          { id: 's1', weight: 0, reps: 0, completed: false },
          { id: 's2', weight: 0, reps: 0, completed: false },
        ],
      },
    ],
  }
}

function renderPage() {
  return render(
    <ToastProvider>
      <MemoryRouter initialEntries={['/workout/active?type=upper']}>
        <Routes>
          <Route path="/workout/active" element={<ActiveWorkoutPage />} />
          <Route path="/workout/summary" element={<p>summary page</p>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  )
}

const weightInputs = () => screen.getAllByRole('spinbutton').filter((el) => el.getAttribute('data-field') === 'weight')

describe('ActiveWorkoutPage suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    facade.getCurrentWorkout.mockResolvedValue(makeWorkout())
  })

  it('shows last session as grey suggestions without filling the fields', async () => {
    renderPage()
    await screen.findByText(/Last time · 30×10, 30×10, 30×10/)

    const [first] = weightInputs()
    expect(first).toHaveValue(null)
    expect(first).toHaveAttribute('placeholder', '30')
  })

  it('offers progression and applies it to the suggestions', async () => {
    renderPage()
    await screen.findByText('Try 32.5 kg — you hit 10 on every set')

    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))

    expect(screen.getByText('Aiming for 32.5 kg × 8 today')).toBeInTheDocument()
    expect(weightInputs()[0]).toHaveAttribute('placeholder', '32.5')
  })

  it('accepting an empty set records the suggestion', async () => {
    renderPage()
    await screen.findByText(/Last time/)

    const checkButtons = screen.getAllByRole('button').filter((b) => b.querySelector('.lucide-check'))
    fireEvent.click(checkButtons[0])

    await waitFor(() => expect(weightInputs()[0]).toHaveValue(30))
  })

  it('warns about typed sets that are not marked done before finishing', async () => {
    renderPage()
    await screen.findByText(/Last time/)

    fireEvent.change(weightInputs()[1], { target: { value: '32.5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Complete Workout' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText("1 set isn't marked done")).toBeInTheDocument()

    fireEvent.click(within(dialog).getByRole('button', { name: 'Mark done and finish' }))

    await waitFor(() => expect(facade.completeWorkout).toHaveBeenCalled())
    const completed = facade.completeWorkout.mock.calls[0][0] as Workout
    expect(completed.exercises[0].sets[1]).toMatchObject({ weight: 32.5, completed: true })
  })

  it('starts the rest timer outside the page so it stays pinned to the screen', async () => {
    const { container } = renderPage()
    await screen.findByText(/Last time/)

    const checkButtons = screen.getAllByRole('button').filter((b) => b.querySelector('.lucide-check'))
    fireEvent.click(checkButtons[0])

    const timer = await screen.findByRole('status')
    expect(within(timer).getByText('1:30')).toBeInTheDocument()
    // Pages sit inside a transformed wrapper, which would pin a fixed element to the
    // page instead of the viewport — the timer must render outside it
    expect(container.contains(timer)).toBe(false)
  })
})
