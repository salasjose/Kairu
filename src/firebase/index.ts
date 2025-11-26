'use client';

// This file is the single entry point for all Firebase-related modules.
// It initializes the Firebase app and exports all necessary components, hooks, and utilities.

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

// Initialize Firebase App
let firebaseApp: FirebaseApp;
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

// Initialize Services
const auth: Auth = getAuth(firebaseApp);
const firestore: Firestore = getFirestore(firebaseApp);
const storage: FirebaseStorage = getStorage(firebaseApp);

// Re-export the initialized services
export { firebaseApp, auth, firestore, storage };

// Export a function for explicit initialization if needed elsewhere
export function initializeFirebase() {
  return {
    firebaseApp,
    auth,
    firestore,
    storage,
  };
}

// Export providers and context
export * from './provider';
export * from './client-provider';

// Export hooks
export * from './hooks';

// Export utility functions and classes
export * from './errors';
export * from './error-emitter';
