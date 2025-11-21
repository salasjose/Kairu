
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
      const docSnap = await getDoc(playerDocRef);
      if (!docSnap.exists()) return;

      const userData = docSnap.data();
      const fieldsToDelete: { [key: string]: any } = {
          unlockedStations: [1], // Reset this field, don't delete
      };
      
      const gameFields = [
        'avatar', 'chosenScenario', 'placedPrizes', 
        'station1FaunaPhotos', 'station1FloraPhotos', 'station1HabitatPhotos', 
        'station2Days', 
        'station3UrlCrafts', 'station3UrlSeparate', 
        'station4Url', 'station5Url', 'station6VideoUrl', 
        'station7Businesses', 'station8Url', 'station9Locked'
      ];
      
      gameFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(userData, field)) {
            fieldsToDelete[field] = deleteField();
        }
      });

      await updateDoc(playerDocRef, fieldsToDelete);
        
    } catch (error) {
        console.error("Failed to reset progress in Firestore", error);
    }
  }, [user, db]);

  // unlockedStations will now be read directly from the playerState in GameClient.
  // This hook is now primarily for writing/updating progress.
  return { unlockStation, resetProgress };
}
