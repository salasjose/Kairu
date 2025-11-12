"use client";

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/firebase/hooks';

const CHALLENGE_PROGRESS_KEY_PREFIX = 'kairu-challenge-progress-';

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
  const { user } = useUser();
  const storageKey = user ? `${CHALLENGE_PROGRESS_KEY_PREFIX}${user.uid}` : null;

  useEffect(() => {
    if (storageKey) {
      try {
        const savedProgress = localStorage.getItem(storageKey);
        if (savedProgress) {
          const parsedProgress = JSON.parse(savedProgress);
          setCompletedChallenges(parsedProgress);
        } else {
          setCompletedChallenges({}); // Reset if no data for this user
        }
      } catch (error) {
        console.error("Failed to load challenge progress from localStorage", error);
        setCompletedChallenges({});
      }
    } else {
      // If no user, progress should be empty
      setCompletedChallenges({});
    }
  }, [storageKey]);

  const completeChallenge = useCallback((stationId: number, challengeName: string, imageUrl: string | null = null) => {
    if (!storageKey) return;
    setCompletedChallenges(prev => {
      const stationProgress = prev[stationId] ? { ...prev[stationId] } : {};
      
      stationProgress[challengeName] = {
        completed: true,
        imageUrl: imageUrl,
      };
      
      const newProgress = { ...prev, [stationId]: stationProgress };

      try {
        localStorage.setItem(storageKey, JSON.stringify(newProgress));
      } catch (error) {
        console.error("Failed to save challenge progress to localStorage", error);
      }
      
      return newProgress;
    });
  }, [storageKey]);
  
  const resetChallengeProgress = useCallback(() => {
    if (storageKey) {
      const initialProgress = {};
      setCompletedChallenges(initialProgress);
      try {
        localStorage.removeItem(storageKey);
      } catch (error) {
        console.error("Failed to reset challenge progress in localStorage", error);
      }
    }
  }, [storageKey]);

  return { completedChallenges, completeChallenge, resetChallengeProgress };
}
