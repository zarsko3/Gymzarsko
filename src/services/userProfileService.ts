import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  type DocumentReference,
} from 'firebase/firestore'
import { ref, deleteObject } from 'firebase/storage'
import {
  updateProfile,
  updatePassword,
  verifyBeforeUpdateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth'
import { db, auth, storage } from '../lib/firebase'
import type { UserProfile } from '../types'

const USERS_COLLECTION = 'users'

/**
 * Get current user ID
 */
function getUserId(): string {
  const userId = auth.currentUser?.uid
  if (!userId) {
    throw new Error('User must be authenticated')
  }
  return userId
}

/**
 * Get user profile from Firestore
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const userId = getUserId()
    const userRef = doc(db, USERS_COLLECTION, userId)
    const userDoc = await getDoc(userRef)

    if (userDoc.exists()) {
      const data = userDoc.data()

      // Email changes are confirmed out of band; keep the profile in sync with Auth
      const authEmail = auth.currentUser?.email
      if (authEmail && data.email !== authEmail) {
        data.email = authEmail
        updateUserProfile({ email: authEmail }).catch((error) =>
          console.error('Error syncing profile email:', error)
        )
      }

      return {
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as UserProfile
    }

    // Create default profile if doesn't exist
    const defaultProfile: Omit<UserProfile, 'id'> = {
      displayName: auth.currentUser?.displayName || 'User',
      email: auth.currentUser?.email || '',
      theme: 'light',
      notifications: {
        workoutReminders: true,
        progressUpdates: true,
        emailNotifications: false,
      },
      language: 'en',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    // Only add photoURL if it exists
    if (auth.currentUser?.photoURL) {
      (defaultProfile as any).photoURL = auth.currentUser.photoURL
    }

    await createUserProfile(defaultProfile)
    return { id: userId, ...defaultProfile }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

/**
 * Create user profile in Firestore
 */
export async function createUserProfile(
  profile: Omit<UserProfile, 'id'>
): Promise<void> {
  try {
    const userId = getUserId()
    const userRef = doc(db, USERS_COLLECTION, userId)

    // Prepare profile data, filtering out undefined values
    const profileData: Record<string, any> = {
      displayName: profile.displayName,
      email: profile.email,
      theme: profile.theme,
      notifications: profile.notifications,
      language: profile.language,
      createdAt: Timestamp.fromDate(profile.createdAt),
      updatedAt: Timestamp.fromDate(new Date()),
    }

    // Only add photoURL if it's defined
    if (profile.photoURL !== undefined) {
      profileData.photoURL = profile.photoURL
    }

    await setDoc(userRef, profileData)
  } catch (error) {
    console.error('Error creating user profile:', error)
    throw error
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  updates: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const userId = getUserId()
    const userRef = doc(db, USERS_COLLECTION, userId)

    // Filter out undefined values and prepare update data
    const updateData: Record<string, any> = {
      updatedAt: Timestamp.fromDate(new Date()),
    }

    // Only include defined values
    Object.keys(updates).forEach((key) => {
      const value = (updates as any)[key]
      if (value !== undefined) {
        updateData[key] = value
      }
    })

    await updateDoc(userRef, updateData)
  } catch (error) {
    console.error('Error updating user profile:', error)
    throw error
  }
}

/**
 * Update display name in both Auth and Firestore
 */
export async function updateDisplayName(displayName: string): Promise<void> {
  try {
    if (!auth.currentUser) throw new Error('No user logged in')

    // Update Firebase Auth profile
    await updateProfile(auth.currentUser, { displayName })

    // Update Firestore profile
    await updateUserProfile({ displayName })
  } catch (error) {
    console.error('Error updating display name:', error)
    throw error
  }
}

/**
 * Change user password (requires re-authentication)
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  try {
    if (!auth.currentUser?.email) {
      throw new Error('No email associated with account')
    }

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    )
    await reauthenticateWithCredential(auth.currentUser, credential)

    // Update password
    await updatePassword(auth.currentUser, newPassword)
  } catch (error: any) {
    console.error('Error changing password:', error)
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Current password is incorrect')
    }
    throw error
  }
}

/**
 * Request an email change (requires re-authentication).
 * Firebase sends a verification link to the new address; the change takes
 * effect only after it is clicked, and the profile syncs on next load.
 */
export async function changeEmail(
  currentPassword: string,
  newEmail: string
): Promise<void> {
  try {
    if (!auth.currentUser?.email) {
      throw new Error('No email associated with account')
    }

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      currentPassword
    )
    await reauthenticateWithCredential(auth.currentUser, credential)

    await verifyBeforeUpdateEmail(auth.currentUser, newEmail)
  } catch (error: any) {
    console.error('Error changing email:', error)
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Password is incorrect')
    } else if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email is already in use')
    }
    throw error
  }
}

