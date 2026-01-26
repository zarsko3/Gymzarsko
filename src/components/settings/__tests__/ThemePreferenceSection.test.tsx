import { render, fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import ThemePreferenceSection from '../ThemePreferenceSection'

describe('ThemePreferenceSection', () => {
  it('invokes callback when selecting a theme', () => {
    const handleChange = vi.fn()
    render(<ThemePreferenceSection theme="light" onThemeChange={handleChange} />)

    const darkButton = screen.getByRole('button', { name: /dark/i })
    fireEvent.click(darkButton)

    expect(handleChange).toHaveBeenCalledWith('dark')
  })
})

