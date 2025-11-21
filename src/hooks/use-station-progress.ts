
"use client";

import { useCallback } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
        if (docSnap.exists()) {
            const currentData = docSnap.data();
            
            // Preserve only essential user registration data
            const dataToKeep = {
                nombre: currentData.nombre || '',
                apellido: currentData.apellido || '',
                usuario: currentData.usuario || '',
                email: currentData.email || '',
                telefono: currentData.telefono || '',
                edad: currentData.edad || '',
            };

            // Overwrite the document completely, preserving only registration data
            // and forcing the user back to the avatar/scenario selection flow.
            await setDoc(playerDocRef, {
                ...dataToKeep,
                unlockedStations: [1], 
                chosenScenario: null, 
                avatar: null,
                // By not including other fields (like station1Photos, placedPrizes etc.),
                // they are effectively deleted from the document.
            });
        }
        
    } catch (error) {
        console.error("Failed to reset progress in Firestore", error);
    }
  }, [user, db]);

  // unlockedStations will now be read directly from the playerState in GameClient.
  // This hook is now primarily for writing/updating progress.
  return { unlockStation, resetProgress };
}
