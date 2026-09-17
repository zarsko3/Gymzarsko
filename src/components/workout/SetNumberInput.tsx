import { useEffect, useState, type InputHTMLAttributes } from 'react'

interface SetNumberInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'> {
  value: number
  onValueChange: (value: string) => void
}

const toDisplay = (value: number) => (value ? String(value) : '')

/**
 * Number input that keeps the raw text while typing, so intermediate
 * values like "0" or "2." are not wiped out before "0.5" / "2.5" is complete.
 */
function SetNumberInput({ value, onValueChange, ...props }: SetNumberInputProps) {
  const [draft, setDraft] = useState(() => toDisplay(value))

  // Sync external changes (prefill, clear, edit modal) without clobbering typing
  useEffect(() => {
    setDraft((current) => ((parseFloat(current) || 0) === value ? current : toDisplay(value)))
  }, [value])

  return (
    <input
      {...props}
      type="number"
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value)
        onValueChange(e.target.value)
      }}
    />
  )
}

export default SetNumberInput
