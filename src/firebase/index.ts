'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// --- Singleton Pattern for Firebase Initialization ---
// This ensures that Firebase is initialized only once, regardless of how many times
// this module is imported. It's safe for both server and client environments.

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

auth = getAuth(firebaseApp);
firestore = getFirestore(firebaseApp);
storage = getStorage(firebaseApp);

export { firebaseApp, auth, firestore, storage };


// Export the function to be used in client providers, though the services are already initialized
export function initializeFirebase() {
  return {
    firebaseApp,
    auth,
    firestore,
    storage
  };
}
// --- End of Singleton Pattern ---


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export * from './hooks';
