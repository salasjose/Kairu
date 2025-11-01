'use client';

import { FirebaseProvider } from '@/firebase/provider';
import type { ReactNode } from 'react';

export default function FirebaseClientProvider({ children }: { children: ReactNode }) {
    return (
        <FirebaseProvider>
            {children}
        </FirebaseProvider>
    );
}
