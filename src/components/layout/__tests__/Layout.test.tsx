import { useEffect } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import Layout from '../Layout'

const mounts = { active: 0 }

function HomeStub() {
  const navigate = useNavigate()
  return <button onClick={() => navigate('/workout/active?type=push')}>start</button>
}

function ActiveStub() {
  useEffect(() => {
    mounts.active++
  }, [])
  return <p>active page</p>
}

describe('Layout page transitions', () => {
  it('mounts the next page only once while the previous page animates out', async () => {
    vi.useFakeTimers()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomeStub />} />
            <Route path="workout/active" element={<ActiveStub />} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('start'))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    vi.useRealTimers()

    expect(screen.getAllByText('active page')).toHaveLength(1)
    expect(mounts.active).toBe(1)
  })
})
