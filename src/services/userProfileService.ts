import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore'
import {
  updateProfile,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  deleteUser,
} from 'firebase/auth'
import { db, auth } from '../lib/firebase'
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
    if (error.code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect')
    }
    throw error
  }
}

/**
 * Update email (requires re-authentication)
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

    // Update email in Auth
    await updateEmail(auth.currentUser, newEmail)

    // Update email in Firestore
    await updateUserProfile({ email: newEmail })
  } catch (error: any) {
    console.error('Error changing email:', error)
    if (error.code === 'auth/wrong-password') {
      throw new Error('Password is incorrect')
    } else if (error.code === 'auth/email-already-in-use') {
      throw new Error('Email is already in use')
    }
    throw error
  }
}

/**
 * Delete user account (requires re-authentication)
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

    // Delete Firestore profile
    const userRef = doc(db, USERS_COLLECTION, userId)
    await deleteDoc(userRef)

    // Delete all user's workouts
    // Note: In production, you might want to use a Cloud Function for this
    // to ensure all user data is deleted properly

    // Delete Auth account (must be last)
    await deleteUser(auth.currentUser)
  } catch (error: any) {
    console.error('Error deleting account:', error)
    if (error.code === 'auth/wrong-password') {
      throw new Error('Password is incorrect')
    }
    throw error
  }
}

