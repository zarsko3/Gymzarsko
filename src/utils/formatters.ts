import { format, formatDistance } from 'date-fns'
import type { Timestamp } from 'firebase/firestore'

/**
 * Safely convert various date types to Date object
 * Handles: Date, Firestore Timestamp, ISO string, epoch number, null, undefined
 */
export function toDateSafe(
  v: Date | string | number | Timestamp | { seconds: number; nanoseconds?: number } | null | undefined
): Date | null {
  if (!v) return null
  
  if (v instanceof Date) {
    // Check if date is valid
    if (isNaN(v.getTime())) return null
    return v
  }
  
  if (typeof v === 'number') {
    // Epoch milliseconds
    const d = new Date(v)
    if (isNaN(d.getTime())) return null
    return d
  }
  
  if (typeof v === 'string') {
    // ISO string or date string
    const d = new Date(v)
    if (isNaN(d.getTime())) return null
    return d
  }
  
  if (typeof v === 'object') {
    // Firestore Timestamp or object with seconds property
    if ('toDate' in v && typeof v.toDate === 'function') {
      // Firestore Timestamp
      return v.toDate()
    }
    
    if ('seconds' in v && typeof v.seconds === 'number') {
      // Object with seconds property (Firestore Timestamp-like)
      const d = new Date(v.seconds * 1000)
      if (isNaN(d.getTime())) return null
      return d
    }
  }
  
  return null
}

// Format date for display
export const formatDate = (date: Date | string | number | Timestamp | null | undefined): string => {
  const d = toDateSafe(date)
  if (!d) return 'N/A'
  return format(d, 'MMM d, yyyy')
}

// Format time for display
export const formatTime = (date: Date | string | number | Timestamp | null | undefined): string => {
  const d = toDateSafe(date)
  if (!d) return 'N/A'
  return format(d, 'h:mm a')
}

// Format relative time (e.g., "2 hours ago")
export const formatRelativeTime = (date: Date | string | number | Timestamp | null | undefined): string => {
  const d = toDateSafe(date)
  if (!d) return 'N/A'
  return formatDistance(d, new Date(), { addSuffix: true })
}

// Format workout duration
export const formatDuration = (
  startTime: Date | string | number | Timestamp | null | undefined,
  endTime: Date | string | number | Timestamp | null | undefined
): string => {
  const start = toDateSafe(startTime)
  const end = toDateSafe(endTime)
  
  if (!start || !end) {
    return 'N/A'
  }
  
  const durationMs = end.getTime() - start.getTime()
  if (durationMs < 0) {
    return 'N/A'
  }
  
  const minutes = Math.floor(durationMs / 60000)
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`
  }
  return `${minutes}m`
}

// Format date with custom format string (wrapper around date-fns format)
export const formatDateCustom = (
  date: Date | string | number | Timestamp | null | undefined,
  formatStr: string
): string => {
  const d = toDateSafe(date)
  if (!d) return 'N/A'
  return format(d, formatStr)
}

// Format weight with unit
export const formatWeight = (weight: number, unit: 'kg' | 'lbs' = 'kg'): string => {
  return `${weight} ${unit}`
}

// Calculate total volume (weight × reps)
export const calculateVolume = (weight: number, reps: number): number => {
  return weight * reps
}

