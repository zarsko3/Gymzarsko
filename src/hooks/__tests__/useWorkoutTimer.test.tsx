import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { useWorkoutTimer } from '../useWorkoutTimer'

describe('useWorkoutTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2023-01-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('tracks elapsed seconds from the provided start time', () => {
    const startTime = new Date('2023-01-01T00:00:00Z')
    const { result, rerender } = renderHook(
      ({ start }) => useWorkoutTimer(start),
      { initialProps: { start: startTime } }
    )

    expect(result.current).toBe(0)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    expect(result.current).toBe(2)

    rerender({ start: null })
    expect(result.current).toBe(0)
  })
})

