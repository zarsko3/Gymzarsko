import { useState } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import SetNumberInput from '../SetNumberInput'

function Harness({ initial = 0 }: { initial?: number }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <SetNumberInput aria-label="weight" value={value} onValueChange={(v) => setValue(parseFloat(v) || 0)} />
      <button onClick={() => setValue(0)}>clear</button>
      <output>{value}</output>
    </>
  )
}

describe('SetNumberInput', () => {
  it('keeps intermediate text so decimals starting with 0 can be typed', () => {
    render(<Harness />)
    const input = screen.getByLabelText('weight') as HTMLInputElement

    fireEvent.change(input, { target: { value: '0' } })
    expect(input.value).toBe('0')

    fireEvent.change(input, { target: { value: '0.5' } })
    expect(input.value).toBe('0.5')
    expect(screen.getByRole('status').textContent).toBe('0.5')
  })

  it('reflects external value changes', () => {
    render(<Harness initial={40} />)
    const input = screen.getByLabelText('weight') as HTMLInputElement
    expect(input.value).toBe('40')

    fireEvent.click(screen.getByText('clear'))
    expect(input.value).toBe('')
  })
})
