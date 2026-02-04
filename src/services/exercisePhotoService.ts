import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage'
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { storage, db, auth } from '../lib/firebase'

const EXERCISE_PHOTOS_COLLECTION = 'exercisePhotos'

function getUserId(): string {
  const userId = auth.currentUser?.uid
  if (!userId) {
    throw new Error('User must be authenticated to perform this action')
  }
  return userId
}

/**
 * Sanitize an exercise name for use as a storage path segment.
 * Replaces characters that are problematic in file paths.
 */
function sanitizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Upload an equipment photo for an exercise.
 * Stores the file in Firebase Storage and saves the download URL in Firestore.
 * Returns the download URL.
 */
export async function uploadExercisePhoto(
  exerciseName: string,
  file: File,
): Promise<string> {
  const userId = getUserId()
  const safeName = sanitizeName(exerciseName)

  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are allowed')
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be smaller than 5 MB')
  }

  // Upload to Firebase Storage
  const storagePath = `users/${userId}/exercise-photos/${safeName}`
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, file, { contentType: file.type })

  // Get download URL
  const downloadURL = await getDownloadURL(storageRef)

  // Save reference in Firestore
  const docRef = doc(db, 'users', userId, EXERCISE_PHOTOS_COLLECTION, safeName)
  await setDoc(docRef, {
    exerciseName,
    photoURL: downloadURL,
    storagePath,
    updatedAt: serverTimestamp(),
  })

  return downloadURL
}

/**
 * Get the photo URL for a specific exercise (if one exists).
 */
export async function getExercisePhotoURL(exerciseName: string): Promise<string | null> {
  try {
    const userId = getUserId()
    const safeName = sanitizeName(exerciseName)
    const docRef = doc(db, 'users', userId, EXERCISE_PHOTOS_COLLECTION, safeName)
    const snapshot = await getDoc(docRef)

    if (snapshot.exists()) {
      return snapshot.data().photoURL as string
    }
    return null
  } catch (error) {
    console.error('Error getting exercise photo:', error)
    return null
  }
}

/**
 * Get photo URLs for multiple exercises at once (batch).
 * Returns a map of exerciseName -> photoURL.
 */
export async function getExercisePhotos(): Promise<Map<string, string>> {
  const photos = new Map<string, string>()
  try {
    const userId = getUserId()
    const colRef = collection(db, 'users', userId, EXERCISE_PHOTOS_COLLECTION)
    const snapshot = await getDocs(colRef)

    snapshot.forEach((d) => {
      const data = d.data()
      if (data.exerciseName && data.photoURL) {
        photos.set(data.exerciseName, data.photoURL)
      }
    })
  } catch (error) {
    console.error('Error getting exercise photos:', error)
  }
  return photos
}

/**
 * Delete the equipment photo for an exercise.
 */
export async function deleteExercisePhoto(exerciseName: string): Promise<void> {
  const userId = getUserId()
  const safeName = sanitizeName(exerciseName)

  // Get storage path from Firestore doc first
  const docRef = doc(db, 'users', userId, EXERCISE_PHOTOS_COLLECTION, safeName)
  const snapshot = await getDoc(docRef)

  if (snapshot.exists()) {
    const data = snapshot.data()
    // Delete from Storage
    if (data.storagePath) {
      try {
        const storageRef = ref(storage, data.storagePath)
        await deleteObject(storageRef)
      } catch (error) {
        // File might already be deleted, continue
        console.warn('Could not delete storage file:', error)
      }
    }
    // Delete Firestore reference
    await deleteDoc(docRef)
  }
}
