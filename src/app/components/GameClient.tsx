'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { doc, onSnapshot, setDoc as setFirestoreDoc } from 'firebase/firestore';
import { stations } from '@/lib/data';
import StationNode from '@/app/components/StationNode';
import CompletionDialog from '@/app/components/CompletionDialog';
import Logo from '@/app/components/Logo';
import { Button } from '@/components/ui/button';
import PrizeCart from './PrizeCart';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import OnboardingFlow from './auth/OnboardingFlow';
import { AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, useAuth } from '@/firebase/hooks';
import { signOut } from 'firebase/auth';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useStationProgress } from '@/hooks/use-station-progress';
import { usePrizeCart } from '@/hooks/use-prize-cart';
import { Settings, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { SignUpFormSchema } from './auth/SignUpForm';
import { z } from 'zod';
import { useChallengeProgress } from '@/hooks/use-challenge-progress';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  unlockedStations: number[];
  chosenScenario: string | null;
}

const SettingsPanel = ({ playerState, setPlayerState, onFullReset }: { playerState: PlayerState; setPlayerState: (state: PlayerState) => void; onFullReset: () => void; }) => {
    const db = useFirestore();
    const { resetProgress } = useStationProgress();
    const { clearCart } = usePrizeCart();
    const { resetChallengeProgress } = useChallengeProgress();
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const avatars = useMemo(() => {
        return PlaceHolderImages.filter(p => p.id.startsWith('avatar-')).map(p => ({
            id: p.id,
            imageUrl: p.imageUrl,
            description: p.description
        })).sort((a,b) => a.id.localeCompare(b.id));
    }, []);

    const handleAvatarChange = async (newAvatarUrl: string) => {
        if (!playerState || !db) {
             toast({ title: "Error", description: "No se pudo actualizar el avatar. Intenta más tarde.", variant: "destructive" });
             return;
        };

        const updatedState = { ...playerState, avatar: newAvatarUrl };
        setPlayerState(updatedState);
        toast({ title: "Avatar Actualizado", description: "Tu nuevo avatar ha sido guardado." });
        
        try {
            const playerDocRef = doc(db, 'users', playerState.id);
            await setFirestoreDoc(playerDocRef, { avatar: newAvatarUrl }, { merge: true });
        } catch (error) {
            console.error("Failed to update avatar in Firestore:", error);
            toast({ title: "Error de Sincronización", description: "No se pudo guardar el avatar en la nube.", variant: "destructive" });
            // Optionally, revert the local state if the cloud save fails
            // setPlayerState(playerState); 
        }
    };
    
    const handleClearCacheAndReset = () => {
        resetChallengeProgress();
        clearCart();
        resetProgress(); // Resets station progress in DB
        onFullReset(); // Triggers the onboarding flow in the parent
        toast({
            title: "Reiniciando",
            description: "Puedes elegir tu avatar y escenario de nuevo."
        });
        setIsAlertOpen(false);
    };


    return (
      <>
        <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción reiniciará tu progreso local y te permitirá elegir tu avatar y escenario de nuevo. Tu cuenta y progreso en la nube no se verán afectados.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearCacheAndReset}>Sí, reiniciar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        <SheetContent>
            <SheetHeader>
                <SheetTitle>Configuración</SheetTitle>
                <SheetDescription>Personaliza tu experiencia en Kairu.</SheetDescription>
            </SheetHeader>
            <div className="py-4">
                <h3 className="font-semibold mb-4">Cambiar Avatar</h3>
                <div className="grid grid-cols-2 gap-4">
                    {avatars.map(avatar => (
                         <button 
                           key={avatar.id} 
                           onClick={() => handleAvatarChange(avatar.imageUrl)}
                           className={cn(
                            "p-2 rounded-lg border-2 transition-all",
                            playerState.avatar === avatar.imageUrl 
                                ? "border-primary bg-primary/10 shadow-lg scale-105"
                                : "border-border hover:bg-accent"
                           )}
                         >
                            <div className="relative w-full aspect-square">
                                <Image 
                                    src={avatar.imageUrl} 
                                    alt={avatar.description} 
                                    fill
                                    className="rounded-md object-contain" 
                                />
                            </div>
                        </button>
                    ))}
                </div>
            </div>
            <SheetFooter className="mt-auto">
                <Button variant="destructive" className="w-full" onClick={() => setIsAlertOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Reiniciar Avatar y Escenario
                </Button>
            </SheetFooter>
        </SheetContent>
      </>
    );
};


