'use client';
import { useState, useEffect, useCallback } from 'react';
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
import { AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, useAuth } from '@/firebase/hooks';
import { signOut } from 'firebase/auth';

interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  unlockedStations: number[];
  chosenScenario: string | null;
}

const initialPlayerState: Omit<PlayerState, 'id' | 'name' | 'avatar' | 'chosenScenario'> = {
  unlockedStations: [1],
};

export default function GameClient() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();

  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  
  const fetchPlayerState = useCallback(async () => {
    if (!user || !db) return;

    const playerDocRef = doc(db, 'users', user.uid);
    
    try {
      const docSnap = await getDoc(playerDocRef);
      if (docSnap.exists()) {
        setPlayerState(docSnap.data() as PlayerState);
        setIsNewUser(false);
      } else {
        setIsNewUser(true);
      }
    } catch (error) {
      console.error("Error fetching player state:", error);
      setIsNewUser(true);
    }
  }, [user, db]);

  useEffect(() => {
    if (userLoading) return;
    
    if (user) {
      fetchPlayerState();
    } else {
      setPlayerState(null);
      setIsNewUser(true);
    }
  }, [user, userLoading, fetchPlayerState]);

  const handleOnboardingComplete = async (data: { name: string; avatar: string; chosenScenario: string; }) => {
    if (!user || !db) return;

    const newState: PlayerState = {
      id: user.uid,
      name: data.name,
      avatar: data.avatar,
      chosenScenario: data.chosenScenario,
      unlockedStations: [1],
    };
    try {
      await setDoc(doc(db, 'users', user.uid), newState);
      setPlayerState(newState);
      setIsNewUser(false);
    } catch (error) {
      console.error("Failed to save player data:", error);
    }
  };
  
  const handleReset = async () => {
    if (!user || !db || !playerState) return;
    const initialData: PlayerState = {
      id: user.uid,
      unlockedStations: [1],
      name: playerState.name,
      avatar: playerState.avatar,
      chosenScenario: playerState.chosenScenario,
    };
    try {
       await setDoc(doc(db, 'users', user.uid), initialData);
       setPlayerState(initialData);
    } catch (error) {
      console.error("Failed to reset player state:", error);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setPlayerState(null);
    setIsNewUser(true);
  }

  if (userLoading) {
    return (
      <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background">
        <Logo className="h-24 w-24 animate-pulse text-primary" />
        <p className="text-primary/70 mt-4">Cargando datos del jugador...</p>
      </main>
    );
  }
  
  if (isNewUser) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} onLoginSuccess={fetchPlayerState} />;
  }
  
  if (!playerState) {
       return (
         <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background">
           <Logo className="h-24 w-24 animate-pulse text-primary" />
           <p className="text-primary/70 mt-4">Cargando mapa...</p>
         </main>
       );
  }

  const mapBgImage = PlaceHolderImages.find((p) => p.id === 'mapa-juego-background');
  const stationPositions = [
    { top: "65%", left: "12%" },
    { top: "60%", left: "32%" },
    { top: "48%", left: "38%" },
    { top: "42%", left: "55%" },
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

  const allStationsCompleted = playerState?.unlockedStations?.length >= stations.length;

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
                    <AvatarFallback>{playerState?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset} className="rounded-full bg-white/90 shadow-md h-10 w-auto px-4">
                  Reiniciar
                </Button>
                 <Button variant="destructive" size="sm" onClick={handleLogout} className="rounded-full bg-white/90 shadow-md h-10 w-auto px-4">
                  Salir
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
          <CompletionDialog onReset={handleReset} open={allStationsCompleted}/>
        )}
      </AnimatePresence>
    </main>
  );
}
