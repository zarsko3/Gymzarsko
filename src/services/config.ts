/**
 * Service Configuration
 * 
 * Toggle between local storage and Firestore by changing USE_FIRESTORE
 * 
 * - false: Uses local storage (for development/testing)
 * - true: Uses Firebase Firestore (for production)
 */

// Check if Firebase is configured
const isFirebaseConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
)

// Use Firestore if it's configured, otherwise fall back to local storage
export const USE_FIRESTORE = isFirebaseConfigured

// Log which service is being used (helpful for debugging)
if (import.meta.env.DEV) {
  console.log(`📦 Using ${USE_FIRESTORE ? 'Firestore' : 'Local Storage'} for data storage`)
}

