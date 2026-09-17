import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import WeeklySummary from '../WeeklySummary'
import MuscleGroupBars from '../MuscleGroupBars'
import RecentRecords from '../RecentRecords'

describe('home cards', () => {
  it('shows weekly progress and streak', () => {
    render(<WeeklySummary progress={{ completed: 3, goal: 5, streakWeeks: 1 }} />)
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('/ 5')).toBeInTheDocument()
    expect(screen.getByText('week')).toBeInTheDocument()
  })

  it('lists muscle groups with their set counts', () => {
    render(<MuscleGroupBars data={[{ muscleGroup: 'Back', sets: 16 }, { muscleGroup: 'Quads', sets: 7 }]} />)
    expect(screen.getByText('Back')).toBeInTheDocument()
    expect(screen.getByText('16')).toBeInTheDocument()
    expect(screen.getByText('Quads')).toBeInTheDocument()
  })

  it('hides the muscle card when there is no data', () => {
    const { container } = render(<MuscleGroupBars data={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows recent records and summarises the rest', () => {
    const records = ['Bench Press', 'Squat', 'Row', 'Curl'].map((exerciseName, i) => ({
      exerciseName,
      weight: 80 - i,
      reps: 6,
      date: new Date('2026-09-15'),
    }))
    render(<RecentRecords records={records} />)
    expect(screen.getByText('Bench Press')).toBeInTheDocument()
    expect(screen.queryByText('Curl')).not.toBeInTheDocument()
    expect(screen.getByText('and 1 more in the last two weeks')).toBeInTheDocument()
  })

  it('hides the records card when there are none', () => {
    const { container } = render(<RecentRecords records={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
