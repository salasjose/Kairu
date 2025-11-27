
"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Prize } from '@/lib/data';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';

interface PrizeCartContextType {
  prizes: Prize[];
  addPrize: (prize: Prize) => Promise<void>;
  clearCart: () => Promise<void>;
}

const PrizeCartContext = createContext<PrizeCartContextType | undefined>(undefined);

export function PrizeCartProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [user, db]);

  const { data: userDoc } = useDoc<{prizes: Prize[]}>(userDocRef);

  const prizes = userDoc?.prizes || [];

  const addPrize = useCallback(async (newPrize: Prize) => {
    if (!userDocRef) return;

    try {
        const docSnap = await getDoc(userDocRef);
        const currentPrizes = docSnap.exists() && docSnap.data().prizes ? docSnap.data().prizes : [];
        
        const prizeExists = currentPrizes.some((p: Prize) => p.stationId === newPrize.stationId);

        if (!prizeExists) {
            const newPrizes = [...currentPrizes, newPrize];
            await setDoc(userDocRef, { prizes: newPrizes }, { merge: true });
        }
    } catch (error) {
        console.error("Failed to add prize to Firestore", error);
    }
  }, [userDocRef]);


  const clearCart = useCallback(async () => {
    if (!userDocRef) return;
    try {
        await setDoc(userDocRef, { prizes: [] }, { merge: true });
    } catch(e) {
        console.error("Failed to clear cart in Firestore", e);
    }
  }, [userDocRef]);

  const value = { prizes, addPrize, clearCart };

  return (
    <PrizeCartContext.Provider value={value}>
      {children}
    </PrizeCartContext.Provider>
  );
}

export function usePrizeCart() {
  const context = useContext(PrizeCartContext);
  if (context === undefined) {
    throw new Error('usePrizeCart must be used within a PrizeCartProvider');
  }
  return context;
}
