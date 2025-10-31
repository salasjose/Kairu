
"use client";

import { useState, useEffect, useCallback } from 'react';

const CHALLENGE_PROGRESS_KEY = 'kairu-challenge-progress';

type ChallengeInfo = {
  completed: boolean;
  imageUrl?: string | null;
};

type ChallengeProgress = {
  [stationId: number]: {
    [challengeName: string]: ChallengeInfo;
  };
};

export function useChallengeProgress() {
  const [completedChallenges, setCompletedChallenges] = useState<ChallengeProgress>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem(CHALLENGE_PROGRESS_KEY);
      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        setCompletedChallenges(parsedProgress);
      }
    } catch (error) {
      console.error("Failed to load challenge progress from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  const completeChallenge = useCallback((stationId: number, challengeName: string, imageUrl: string | null = null) => {
    setCompletedChallenges(prev => {
      const stationProgress = prev[stationId] ? { ...prev[stationId] } : {};
      
      stationProgress[challengeName] = {
        completed: true,
        imageUrl: imageUrl,
      };
      
      const newProgress = { ...prev, [stationId]: stationProgress };

      try {
        localStorage.setItem(CHALLENGE_PROGRESS_KEY, JSON.stringify(newProgress));
      } catch (error) {
        console.error("Failed to save challenge progress to localStorage", error);
      }
      
      return newProgress;
    });
  }, []);
  
  const resetChallengeProgress = useCallback(() => {
    const initialProgress = {};
    setCompletedChallenges(initialProgress);
    try {
      localStorage.setItem(CHALLENGE_PROGRESS_KEY, JSON.stringify(initialProgress));
    } catch (error) {
      console.error("Failed to reset challenge progress in localStorage", error);
    }
  }, []);

  return { completedChallenges, completeChallenge, isLoaded, resetChallengeProgress };
}
