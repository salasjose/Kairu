
"use client";

import { useCallback, useMemo } from 'react';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteField, collection, query, getDocs, writeBatch } from 'firebase/firestore';
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
   * Resets all game progress for the user in Firestore, but keeps registration data.
   */
  const resetProgress = useCallback(async () => {
    if (!user || !db) return;

    const progressCollectionRef = collection(db, `users/${user.uid}/stationProgress`);
    const batch = writeBatch(db);
    try {
      const progressSnapshot = await getDocs(progressCollectionRef);
      progressSnapshot.forEach((doc) => {
          batch.delete(doc.ref);
      });
      await batch.commit();

      const playerDocRef = doc(db, 'users', user.uid);
      await updateDoc(playerDocRef, {
        unlockedStations: [1],
        prizes: deleteField(),
        avatar: deleteField(),
        chosenScenario: deleteField(),
        placedPrizes: deleteField(),
        station1FaunaPhotos: deleteField(),
        station1FloraPhotos: deleteField(),
        station1HabitatPhotos: deleteField(),
        station2Days: deleteField(),
        station3UrlCrafts: deleteField(),
        station3UrlSeparate: deleteField(),
        station4Url: deleteField(),
        station5Url: deleteField(),
        station6VideoUrl: deleteField(),
        station7Businesses: deleteField(),
        station8Url: deleteField(),
        station9Confirmed: deleteField(),
        station9Finalized: deleteField()
      });

    } catch (error) {
        console.error("Failed to reset progress in Firestore", error);
    }
  }, [user, db]);

  return { 
    completedChallenges, 
    isLoadingProgress: userLoading || progressLoading || userDocLoading,
    unlockedStations,
    unlockStation,
    completeChallenge,
    resetProgress 
  };
}
