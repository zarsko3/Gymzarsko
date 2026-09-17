import { render, screen, fireEvent, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import RestTimer from '../RestTimer'

describe('RestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('navigator', { ...navigator, vibrate: vi.fn() })
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('shows nothing until a rest starts', () => {
    const { container } = render(
      <RestTimer startedAt={null} durationSeconds={90} onExtend={vi.fn()} onDismiss={vi.fn()} />
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('counts down from the start timestamp', () => {
    render(<RestTimer startedAt={Date.now()} durationSeconds={90} onExtend={vi.fn()} onDismiss={vi.fn()} />)
    expect(screen.getByText('1:30')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(35_000)
    })
    expect(screen.getByText('0:55')).toBeInTheDocument()
  })

  it('announces the end, vibrates and clears itself', () => {
    const onDismiss = vi.fn()
    render(<RestTimer startedAt={Date.now()} durationSeconds={60} onExtend={vi.fn()} onDismiss={onDismiss} />)

    act(() => {
      vi.advanceTimersByTime(60_000)
    })
    expect(screen.getByText('Rest done')).toBeInTheDocument()
    expect(navigator.vibrate).toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(onDismiss).toHaveBeenCalled()
  })

  it('adds 30 seconds and skips', () => {
    const onExtend = vi.fn()
    const onDismiss = vi.fn()
    render(<RestTimer startedAt={Date.now()} durationSeconds={90} onExtend={onExtend} onDismiss={onDismiss} />)

    fireEvent.click(screen.getByText('+30s'))
    expect(onExtend).toHaveBeenCalledWith(30)

    fireEvent.click(screen.getByLabelText('Skip rest'))
    expect(onDismiss).toHaveBeenCalled()
  })
})
