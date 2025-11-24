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
      const fieldsToDelete: { [key: string]: any } = {};
      
      // List of all fields related to game progress
      const gameFields = [
        'avatar', 'chosenScenario', 'placedPrizes', 'station9Locked',
        'station1FaunaPhotos', 'station1FloraPhotos', 'station1HabitatPhotos', 
        'station2Days', 
        'station3UrlCrafts', 'station3UrlSeparate', 
        'station4Url', 'station5Url', 'station6VideoUrl', 
        'station7Businesses', 'station8Url'
      ];
      
      // Dynamically create the object for updateDoc
      // This ensures we only try to delete fields that actually exist in the document
      gameFields.forEach(field => {
        if (Object.prototype.hasOwnProperty.call(userData, field)) {
            fieldsToDelete[field] = deleteField();
        }
      });

      // Always reset unlockedStations to the initial state, don't delete the field itself.
      fieldsToDelete.unlockedStations = [1];

      // Perform the update operation
      await updateDoc(playerDocRef, fieldsToDelete);
        
    } catch (error) {
        console.error("Failed to reset progress in Firestore", error);
    }
  }, [user, db]);

  // unlockedStations will now be read directly from the playerState in GameClient.
  // This hook is now primarily for writing/updating progress.
  return { unlockStation, resetProgress };
}
