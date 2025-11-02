/**
 * Firebase Connection Test Utility
 * 
 * Use this to verify your Firebase connection is working
 */

import { db } from '../lib/firebase'
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore'

export async function testFirebaseConnection(): Promise<{
  success: boolean
  message: string
  details?: any
}> {
  try {
    console.log('🔍 Testing Firebase connection...')

    // Test 1: Check if Firebase is initialized
    if (!db) {
      return {
        success: false,
        message: 'Firebase is not initialized. Check your environment variables.',
      }
    }
    console.log('✅ Firebase initialized')

    // Test 2: Try to read from Firestore
    const workoutsRef = collection(db, 'workouts')
    const snapshot = await getDocs(workoutsRef)
    console.log(`✅ Successfully read from Firestore (${snapshot.size} documents)`)

    // Test 3: Try to write to Firestore
    const testDoc = {
      test: true,
      timestamp: new Date(),
      message: 'Firebase connection test',
    }
    const docRef = await addDoc(collection(db, 'test_connection'), testDoc)
    console.log('✅ Successfully wrote to Firestore')

    // Test 4: Clean up test document
    await deleteDoc(doc(db, 'test_connection', docRef.id))
    console.log('✅ Successfully deleted test document')

    return {
      success: true,
      message: '🎉 Firebase connection successful!',
      details: {
        documentsFound: snapshot.size,
        canRead: true,
        canWrite: true,
        canDelete: true,
      },
    }
  } catch (error: any) {
    console.error('❌ Firebase connection test failed:', error)
    
    let message = 'Failed to connect to Firebase.'
    
    if (error.code === 'permission-denied') {
      message = 'Permission denied. Check your Firestore security rules.'
    } else if (error.code === 'unavailable') {
      message = 'Firebase service unavailable. Check your internet connection.'
    } else if (error.message?.includes('projectId')) {
      message = 'Invalid Firebase configuration. Check your environment variables.'
    }

    return {
      success: false,
      message,
      details: {
        errorCode: error.code,
        errorMessage: error.message,
      },
    }
  }
}

// Run test if called directly from browser console
if (typeof window !== 'undefined') {
  (window as any).testFirebaseConnection = testFirebaseConnection
  console.log('🔧 Firebase test function available: window.testFirebaseConnection()')
}

