'use client';
import { useContext } from 'react';
import { FirebaseContext } from './provider';

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
