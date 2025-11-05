'use client';
import { createContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, Auth, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseApp } from 'firebase/app';
import { initializeFirebase } from './index';
import Logo from '@/app/components/Logo';

interface FirebaseContextType {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  user: User | null;
  loading: boolean;
}

export const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [app, setApp] = useState<FirebaseApp | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [db, setDb] = useState<Firestore | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { app, auth, db } = initializeFirebase();
    setApp(app);
    setAuth(auth);
    setDb(db);

    if (auth) {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });
        return () => unsubscribe();
    } else {
        // Handle the case where auth is not available (e.g., on server)
        setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background">
        <Logo className="h-24 w-24 animate-pulse text-primary" />
        <p className="text-primary/70 mt-4">Estableciendo Conexión...</p>
      </main>
    );
  }

  return (
    <FirebaseContext.Provider value={{ app, auth, db, user, loading }}>
      {children}
    </FirebaseContext.Provider>
  );
}
