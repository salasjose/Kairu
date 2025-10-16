"use client";

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'ecoquest-progress';

export function useStationProgress() {
  const [unlockedStations, setUnlockedStations] = useState<number[]>([1]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // This effect runs only on the client
    try {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        if (Array.isArray(parsedProgress) && parsedProgress.length > 0) {
            setUnlockedStations(parsedProgress);
        }
      }
    } catch (error) {
      console.error("Failed to load progress from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  const unlockStation = useCallback((stationId: number) => {
    setUnlockedStations(prev => {
      // Use a Set to prevent duplicate station IDs
      const newStations = new Set([...prev, stationId]);
      const sortedStations = Array.from(newStations).sort((a, b) => a - b);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedStations));
      } catch (error) {
        console.error("Failed to save progress to localStorage", error);
      }
      
      return sortedStations;
    });
  }, []);
  
  const resetProgress = useCallback(() => {
      const initialStations = [1];
      setUnlockedStations(initialStations);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(initialStations));
      } catch (error) {
        console.error("Failed to reset progress in localStorage", error);
      }
  }, []);

  return { unlockedStations, unlockStation, isLoaded, resetProgress };
}
