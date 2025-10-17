"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const PRIZE_CART_STORAGE_KEY = 'kairu-prize-cart';

interface PrizeCartContextType {
  prizes: number[];
  addPrize: (prizeId: number) => void;
  removePrize: (prizeId: number) => void;
  clearCart: () => void;
  isLoaded: boolean;
}

const PrizeCartContext = createContext<PrizeCartContextType | undefined>(undefined);

export function PrizeCartProvider({ children }: { children: ReactNode }) {
  const [prizes, setPrizes] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedPrizes = localStorage.getItem(PRIZE_CART_STORAGE_KEY);
      if (savedPrizes) {
        const parsedPrizes = JSON.parse(savedPrizes);
        if (Array.isArray(parsedPrizes)) {
          setPrizes(parsedPrizes);
        }
      }
    } catch (error) {
      console.error("Failed to load prize cart from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  const saveToLocalStorage = (items: number[]) => {
      try {
        localStorage.setItem(PRIZE_CART_STORAGE_KEY, JSON.stringify(items));
      } catch (error) {
          console.error("Failed to save prize cart to localStorage", error);
      }
  }

  const addPrize = useCallback((prizeId: number) => {
    setPrizes(prevPrizes => {
      if (prevPrizes.includes(prizeId)) {
        return prevPrizes;
      }
      const newPrizes = [...prevPrizes, prizeId];
      saveToLocalStorage(newPrizes);
      return newPrizes;
    });
  }, []);

  const removePrize = useCallback((prizeId: number) => {
    setPrizes(prevPrizes => {
        const newPrizes = prevPrizes.filter(id => id !== prizeId);
        saveToLocalStorage(newPrizes);
        return newPrizes;
    });
  }, []);

  const clearCart = useCallback(() => {
    setPrizes([]);
    saveToLocalStorage([]);
  }, []);

  const value = { prizes, addPrize, removePrize, clearCart, isLoaded };

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
