import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, X } from 'lucide-react'
import type { WorkoutType } from '../../types'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import WorkoutTypeModal from '../home/WorkoutTypeModal'

interface AddWorkoutModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (type: WorkoutType, date: Date) => Promise<void>
}

function AddWorkoutModal({ isOpen, onClose, onSave }: AddWorkoutModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  )
  const [showWorkoutTypeModal, setShowWorkoutTypeModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  // Get max date (today)
  const maxDate = format(new Date(), 'yyyy-MM-dd')
  
  // Get min date (1 year ago)
  const minDate = format(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    setError('')
  }

  const handleWorkoutTypeSelect = async (type: WorkoutType) => {
    setShowWorkoutTypeModal(false)
    
    if (!selectedDate) {
      setError('Please select a date')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const date = new Date(selectedDate)
      await onSave(type, date)
      onClose()
      // Reset form
      setSelectedDate(format(new Date(), 'yyyy-MM-dd'))
      setError('')
    } catch (err) {
      console.error('Error adding workout:', err)
      setError('Failed to add workout. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSave = () => {
    if (!selectedDate) {
      setError('Please select a date')
      return
    }
    setShowWorkoutTypeModal(true)
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Add Workout to Past Date"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="secondary"
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1"
              disabled={isSubmitting || !selectedDate}
            >
              {isSubmitting ? 'Adding...' : 'Continue'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Select Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                min={minDate}
                max={maxDate}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isSubmitting}
              />
              <Calendar 
                size={20} 
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" 
              />
            </div>
            {selectedDate && (
              <p className="mt-2 text-sm text-text-secondary">
                Selected: {format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}
              </p>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <p className="text-xs text-text-secondary">
            After selecting a date, you'll choose the workout type (Push, Pull, or Legs).
          </p>
        </div>
      </Modal>

      <WorkoutTypeModal
        isOpen={showWorkoutTypeModal}
        onClose={() => setShowWorkoutTypeModal(false)}
        onSelectWorkout={handleWorkoutTypeSelect}
      />
    </>
  )
}

export default AddWorkoutModal

