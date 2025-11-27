
"use client";

import { useCallback, useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteField, collection, query, deleteDoc } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useDoc } from '@/firebase/firestore/use-doc';

// Type for individual challenge progress stored in Firestore
export type ChallengeProgressDoc = {
  stationId: number;
  challengeId: string;
  completed: boolean;
  data?: Record<string, any>;
  completedAt: Date;
};

// Type for the hook's return value
export type ChallengeProgress = {
  [stationId: number]: {
    [challengeId: string]: {
      completed: boolean;
      data?: Record<string, any>;
    };
  };
};

/**
 * Manages user progress for all station challenges by reading from and writing to Firestore.
 */
export function useStationProgress() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();

  // 1. Create a memoized query to fetch all progress documents for the current user.
  const progressQuery = useMemoFirebase(() => {
    if (!user || !db) return null;
    return query(collection(db, `users/${user.uid}/stationProgress`));
  }, [user, db]);

  // 2. Use the useCollection hook to get real-time updates.
  const { data: progressDocs, isLoading: progressLoading } = useCollection<ChallengeProgressDoc>(progressQuery);

  // 3. Transform the raw Firestore documents into the nested ChallengeProgress object.
  const completedChallenges: ChallengeProgress = useMemo(() => {
    if (!progressDocs) return {};
    
    return progressDocs.reduce((acc: ChallengeProgress, doc) => {
      if (!acc[doc.stationId]) {
        acc[doc.stationId] = {};
      }
      acc[doc.stationId][doc.challengeId] = {
        completed: doc.completed,
        data: doc.data,
      };
      return acc;
    }, {});
  }, [progressDocs]);
  
  const unlockedStationsQuery = useMemoFirebase(() => {
      if (!user || !db) return null;
      return doc(db, 'users', user.uid);
  }, [user, db]);

  const { data: userDoc, isLoading: userDocLoading } = useDoc(unlockedStationsQuery);
  
  const unlockedStations = useMemo(() => userDoc?.unlockedStations || [1], [userDoc]);

  /**
   * Unlocks a station by adding its ID to the user's unlockedStations array in Firestore.
   */
  const unlockStation = useCallback(async (stationId: number) => {
    if (!user || !db) return;
    
    const playerDocRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(playerDocRef);
      const currentStations = docSnap.exists() && docSnap.data().unlockedStations ? docSnap.data().unlockedStations : [1];
      const newStations = Array.from(new Set([...currentStations, stationId])).sort((a, b) => a - b);
      await setDoc(playerDocRef, { unlockedStations: newStations }, { merge: true });
    } catch (error) {
      console.error("Failed to unlock station in Firestore", error);
    }
  }, [user, db]);

  /**
   * Marks a specific challenge as completed in Firestore.
   */
  const completeChallenge = useCallback(async (stationId: number, challengeId: string, data?: Record<string, any>) => {
    if (!user || !db) return;
    
    const progressDocRef = doc(db, `users/${user.uid}/stationProgress`, `${stationId}-${challengeId}`);
    const progressData: ChallengeProgressDoc = {
      stationId,
      challengeId,
      completed: true,
      data: data || {},
      completedAt: new Date(),
    };
    
    try {
      await setDoc(progressDocRef, progressData, { merge: true });
    } catch (error) {
      console.error("Failed to complete challenge in Firestore", error);
    }
  }, [user, db]);

  /**
   * Resets all game progress for the user in Firestore.
   */
  const resetProgress = useCallback(async () => {
    if (!user || !db) return;

    // This part resets user profile fields, which is correct.
    const playerDocRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(playerDocRef);
      if (!docSnap.exists()) return;

      const userData = docSnap.data();
      const fieldsToDelete: { [key: string]: any } = {};
      
      const gameFields = [
        'avatar', 'chosenScenario', 'placedPrizes', 'station9Locked',
        'station1FaunaPhotos', 'station1FloraPhotos', 'station1HabitatPhotos', 
        'station2Days', 
        'station3UrlCrafts', 'station3UrlSeparate', 
        'station4Url', 'station5Url', 'station6VideoUrl', 
        'station7Businesses', 'station8Url'
      ];
      
      gameFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(userData, field)) {
            fieldsToDelete[field] = deleteField();
        }
      });
      fieldsToDelete.unlockedStations = [1];
      await updateDoc(playerDocRef, fieldsToDelete);

      // We also need to delete all documents in the stationProgress subcollection.
      if (progressDocs) {
        for (const pDoc of progressDocs) {
          const docToDeleteRef = doc(db, `users/${user.uid}/stationProgress`, pDoc.id);
          await deleteDoc(docToDeleteRef);
        }
      }
        
    } catch (error) {
        console.error("Failed to reset progress in Firestore", error);
    }
  }, [user, db, progressDocs]);

  return { 
    completedChallenges, 
    isLoadingProgress: userLoading || progressLoading || userDocLoading,
    unlockedStations,
    unlockStation,
    completeChallenge,
    resetProgress 
  };
}
