'use client';

import { useContext } from 'react';
import { FirebaseContext } from './provider';

/**
 * Hook to get the Firebase App instance.
 * Throws an error if used outside of a FirebaseProvider.
 */
export const useFirebaseApp = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useFirebaseApp must be used within a FirebaseProvider');
    return context.app;
};

/**
 * Hook to get the Firebase Auth instance.
 * Throws an error if used outside of a FirebaseProvider.
 */
export const useAuth = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useAuth must be used within a FirebaseProvider');
    return context.auth;
};

/**
 * Hook to get the Firestore instance.
 * Throws an error if used outside of a FirebaseProvider.
 */
export const useFirestore = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useFirestore must be used within a FirebaseProvider');
    return context.db;
};

/**
 * Hook to get the Firebase Storage instance.
 * Throws an error if used outside of a FirebaseProvider.
 */
export const useStorage = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useStorage must be used within a FirebaseProvider');
    return context.storage;
};

/**
 * Hook to get the current authenticated user's state.
 * Returns an object with the user, loading status, and any auth error.
 * Throws an error if used outside of a FirebaseProvider.
 */
export const useUser = () => {
    const context = useContext(FirebaseContext);
    if (!context) throw new Error('useUser must be used within a FirebaseProvider');
    return { user: context.user, loading: context.loading, error: context.error };
};
