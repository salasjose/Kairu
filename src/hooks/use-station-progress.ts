
"use client";

import { useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, getDoc, updateDoc, deleteField } from 'firebase/firestore';

export function useStationProgress() {
  const { user } = useUser();
  const db = useFirestore();

  const unlockStation = useCallback(async (stationId: number) => {
    if (!user || !db) return;
    
    const playerDocRef = doc(db, 'users', user.uid);

    try {
      const docSnap = await getDoc(playerDocRef);
      let currentStations: number[] = [1];

      if (docSnap.exists() && docSnap.data().unlockedStations) {
        currentStations = docSnap.data().unlockedStations;
      }
      
      const newStations = new Set([...currentStations, stationId]);
      const sortedStations = Array.from(newStations).sort((a, b) => a - b);

      await setDoc(playerDocRef, { unlockedStations: sortedStations }, { merge: true });

    } catch (error) {
      console.error("Failed to unlock station in Firestore", error);
    }
  }, [user, db]);
  
  const resetProgress = useCallback(async () => {
    if (!user || !db) return;
    
    const playerDocRef = doc(db, 'users', user.uid);
    try {
      // Deletes all game-related fields from the document,
      // leaving only the original registration data.
      await updateDoc(playerDocRef, {
          unlockedStations: [1],
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
          station9Locked: deleteField(),
      });
        
    } catch (error) {
        console.error("Failed to reset progress in Firestore", error);
    }
  }, [user, db]);

  // unlockedStations will now be read directly from the playerState in GameClient.
  // This hook is now primarily for writing/updating progress.
  return { unlockStation, resetProgress };
}
