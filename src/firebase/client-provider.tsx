'use client';

import React, { ReactNode, useMemo } from 'react';
import { initializeFirebase, FirebaseProvider } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Initializes Firebase on the client and wraps children with FirebaseProvider.
 * Memoizes the Firebase instances to prevent re-initialization on re-renders.
 */
export const FirebaseClientProvider: React.FC<FirebaseClientProviderProps> = ({
  children,
}) => {
  // Memoize Firebase services to ensure they are initialized only once
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs once

  return (
    <FirebaseProvider {...firebaseServices}>
        {children}
    </FirebaseProvider>
  );
};
