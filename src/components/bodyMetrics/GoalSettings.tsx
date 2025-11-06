import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Target } from 'lucide-react'
import { setBodyMetricGoal, getBodyMetricGoal, deleteBodyMetricGoal } from '../../services/firestoreBodyMetricsService'
import { useToast } from '../../hooks/useToast'
import type { BodyMetricGoal } from '../../types'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

interface GoalSettingsProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

function GoalSettings({ isOpen, onClose, onSave }: GoalSettingsProps) {
  const { showToast } = useToast()
  const [targetWeight, setTargetWeight] = useState<string>('')
  const [targetDate, setTargetDate] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')

  // Get min date (today)
  const minDate = format(new Date(), 'yyyy-MM-dd')

  // Load existing goal when modal opens
  useEffect(() => {
    if (isOpen) {
      loadGoal()
    } else {
      // Reset form when modal closes
      setTargetWeight('')
      setTargetDate('')
      setError('')
    }
  }, [isOpen])

  const loadGoal = async () => {
    setIsLoading(true)
    try {
      const goal = await getBodyMetricGoal()
      if (goal) {
        setTargetWeight(goal.targetWeight.toString())
        if (goal.targetDate) {
          setTargetDate(format(goal.targetDate, 'yyyy-MM-dd'))
        } else {
          setTargetDate('')
        }
      } else {
        setTargetWeight('')
        setTargetDate('')
      }
    } catch (error) {
      console.error('Error loading goal:', error)
      showToast('error', 'Failed to load goal settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    // Allow empty, numbers, and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setTargetWeight(value)
      setError('')
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetDate(e.target.value)
    setError('')
  }

  const validate = (): boolean => {
    if (!targetWeight) {
      setError('Please enter a target weight')
      return false
    }

    const weightNum = parseFloat(targetWeight)
    if (isNaN(weightNum)) {
      setError('Please enter a valid weight')
      return false
    }

    if (weightNum <= 0) {
      setError('Target weight must be greater than 0')
      return false
    }

    if (weightNum > 300) {
      setError('Target weight must be less than 300 kg')
      return false
    }

    if (targetDate) {
      const selectedDate = new Date(targetDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (selectedDate < today) {
        setError('Target date cannot be in the past')
        return false
      }
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
      const weightNum = parseFloat(targetWeight)
      const date = targetDate ? new Date(targetDate) : undefined

      await setBodyMetricGoal(weightNum, date)
      
      showToast('success', 'Goal saved successfully 🎯')
      onSave()
      onClose()
    } catch (err) {
      console.error('Error saving goal:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to save goal. Please try again.'
      setError(errorMessage)
      showToast('error', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear your goal?')) {
      return
    }

    setIsSubmitting(true)
    try {
      await deleteBodyMetricGoal()
      showToast('success', 'Goal cleared')
      onSave()
      onClose()
    } catch (err) {
      console.error('Error clearing goal:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear goal'
      showToast('error', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Set Weight Goal"
      size="md"
    >
      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-[var(--text-secondary)]">Loading...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Target Weight Input */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Target Weight (kg) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={targetWeight}
              onChange={handleWeightChange}
              placeholder="e.g., 72"
              className="w-full px-4 py-3 border border-[var(--border-primary)] rounded-lg bg-card text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Enter your target weight in kilograms
            </p>
          </div>

          {/* Target Date Input (Optional) */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
              Target Date (optional)
            </label>
            <div className="relative">
              <input
                type="date"
                value={targetDate}
                onChange={handleDateChange}
                min={minDate}
                className="w-full px-4 py-3 pr-12 border border-[var(--border-primary)] rounded-lg bg-card text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <Calendar 
                size={20} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none" 
              />
            </div>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Optional: Set a deadline for reaching your goal
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex gap-3">
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
                disabled={isSubmitting || !targetWeight}
              >
                {isSubmitting ? 'Saving...' : 'Save Goal'}
              </Button>
            </div>
            
            {targetWeight && (
              <Button
                variant="ghost"
                fullWidth
                onClick={handleClear}
                disabled={isSubmitting}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear Goal
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}

export default GoalSettings

