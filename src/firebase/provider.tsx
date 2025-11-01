'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initializeFirebase } from './index';
import type { Auth, User } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import type { FirebaseApp } from 'firebase/app';
import { signInAnonymously } from 'firebase/auth';
import Logo from '@/app/components/Logo';

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  user: User | null;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider = ({ children }: { children: ReactNode }) => {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { firebaseApp, auth: firebaseAuth, firestore } = initializeFirebase();
    setApp(firebaseApp);
    setAuth(firebaseAuth);
    setDb(firestore);

    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        try {
          const userCredential = await signInAnonymously(firebaseAuth);
          setUser(userCredential.user);
        } catch (error) {
          console.error("Anonymous sign-in failed", error);
        } finally {
            setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading || !app || !auth || !db) {
    return (
       <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background">
        <Logo className="h-24 w-24 animate-pulse text-primary" />
        <p className="text-primary/70 mt-4">Conectando con Kairu...</p>
      </main>
    );
  }

  return (
    <FirebaseContext.Provider value={{ app, auth, db, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
};
