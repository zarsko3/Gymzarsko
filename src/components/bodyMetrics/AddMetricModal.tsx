import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar } from 'lucide-react'
import { addBodyMetric } from '../../services/firestoreBodyMetricsService'
import { useToast } from '../../hooks/useToast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

interface AddMetricModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function AddMetricModal({ isOpen, onClose, onSave }: AddMetricModalProps) {
  const { showToast } = useToast()
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [weight, setWeight] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  // Get max date (today)
  const maxDate = format(new Date(), 'yyyy-MM-dd')
  
  // Get min date (1 year ago)
  const minDate = format(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
      setWeight('')
      setError('')
    }
  }, [isOpen])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    setError('')
  }

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty, numbers, and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setWeight(value)
      setError('')
    }
  }

  const validate = (): boolean => {
    if (!selectedDate) {
      setError('Please select a date')
      return false
    }

    const weightNum = parseFloat(weight)
    if (!weight || isNaN(weightNum)) {
      setError('Please enter a valid weight')
      return false
    }

    if (weightNum <= 0) {
      setError('Weight must be greater than 0')
      return false
    }

    if (weightNum > 300) {
      setError('Weight must be less than 300 kg')
      return false
    }

    const selectedDateObj = new Date(selectedDate)
    const today = new Date()
    today.setHours(23, 59, 59, 999)
    
    if (selectedDateObj > today) {
      setError('Date cannot be in the future')
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const date = new Date(selectedDate)
      date.setHours(0, 0, 0, 0)
      const weightNum = parseFloat(weight)

      await addBodyMetric(weightNum, date)
      
      showToast('success', 'Weight logged successfully 💪')
      onSave()
      onClose()
    } catch (err) {
      console.error('Error saving body metric:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save weight. Please try again.'
      setError(errorMessage)
      showToast('error', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Log Weight"
      size="md"
    >
      <div className="space-y-6">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              min={minDate}
              max={maxDate}
              className="w-full px-4 py-3 pr-12 border border-[var(--border-primary)] rounded-lg bg-card text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <Calendar 
              size={20} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" 
            />
          </div>
          {selectedDate && (
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Selected: {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
            </p>
          )}
        </div>

        {/* Weight Input */}
        <div>
          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
            Weight (kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={weight}
            onChange={handleWeightChange}
            placeholder="e.g., 75.5"
            className="w-full px-4 py-3 border border-[var(--border-primary)] rounded-lg bg-card text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Enter your weight in kilograms
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            fullWidth
            onClick={handleSave}
            disabled={isSubmitting || !weight || !selectedDate}
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default AddMetricModal

