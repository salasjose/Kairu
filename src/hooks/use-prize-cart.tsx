"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Prize } from '@/lib/data';

const PRIZE_CART_STORAGE_KEY = 'kairu-prize-cart-v2';

interface PrizeCartContextType {
  prizes: Prize[];
  addPrize: (prize: Prize) => void;
  clearCart: () => void;
}

const PrizeCartContext = createContext<PrizeCartContextType | undefined>(undefined);

export function PrizeCartProvider({ children }: { children: ReactNode }) {
  const [prizes, setPrizes] = useState<Prize[]>([]);

  useEffect(() => {
    try {
      const savedPrizes = localStorage.getItem(PRIZE_CART_STORAGE_KEY);
      if (savedPrizes) {
        const parsedPrizes = JSON.parse(savedPrizes) as Prize[];
        if (Array.isArray(parsedPrizes)) {
          setPrizes(parsedPrizes);
        }
      }
    } catch (error) {
      console.error("Failed to load prize cart from localStorage", error);
    }
  }, []);

  const saveToLocalStorage = (items: Prize[]) => {
      try {
        localStorage.setItem(PRIZE_CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
          console.error("Failed to save prize cart to localStorage", error);
      }
  }

  const addPrize = useCallback((newPrize: Prize) => {
    setPrizes(prevPrizes => {
      // Each station can only contribute one prize. Replace if one from same station exists.
      const otherStationPrizes = prevPrizes.filter(p => p.stationId !== newPrize.stationId);
      const newPrizes = [...otherStationPrizes, newPrize];
      saveToLocalStorage(newPrizes);
      return newPrizes;
    });
  }, []);


  const clearCart = useCallback(() => {
    setPrizes([]);
    saveToLocalStorage([]);
  }, []);

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
