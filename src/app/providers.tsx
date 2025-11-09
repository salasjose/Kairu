'use client';

import { PrizeCartProvider } from '@/hooks/use-prize-cart';
import { FirebaseClientProvider } from '@/firebase/client-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <FirebaseClientProvider>
      <PrizeCartProvider>
        {children}
      </PrizeCartProvider>
    </FirebaseClientProvider>
  );
}
