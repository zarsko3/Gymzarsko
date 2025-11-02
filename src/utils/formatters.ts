import { format, formatDistance } from 'date-fns'

// Format date for display
export const formatDate = (date: Date): string => {
  return format(date, 'MMM d, yyyy')
}

// Format time for display
export const formatTime = (date: Date): string => {
  return format(date, 'h:mm a')
}

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date: Date): string => {
  return formatDistance(date, new Date(), { addSuffix: true })
}

// Format workout duration
export const formatDuration = (startTime: Date, endTime: Date): string => {
  const durationMs = endTime.getTime() - startTime.getTime()
  const minutes = Math.floor(durationMs / 60000)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`
  }
  return `${minutes}m`
}

// Format weight with unit
export const formatWeight = (weight: number, unit: 'kg' | 'lbs' = 'kg'): string => {
  return `${weight} ${unit}`
}

// Calculate total volume (weight × reps)
export const calculateVolume = (weight: number, reps: number): number => {
  return weight * reps
}

