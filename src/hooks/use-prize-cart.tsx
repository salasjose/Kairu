"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Prize } from '@/lib/data';
import { useUser } from '@/firebase';


interface PrizeCartContextType {
  prizes: Prize[];
  addPrize: (prize: Prize) => void;
  clearCart: () => void;
}

const PrizeCartContext = createContext<PrizeCartContextType | undefined>(undefined);

export function PrizeCartProvider({ children }: { children: ReactNode }) {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const { user } = useUser();
  const storageKey = user ? `kairu-prize-cart-v2-${user.uid}` : null;

  useEffect(() => {
    if (storageKey) {
      try {
        const savedPrizes = localStorage.getItem(storageKey);
        if (savedPrizes) {
          const parsedPrizes = JSON.parse(savedPrizes) as Prize[];
          if (Array.isArray(parsedPrizes)) {
            setPrizes(parsedPrizes);
          }
        } else {
            setPrizes([]); // Reset if no data for this user
        }
      } catch (error) {
        console.error("Failed to load prize cart from localStorage", error);
        setPrizes([]);
      }
    } else {
        // If no user, cart should be empty
        setPrizes([]);
    }
  }, [storageKey]);

  const saveToLocalStorage = useCallback((items: Prize[]) => {
      if (storageKey) {
          try {
            localStorage.setItem(storageKey, JSON.stringify(items));
          } catch (error) {
              console.error("Failed to save prize cart to localStorage", error);
          }
      }
  }, [storageKey]);

  const addPrize = useCallback((newPrize: Prize) => {
    if (!storageKey) return;
    setPrizes(prevPrizes => {
      // Each station can only contribute one prize. Replace if one from same station exists.
      const otherStationPrizes = prevPrizes.filter(p => p.stationId !== newPrize.stationId);
      const newPrizes = [...otherStationPrizes, newPrize];
      saveToLocalStorage(newPrizes);
      return newPrizes;
    });
  }, [storageKey, saveToLocalStorage]);


  const clearCart = useCallback(() => {
    if (storageKey) {
        setPrizes([]);
        localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

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
