import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Trash2 } from 'lucide-react'
import { updateBodyMetric, deleteBodyMetric, getBodyMetricByDate } from '../../services/firestoreBodyMetricsService'
import { useToast } from '../../hooks/useToast'
import type { BodyMetricEntry } from '../../types'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

interface EditMetricModalProps {
  isOpen: boolean
  onClose: () => void
  entry: BodyMetricEntry | null
  onSave: () => void
  onDelete: () => void
}

function EditMetricModal({ isOpen, onClose, entry, onSave, onDelete }: EditMetricModalProps) {
  const { showToast } = useToast()
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string>('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Get max date (today)
  const maxDate = format(new Date(), 'yyyy-MM-dd')
  
  // Get min date (1 year ago)
  const minDate = format(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')

  // Initialize form when entry changes
  useEffect(() => {
    if (entry) {
      setSelectedDate(format(entry.date, 'yyyy-MM-dd'))
      setWeight(entry.weight.toString())
      setError('')
      setShowDeleteConfirm(false)
    }
  }, [entry])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedDate('')
      setWeight('')
      setError('')
      setShowDeleteConfirm(false)
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
    if (!entry || !validate()) {
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const weightNum = parseFloat(weight)
      const selectedDateObj = new Date(selectedDate)
      selectedDateObj.setHours(0, 0, 0, 0)
      
      // Check if date changed
      const originalDate = new Date(entry.date)
      originalDate.setHours(0, 0, 0, 0)
      const dateChanged = selectedDateObj.getTime() !== originalDate.getTime()
      
      // If date changed, we need to check if an entry already exists for the new date
      if (dateChanged) {
        const existingEntry = await getBodyMetricByDate(selectedDateObj)
        
        if (existingEntry && existingEntry.id !== entry.id) {
          setError('An entry already exists for this date. Please delete it first or choose a different date.')
          setIsSubmitting(false)
          return
        }
      }
      
      await updateBodyMetric(entry.id, weightNum, selectedDateObj)
      
      showToast('success', 'Weight updated successfully ✅')
      onSave()
      onClose()
    } catch (err) {
      console.error('Error updating body metric:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to update weight. Please try again.'
      setError(errorMessage)
      showToast('error', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!entry) {
      return
    }

    setIsDeleting(true)
    setError('')

    try {
      await deleteBodyMetric(entry.id)
      showToast('success', 'Weight entry deleted')
      onDelete()
      onClose()
    } catch (err) {
      console.error('Error deleting body metric:', err)
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete entry. Please try again.'
      setError(errorMessage)
      showToast('error', errorMessage)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  if (!entry) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Weight Entry"
      size="md"
    >
      <div className="space-y-6">
        {!showDeleteConfirm ? (
          <>
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
                  disabled={isSubmitting || isDeleting}
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
                disabled={isSubmitting || isDeleting}
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
            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={onClose}
                  disabled={isSubmitting || isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  fullWidth
                  onClick={handleSave}
                  disabled={isSubmitting || isDeleting || !weight || !selectedDate}
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </Button>
              </div>
              
              <Button
                variant="ghost"
                fullWidth
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Entry
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Delete Confirmation */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 size={32} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  Delete Weight Entry?
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  This will permanently delete this entry. This action cannot be undone.
                </p>
              </div>
            </div>

            {/* Delete Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default EditMetricModal