export default function GameClient() {
  const { user, loading: userLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const { resetProgress } = useStationProgress();
  const { clearCart } = usePrizeCart();
  const { resetChallengeProgress } = useChallengeProgress();
  const mapBackground = PlaceHolderImages.find(p => p.id === 'map-background');


  const [playerState, setPlayerState] = useState<PlayerState | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isFetchingPlayer, setIsFetchingPlayer] = useState(true);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  
  const fetchInitialPlayerState = useCallback(async () => {
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
        setPlayerState(newState);

        // If user has no avatar or scenario, force them back to onboarding
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
    if (userLoading) {
      setIsFetchingPlayer(true);
      return;
    };
    
    if (user) {
      const unsubPromise = fetchInitialPlayerState();
      return () => {
        unsubPromise?.then(unsub => unsub && unsub());
      }
    } else {
      setPlayerState(null);
      setIsNewUser(true);
      setIsFetchingPlayer(false);
    }
  }, [user, userLoading, fetchInitialPlayerState]);
  
  const handleResetOnboarding = () => {
    setIsNewUser(true);
  };

  const handleOnboardingComplete = async (data: { name: string; avatar: string; chosenScenario: string; signupData: z.infer<typeof SignUpFormSchema>}) => {
    if (!user || !db) return;

    const newState: Partial<PlayerState> & Partial<z.infer<typeof SignUpFormSchema>> = {
      id: user.uid,
      avatar: data.avatar,
      chosenScenario: data.chosenScenario,
      unlockedStations: [1],
      ...data.signupData
    };
    try {
      await setFirestoreDoc(doc(db, 'users', user.uid), newState, { merge: true });
      setIsNewUser(false);
    } catch (error) {
      console.error("Failed to save player data:", error);
    }
  };

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    setPlayerState(null);
    setIsNewUser(true);
    clearCart();
    resetChallengeProgress();
  }

  if (userLoading || isFetchingPlayer) {
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
    <main className="relative w-full min-h-screen flex flex-col overflow-hidden">
      <header className="absolute top-0 left-0 right-0 p-2 sm:p-4 z-20">
        <div className="container mx-auto flex items-start justify-between gap-2">
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl flex items-center gap-3 shadow-md">
                <Logo className="h-8" />
                <div className="pr-2 hidden sm:block">
                    <h1 className="font-bold text-primary leading-tight font-kalam text-xl"></h1>
                    <p className="text-xs text-primary/80 leading-tight">
                        ¡Bienvenido, {playerState.name}!
                    </p>
                </div>
                <Avatar className="h-12 w-12 border-2 border-white">
                    <AvatarImage src={playerState.avatar} alt="Player Avatar" className="object-contain" />
                    <AvatarFallback>{playerState?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
            <div className="flex items-center gap-2">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="rounded-full bg-white/90 shadow-md h-10 w-10">
                            <Settings />
                        </Button>
                    </SheetTrigger>
                    <SettingsPanel playerState={playerState} setPlayerState={setPlayerState} onFullReset={handleResetOnboarding} />
                </Sheet>

                 <Button variant="outline" size="sm" onClick={handleLogout} className="rounded-full bg-white/90 shadow-md h-10 w-auto px-4">
                  Salir
                </Button>
                <PrizeCart />
            </div>
        </div>
      </header>

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
    </main>
  );
}
