
'use client';
import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
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

export interface PlayerState {
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

    const playerDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(playerDocRef, (docSnap) => {
      setIsFetchingPlayer(false);
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<PlayerState & z.infer<typeof SignUpFormSchema>>;
        
        const newState: PlayerState = {
            id: user.uid,
            name: data.nombre || "Jugador",
            avatar: data.avatar || "",
            chosenScenario: data.chosenScenario || null,
            unlockedStations: data.unlockedStations || [1],
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
    setPlayerState(null);
    setIsNewUser(true);
  };

  const handleOnboardingComplete = async (data: { name: string; avatar: string; chosenScenario: string; signupData?: z.infer<typeof SignUpFormSchema>}) => {
    if (!user || !db) return;

    const newState: Partial<PlayerState> & Partial<z.infer<typeof SignUpFormSchema>> = {
      id: user.uid,
      avatar: data.avatar,
      chosenScenario: data.chosenScenario,
      unlockedStations: [1],
      ...(data.signupData ? data.signupData : {}),
    };

    try {
        const isExistingUserOnboarding = playerState !== null;
        await setDoc(doc(db, 'users', user.uid), newState, { merge: isExistingUserOnboarding });
        setIsNewUser(false);
    } catch (error) {
        console.error("Failed to save player data:", error);
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
