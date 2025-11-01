'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { stations } from '@/lib/data';
import StationNode from '@/app/components/StationNode';
import CompletionDialog from '@/app/components/CompletionDialog';
import Logo from '@/app/components/Logo';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import PrizeCart from './PrizeCart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnboardingFlow from './auth/OnboardingFlow';
import { useFirebase } from '@/firebase/provider';
import { AnimatePresence } from 'framer-motion';

interface PlayerState {
  name: string;
  avatar: string;
  unlockedStations: number[];
  chosenScenario: string | null;
  isNew: boolean;
}

const initialPlayerState: PlayerState = {
  name: '',
  avatar: '',
  unlockedStations: [1],
  chosenScenario: null,
  isNew: true,
};

export default function GameClient() {
  const { db, user, loading: isFirebaseLoading } = useFirebase();
  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!db || !user) return;

    const playerDocRef = doc(db, 'players', user.uid);

    const getPlayerState = async () => {
      try {
        const docSnap = await getDoc(playerDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as Omit<PlayerState, 'isNew'>;
          setPlayerState({ ...data, isNew: false });
        } else {
          // If the document doesn't exist, it's a new player.
          // The onboarding flow will handle creating the document.
          setPlayerState(initialPlayerState);
        }
      } catch (error) {
        console.error("Error fetching player state:", error);
        // Handle error case, maybe show a retry button or an error message
      } finally {
        setIsLoading(false);
      }
    };

    getPlayerState();
  }, [db, user]);

  const handleOnboardingComplete = async (data: Omit<PlayerState, 'unlockedStations' | 'isNew'>) => {
    if (!db || !user) return;
    const newState: PlayerState = {
      ...initialPlayerState,
      ...data,
      isNew: false,
    };
    try {
      await setDoc(doc(db, 'players', user.uid), {
        name: newState.name,
        avatar: newState.avatar,
        unlockedStations: newState.unlockedStations,
        chosenScenario: newState.chosenScenario,
      });
      setPlayerState(newState);
    } catch (error) {
      console.error("Failed to save player data:", error);
    }
  };

  const handleReset = async () => {
    if (!db || !user) return;
    setIsLoading(true);
    try {
      // Instead of deleting, just reset the state
      await setDoc(doc(db, 'players', user.uid), initialPlayerState);
      setPlayerState(initialPlayerState);
    } catch (error) {
      console.error("Failed to reset player state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const unlockStation = async (stationId: number) => {
    if (!db || !user || !playerState) return;

    setPlayerState(prev => {
        if (!prev) return null;
        const newStations = new Set([...prev.unlockedStations, stationId]);
        const sortedStations = Array.from(newStations).sort((a, b) => a - b);
        const newState = { ...prev, unlockedStations: sortedStations };

        // Save to Firestore without waiting
        setDoc(doc(db, 'players', user.uid), { unlockedStations: sortedStations }, { merge: true })
            .catch(err => console.error("Failed to unlock station:", err));

        return newState;
    });
  };


  if (isLoading || isFirebaseLoading) {
    return (
      <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background">
        <Logo className="h-24 w-24 animate-pulse text-primary" />
        <p className="text-primary/70 mt-4">Cargando Aventura...</p>
      </main>
    );
  }
  
  const mapBgImage = PlaceHolderImages.find((p) => p.id === 'mapa-juego-background');
  const stationPositions = [
    { top: "65%", left: "12%" }, // 1
    { top: "60%", left: "32%" }, // 2
    { top: "48%", left: "38%" }, // 3
    { top: "42%", left: "55%" }, // 4
    { top: "60%", left: "65%" }, // 5
    { top: "70%", left: "80%" }, // 6
    { top: "55%", left: "88%" }, // 7
    { top: "35%", left: "75%" }, // 8
    { top: "25%", left: "90%" }, // 9
  ];
  
  const generatePath = (positions: { top: string; left: string }[]) => {
    if (positions.length < 2) return "";
    return positions.map((pos, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${pos.left.replace('%','')} ${pos.top.replace('%','')}`;
    }).join(' ');
  };
  const pathD = generatePath(stations.map(s => stationPositions[s.id - 1]));


  if (playerState?.isNew) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }
  
  if (!playerState) {
       // This case should ideally not happen if loading is handled correctly,
       // but it's a good fallback.
       return (
         <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background">
           <Logo className="h-24 w-24 text-destructive" />
           <p className="text-destructive/70 mt-4">Error al cargar los datos del jugador.</p>
           <Button onClick={() => window.location.reload()} className="mt-4">Reintentar</Button>
         </main>
       );
  }

  const allStationsCompleted = playerState.unlockedStations.length >= stations.length;

  return (
    <main className="relative w-full min-h-screen flex flex-col overflow-hidden">
      {mapBgImage && (
        <Image
          src={mapBgImage.imageUrl}
          alt={mapBgImage.description}
          fill
          className="object-cover object-center w-full h-full z-0 pointer-events-none select-none"
          priority
          data-ai-hint={mapBgImage.imageHint}
        />
      )}
      
      <header className="absolute top-0 left-0 right-0 p-2 sm:p-4 z-20">
        <div className="container mx-auto flex items-start justify-between gap-2">
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl flex items-center gap-3 shadow-md">
                <Logo className="h-8 w-8 text-green-800" />
                <div className="pr-2">
                    <h1 className="font-bold text-green-900 leading-tight">Kairu</h1>
                    <p className="text-xs text-green-800/80 leading-tight">
                        ¡Bienvenido, {playerState.name}!
                    </p>
                </div>
                <Avatar className="h-12 w-12 border-2 border-white">
                    <AvatarImage src={playerState.avatar} alt="Player Avatar" />
                    <AvatarFallback>{playerState.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset} className="rounded-full bg-white/90 shadow-md h-10 w-auto px-4">
                  Reiniciar
                </Button>
                <PrizeCart />
            </div>
        </div>
      </header>

      <div className="relative flex-1 w-full h-screen overflow-hidden z-10">
        <div className="absolute inset-0">
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
                const isUnlocked = playerState.unlockedStations.includes(station.id);
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
        {allStationsCompleted && (
          <CompletionDialog onReset={handleReset} />
        )}
      </AnimatePresence>
    </main>
  );
}
