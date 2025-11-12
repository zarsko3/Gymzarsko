/**
 * Centralized Firestore Error Handler
 * Converts Firestore errors into user-friendly messages
 */

export interface FirestoreError {
  code?: string
  message?: string
}

export function handleFirestoreError(error: any): {
  message: string
  indexLink?: string
  isIndexError: boolean
} {
  // Check if it's an index error
  if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
    const indexLinkMatch = error.message?.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)
    const indexLink = indexLinkMatch ? indexLinkMatch[0] : undefined
    
    return {
      message: 'Firestore index is required. Please create it in Firebase Console.',
      indexLink,
      isIndexError: true,
    }
  }
  
  // Permission denied
  if (error?.code === 'permission-denied') {
    return {
      message: 'Permission denied. Please check your Firestore security rules.',
      isIndexError: false,
    }
  }
  
  // Unavailable
  if (error?.code === 'unavailable') {
    return {
      message: 'Firebase service unavailable. Please check your internet connection.',
      isIndexError: false,
    }
  }
  
  // Not found
  if (error?.code === 'not-found') {
    return {
      message: 'Resource not found.',
      isIndexError: false,
    }
  }
  
  // Already exists
  if (error?.code === 'already-exists') {
    return {
      message: 'This resource already exists.',
      isIndexError: false,
    }
  }
  
  // Default error
  return {
    message: error?.message || 'An error occurred. Please try again.',
    isIndexError: false,
  }
}


