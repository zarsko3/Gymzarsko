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
  getRecentWorkouts: vi.fn(),
  completeWorkout: vi.fn(async (w: unknown) => w),
}))

vi.mock('../../services/workoutServiceFacade', () => facade)
const plans = vi.hoisted(() => ({
  saveCustomExercise: vi.fn(),
  getLibraryExercises: vi.fn(async () => []),
}))
const program = vi.hoisted(() => ({ setProgramSwap: vi.fn(async () => {}) }))

vi.mock('../../services/firestorePlanService', () => plans)
vi.mock('../../services/programService', () => program)
import ActiveWorkoutPage from '../ActiveWorkoutPage'

const previousUpper: Workout = {
  id: 'past',
  type: 'upper',
  date: new Date('2026-09-10'),
  completed: true,
  exercises: [
    {
      id: 'p1',
      exerciseId: 'upper-2',
      exercise: { id: 'upper-2', name: 'Flat Dumbbell Press', muscleGroup: 'Chest', category: 'upper', repRange: '8-10' },
      sets: [0, 1, 2].map((i) => ({ id: `p${i}`, weight: 30, reps: 10, completed: true })),
    },
  ],
}

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
    facade.startWorkout.mockResolvedValue(makeWorkout())
    facade.getRecentWorkouts.mockResolvedValue([previousUpper])
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

  it('shows a done counter and one menu for exercise actions', async () => {
    renderPage()
    await screen.findByText(/Last time/)
    expect(screen.getByText('0/2')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Mark set 1 done' }))
    await waitFor(() => expect(screen.getByText('1/2')).toBeInTheDocument())

    fireEvent.click(screen.getByRole('button', { name: 'Exercise options' }))
    const menu = screen.getByRole('menu')
    expect(within(menu).getByRole('menuitem', { name: /Edit sets and targets/ })).toBeInTheDocument()

    fireEvent.click(within(menu).getByRole('menuitem', { name: /Rename/ }))
    expect(screen.getByPlaceholderText('Exercise name')).toHaveValue('Flat Dumbbell Press')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('shows the workout without waiting for history, and asks history in parallel', async () => {
    let releaseHistory: (workouts: Workout[]) => void = () => {}
    facade.getRecentWorkouts.mockReturnValue(new Promise<Workout[]>((resolve) => { releaseHistory = resolve }))

    renderPage()

    // Workout is on screen while history is still downloading
    expect(await screen.findByText('Flat Dumbbell Press')).toBeInTheDocument()
    expect(screen.queryByText(/Last time/)).not.toBeInTheDocument()
    expect(facade.getRecentWorkouts).toHaveBeenCalledWith(30)
    expect(facade.getCurrentWorkout).not.toHaveBeenCalled()

    releaseHistory([previousUpper])
    expect(await screen.findByText(/Last time · 30×10, 30×10, 30×10/)).toBeInTheDocument()
  })

  it('swaps an exercise for an alternative and can keep it for every workout', async () => {
    renderPage()
    await screen.findByText(/Last time/)

    fireEvent.click(screen.getByRole('button', { name: 'Exercise options' }))
    fireEvent.click(screen.getByRole('menuitem', { name: /Swap exercise/ }))

    const sheet = await screen.findByRole('dialog', { name: 'Swap Flat Dumbbell Press' })
    fireEvent.click(within(sheet).getByRole('radio', { name: 'Every upper day' }))
    fireEvent.click(within(sheet).getByRole('button', { name: /Cable Fly \(low to high\)/ }))

    expect(await screen.findByText('Cable Fly (low to high)')).toBeInTheDocument()
    await waitFor(() =>
      expect(program.setProgramSwap).toHaveBeenCalledWith(
        'upper',
        'upper-2',
        expect.objectContaining({ id: 'alt-chest-6', name: 'Cable Fly (low to high)' })
      )
    )
    // Other tests leave debounced saves behind, so look for this test's save specifically
    const saved = facade.updateWorkout.mock.calls
      .map((call) => (call as unknown[])[0] as Workout)
      .find((w) => w.exercises[0]?.exerciseId === 'alt-chest-6')
    expect(saved?.exercises[0]).toMatchObject({ exerciseId: 'alt-chest-6', slotId: 'upper-2' })
    expect(saved?.exercises[0].sets).toHaveLength(2)
  })

  it('creates a missing exercise in the library and adds it to the workout', async () => {
    plans.saveCustomExercise.mockResolvedValue({
      id: 'lib-1', name: 'Landmine Row', muscleGroup: 'Back', category: 'upper', defaultSets: 3, defaultReps: 10, inTemplate: false,
    })
    renderPage()
    await screen.findByText(/Last time/)

    fireEvent.click(screen.getByRole('button', { name: 'Add Exercise' }))
    const sheet = await screen.findByRole('dialog', { name: 'Add exercise' })
    fireEvent.change(within(sheet).getByPlaceholderText('Search by name or muscle'), { target: { value: 'landmine row' } })
    fireEvent.click(within(sheet).getByRole('button', { name: /Create "Landmine Row"/ }))
    fireEvent.click(within(sheet).getByRole('button', { name: 'Back' }))
    fireEvent.click(within(sheet).getByRole('button', { name: 'Add to workout' }))

    await waitFor(() =>
      expect(plans.saveCustomExercise).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Landmine Row', muscleGroup: 'Back', category: 'upper' }),
        { inTemplate: false }
      )
    )
    expect(await screen.findByRole('heading', { name: 'Landmine Row' })).toBeInTheDocument()
  })

  it('shows form cues and a video link', async () => {
    renderPage()
    await screen.findByText(/Last time/)

    fireEvent.click(screen.getByRole('button', { name: 'How to do Flat Dumbbell Press' }))
    const sheet = await screen.findByRole('dialog', { name: 'How to do this exercise' })
    expect(within(sheet).getByText('Lower until you feel a stretch')).toBeInTheDocument()
    expect(within(sheet).getByRole('link', { name: /Watch a video/ })).toHaveAttribute(
      'href',
      expect.stringContaining('youtube.com/results?search_query=Flat%20Dumbbell%20Press')
    )
  })

  it('flags a stalled exercise and offers a lighter reset', async () => {
    const session = (id: string, day: number, weight: number, reps: number): Workout => ({
      ...previousUpper,
      id,
      date: new Date(2026, 8, day),
      exercises: [{ ...previousUpper.exercises[0], sets: [{ id: `${id}-s`, weight, reps, completed: true }] }],
    })
    // Newest first, like the service returns them: best was 30×10 and nothing beat it since
    facade.getRecentWorkouts.mockResolvedValue([
      session('s4', 16, 30, 9),
      session('s3', 12, 30, 10),
      session('s2', 8, 27.5, 10),
      session('s1', 4, 30, 10),
    ])

    renderPage()
    expect(await screen.findByText('No progress in 3 sessions')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Reset to 27.5 kg' }))
    expect(screen.getByText('Resetting to 27.5 kg × 10. Build back up from here.')).toBeInTheDocument()
    expect(weightInputs()[0]).toHaveAttribute('placeholder', '27.5')
  })
})