const BATCH_LIMIT = 450

async function deleteRefsInBatches(refs: DocumentReference[]): Promise<void> {
  for (let i = 0; i < refs.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db)
    refs.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref))
    await batch.commit()
  }
}

/**
 * Delete all user data: workouts (and their exercise subcollections),
 * user subcollections, uploaded exercise photos, and the profile document
 */
async function deleteAllUserData(userId: string): Promise<void> {
  const workoutRefs: DocumentReference[] = []
  const exerciseRefs: DocumentReference[] = []

  const workoutsSnapshot = await getDocs(
    query(collection(db, 'workouts'), where('userId', '==', userId))
  )
  for (const workoutDoc of workoutsSnapshot.docs) {
    workoutRefs.push(workoutDoc.ref)
    const exercisesSnapshot = await getDocs(collection(workoutDoc.ref, 'exercises'))
    exercisesSnapshot.forEach((exerciseDoc) => exerciseRefs.push(exerciseDoc.ref))
  }

  // Remove uploaded photo files before their Firestore references disappear
  const photosSnapshot = await getDocs(collection(db, USERS_COLLECTION, userId, 'exercisePhotos'))
  await Promise.all(
    photosSnapshot.docs.map(async (photoDoc) => {
      const storagePath = photoDoc.data().storagePath
      if (!storagePath) return
      try {
        await deleteObject(ref(storage, storagePath))
      } catch (error) {
        console.warn('Could not delete photo file:', error)
      }
    })
  )

  const userSubcollections = ['bodyMetrics', 'bodyMetricGoals', 'plans', 'customExercises', 'exercisePhotos']
  const subcollectionRefs: DocumentReference[] = []
  for (const subcollection of userSubcollections) {
    const snapshot = await getDocs(collection(db, USERS_COLLECTION, userId, subcollection))
    snapshot.forEach((d) => subcollectionRefs.push(d.ref))
  }

  // Children before parents so workout ownership checks still pass
  await deleteRefsInBatches(exerciseRefs)
  await deleteRefsInBatches([...workoutRefs, ...subcollectionRefs])
  await deleteRefsInBatches([doc(db, USERS_COLLECTION, userId)])
}

/**
 * Delete user account (requires re-authentication)
 * Deletes all user data: workouts, body metrics, plans, and profile
 */
export async function deleteUserAccount(password: string): Promise<void> {
  try {
    if (!auth.currentUser?.email) {
      throw new Error('No email associated with account')
    }

    const userId = getUserId()

    // Re-authenticate user
    const credential = EmailAuthProvider.credential(
      auth.currentUser.email,
      password
    )
    await reauthenticateWithCredential(auth.currentUser, credential)

    // Delete all user data from Firestore (workouts, metrics, plans, profile)
    await deleteAllUserData(userId)

    // Delete Auth account (must be last)
    await deleteUser(auth.currentUser)
  } catch (error: any) {
    console.error('Error deleting account:', error)
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error('Password is incorrect')
    }
    throw error
  }
}

