
'use client';
import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { stations } from '@/lib/data';
import StationNode from '@/app/components/StationNode';
import CompletionDialog from '@/app/components/CompletionDialog';
import Logo from '@/app/components/Logo';
import OnboardingFlow from './auth/OnboardingFlow';
import { AnimatePresence } from 'framer-motion';
import { useUser, useFirestore } from '@/firebase';
import type { z } from 'zod';
import type { SignUpFormSchema } from './auth/SignUpForm';
import GameHeader from './GameHeader';
import BackgroundImage from './BackgroundImage';
import { toast } from '@/hooks/use-toast';

export interface PlayerState extends Partial<z.infer<typeof SignUpFormSchema>> {
  id: string;
  name: string;
  avatar: string;
  unlockedStations: number[];
  chosenScenario: string | null;
}

export default function GameClient() {
  const { user } = useUser();
  const db = useFirestore();

  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isFetchingPlayer, setIsFetchingPlayer] = useState(true);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  
  const fetchInitialPlayerState = useCallback(() => {
    if (!user || !db) return;

    setIsFetchingPlayer(true);
    const playerDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(playerDocRef, (docSnap) => {
      setIsFetchingPlayer(false);
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<PlayerState & z.infer<typeof SignUpFormSchema>>;
        
        const newState: PlayerState = {
            id: user.uid,
            name: data.nombre || data.usuario || "Jugador",
            avatar: data.avatar || "",
            chosenScenario: data.chosenScenario || null,
            unlockedStations: data.unlockedStations || [1],
            // Preserve all other user profile data
            apellido: data.apellido,
            usuario: data.usuario,
            email: data.email,
            telefono: data.telefono,
            edad: data.edad,
        };
        
        setPlayerState(currentState => {
            if (JSON.stringify(currentState) === JSON.stringify(newState)) {
                return currentState;
            }
            return newState;
        });

        if (!newState.avatar || !newState.chosenScenario) {
            setIsNewUser(true);
        } else {
            setIsNewUser(false);
        }

        const allStationsComplete = stations.every(s => newState.unlockedStations?.includes(s.id));

        if (allStationsComplete) {
            setIsCompletionDialogOpen(true);
        } else {
            setIsCompletionDialogOpen(false);
        }

      } else {
        setIsNewUser(true);
      }
    }, (error) => {
      console.error("Error fetching player state:", error);
      setIsFetchingPlayer(false);
      setIsNewUser(true);
    });

    return unsubscribe;

  }, [user, db]);

  useEffect(() => {
    if (user) {
      const unsub = fetchInitialPlayerState();
      return () => {
        if (unsub) unsub();
      }
    } else {
      setPlayerState(null);
      setIsNewUser(true);
      setIsFetchingPlayer(false);
    }
  }, [user, fetchInitialPlayerState]);
  
  const handleResetOnboarding = () => {
    // This function is called after a full progress reset.
    // We set isNewUser to true to trigger the OnboardingFlow for re-customization (avatar/scenario).
    setIsNewUser(true); 
  };

  const handleOnboardingComplete = async (data: {
    avatar: string;
    chosenScenario: string;
    signupData?: z.infer<typeof SignUpFormSchema>;
  }) => {
    if (!user || !db) return;
  
    const playerDocRef = doc(db, 'users', user.uid);
  
    try {
      // Fetch the current document to preserve existing user data
      const docSnap = await getDoc(playerDocRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};
      
      const { signupData, ...onboardingData } = data;
  
      // Start with existing data (which has name, email, etc.)
      const finalData: Record<string, any> = { ...existingData };

      // If it's a fresh sign-up, signupData will exist. Add all its fields.
      if (signupData) {
        Object.assign(finalData, signupData);
      }

      // Always overwrite/add avatar, chosenScenario, and reset station progress.
      Object.assign(finalData, {
        id: user.uid,
        ...onboardingData,
        unlockedStations: [1],
      });
  
      // Save the merged data back to Firestore.
      // { merge: true } is crucial to avoid overwriting existing fields like 'nombre', 'email', etc.
      await setDoc(playerDocRef, finalData, { merge: true });
      
      // We don't need to manually update playerState here,
      // as the onSnapshot listener from fetchInitialPlayerState will trigger and do it for us.
      setIsNewUser(false);
  
    } catch (error) {
      console.error("Failed to save player data:", error);
      toast({
          title: "Error al guardar",
          description: "No se pudo guardar tu progreso de bienvenida. Inténtalo de nuevo.",
          variant: "destructive"
      });
    }
  };


  if (isFetchingPlayer) {
    return (
      <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background/80 backdrop-blur-sm">
        <Logo className="h-24 animate-pulse" />
        <p className="text-primary/70 mt-4">Cargando datos del jugador...</p>
      </main>
    );
  }
  
  if (isNewUser) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} onLoginSuccess={fetchInitialPlayerState} />;
  }
  
  if (!playerState) {
       return (
         <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background/80 backdrop-blur-sm">
           <Logo className="h-24 animate-pulse" />
           <p className="text-primary/70 mt-4">Cargando mapa...</p>
         </main>
       );
  }

  const stationPositions = [
    { top: "65%", left: "12%" },
    { top: "60%", left: "32%" },
    { top: "50%", left: "45%" },
    { top: "38%", left: "55%" },
    { top: "60%", left: "65%" },
    { top: "70%", left: "80%" },
    { top: "55%", left: "88%" },
    { top: "35%", left: "75%" },
    { top: "25%", left: "90%" },
  ];
  
  const generatePath = (positions: { top: string; left: string }[]) => {
    if (positions.length < 2) return "";
    return positions.map((pos, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${pos.left.replace('%','')} ${pos.top.replace('%','')}`;
    }).join(' ');
  };
  const pathD = generatePath(stations.map(s => stationPositions[s.id - 1]));

  return (
    <BackgroundImage>
        <GameHeader playerState={playerState} setPlayerState={setPlayerState} onFullReset={handleResetOnboarding} />

        <div className="relative flex-1 w-full h-screen overflow-hidden z-10">
            <div className="absolute inset-0 grid place-items-center">
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute top-0 left-0"
                >
                    <path
                        d={pathD}
                        fill="none"
                        stroke="white"
                        strokeWidth="0.5"
                        strokeDasharray="2 3"
                        strokeLinecap="round"
                    />
                </svg>
                {stations.map((station) => {
                    const isUnlocked = playerState?.unlockedStations?.includes(station.id);
                    const pos = stationPositions[station.id - 1];
                    return (
                    <div 
                        key={station.id} 
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20"
                        style={{ 
                        top: pos.top,
                        left: pos.left,
                        }}
                    >
                        <StationNode station={station} isUnlocked={isUnlocked} />
                    </div>
                    );
                })}
            </div>
        </div>

        <AnimatePresence>
            {isCompletionDialogOpen && (
            <CompletionDialog 
                open={isCompletionDialogOpen}
                onOpenChange={setIsCompletionDialogOpen}
            />
            )}
        </AnimatePresence>
    </BackgroundImage>
  );
}
