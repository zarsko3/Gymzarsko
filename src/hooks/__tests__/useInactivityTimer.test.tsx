import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest'
import { useInactivityTimer } from '../useInactivityTimer'

const HOUR = 60 * 60 * 1000

describe('useInactivityTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires once after an hour without activity', () => {
    const onTimeout = vi.fn()
    renderHook(() => useInactivityTimer(onTimeout))

    act(() => {
      vi.advanceTimersByTime(HOUR)
    })

    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('resets the countdown on user activity', () => {
    const onTimeout = vi.fn()
    renderHook(() => useInactivityTimer(onTimeout))

    act(() => {
      vi.advanceTimersByTime(HOUR - 1000)
      document.dispatchEvent(new Event('pointerdown'))
      vi.advanceTimersByTime(HOUR - 1000)
    })

    expect(onTimeout).not.toHaveBeenCalled()
  })

  it('fires on return to the app when the idle time already passed', () => {
    const onTimeout = vi.fn()
    renderHook(() => useInactivityTimer(onTimeout))

    // Simulate a suspended background tab: wall clock moves, timers do not run
    act(() => {
      vi.setSystemTime(Date.now() + HOUR + 1000)
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(onTimeout).toHaveBeenCalledTimes(1)
  })

  it('does nothing while disabled', () => {
    const onTimeout = vi.fn()
    renderHook(() => useInactivityTimer(onTimeout, false))

    act(() => {
      vi.advanceTimersByTime(HOUR * 2)
    })

    expect(onTimeout).not.toHaveBeenCalled()
  })
})
