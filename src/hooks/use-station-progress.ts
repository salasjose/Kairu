"use client";

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'greenquest-progress';

export function useStationProgress() {
  const [unlockedStations, setUnlockedStations] = useState<number[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // This effect runs only on the client
    try {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        if (Array.isArray(parsedProgress) && parsedProgress.length > 0) {
            setUnlockedStations(parsedProgress);
        } else {
          // Handle case where localStorage has an empty array or invalid data
          setUnlockedStations([1]);
        }
      } else {
        // If no saved progress, set initial state with station 1 unlocked
        setUnlockedStations([1]);
      }
    } catch (error) {
      console.error("Failed to load progress from localStorage", error);
      setUnlockedStations([1]);
    }
    setIsLoaded(true);
  }, []);

  const unlockStation = useCallback((stationId: number) => {
    setUnlockedStations(prev => {
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
        // also clear other station-specific data
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('greenquest-station')) {
                localStorage.removeItem(key);
            }
        });

      } catch (error) {
        console.error("Failed to reset progress in localStorage", error);
      }
  }, []);

  return { unlockedStations, unlockStation, isLoaded, resetProgress };
}
