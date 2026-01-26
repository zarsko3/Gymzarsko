import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getAuth, type Auth } from 'firebase/auth'
import { getStorage, type FirebaseStorage } from 'firebase/storage'

// Firebase configuration - these will come from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const requiredKeys: Array<keyof typeof firebaseConfig> = [
  'apiKey',
  'projectId',
  'authDomain',
  'storageBucket',
  'messagingSenderId',
  'appId',
]

const isFirebaseConfigured = requiredKeys.every((key) => !!firebaseConfig[key])

let app: FirebaseApp | null = null
let dbInstance: Firestore | null = null
let authInstance: Auth | null = null
let storageInstance: FirebaseStorage | null = null

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig)
  dbInstance = getFirestore(app)
  authInstance = getAuth(app)
  storageInstance = getStorage(app)
} else if (import.meta.env.DEV) {
  console.warn(
    'Firebase environment variables are missing. Firestore-backed features are disabled; local storage services will be used instead.'
  )
}

export const firebaseApp = app
export const db = dbInstance as Firestore
export const auth = authInstance as Auth
export const storage = storageInstance as FirebaseStorage

// Note: Firebase Analytics is automatically initialized with the config above
// You can import and use it separately if needed: 
// import { getAnalytics } from 'firebase/analytics'
// const analytics = getAnalytics(app)

export default app

