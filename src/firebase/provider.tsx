'use client';
import { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, Auth, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';
import { initializeFirebase } from './index';
import Logo from '@/app/components/Logo';
import FirebaseErrorListener from '@/components/FirebaseErrorListener';

interface FirebaseContextType {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  user: User | null;
  loading: boolean;
}

export const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Omit<FirebaseContextType, 'user' | 'loading'> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { app, auth, db } = initializeFirebase();
    setServices({ app, auth, db });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        setUser(currentUser);
        setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  if (loading || !services) {
    return (
      <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background">
        <Logo className="h-24 w-24 animate-pulse text-primary" />
        <p className="text-primary/70 mt-4">Estableciendo Conexión...</p>
      </main>
    );
  }

  return (
    <FirebaseContext.Provider value={{ ...services, user, loading }}>
      {children}
      <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}
