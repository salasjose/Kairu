'use client';
import { useContext } from 'react';
import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { FirebaseContext } from './provider';

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

// Hooks moved from firebase/hooks.ts
export const useFirebaseApp = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useFirebaseApp must be used within a FirebaseProvider');
    return context.app;
};

export const useAuth = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useAuth must be used within a FirebaseProvider');
    return context.auth;
};

export const useFirestore = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useFirestore must be used within a FirebaseProvider');
    return context.db;
};

export const useStorage = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useStorage must be used within a FirebaseProvider');
    return context.storage;
};

export const useUser = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useUser must be used within a FirebaseProvider');
    return { user: context.user, loading: context.loading };
};


// Exportaciones adicionales
export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
