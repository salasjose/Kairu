'use client';

import { firebaseConfig } from '@/firebase/config'; // Ajusta la ruta si es diferente
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Singleton pattern
let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let storage: FirebaseStorage;

// Inicializar Firebase solo una vez
if (!getApps().length) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

// Inicializar servicios
auth = getAuth(firebaseApp);
firestore = getFirestore(firebaseApp);
storage = getStorage(firebaseApp);

export { firebaseApp, auth, firestore, storage };

// Opcional: función para inicializar desde proveedores externos
export function initializeFirebase() {
  return {
    firebaseApp,
    auth,
    firestore,
    storage
  };
}

// Exportaciones adicionales
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export * from './hooks';
