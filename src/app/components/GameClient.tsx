
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  unlockedStations: number[];
  chosenScenario: string | null;

  // Campos de registro (opcionalmente en el estado para usarlos en el header u otros sitios)
  nombre?: string;
  apellido?: string;
  usuario?: string;
  email?: string;
  telefono?: string;
  edad?: string | number;
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
    const unsubscribe = onSnapshot(
      playerDocRef,
      (docSnap) => {
        setIsFetchingPlayer(false);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;

          // Construimos el nombre a mostrar desde los datos reales almacenados
          const displayName: string =
            (data.nombre && String(data.nombre).trim()) ||
            (data.usuario && String(data.usuario).trim()) ||
            (data.name && String(data.name).trim()) ||
            'Jugador';

          const newState: PlayerState = {
            id: user.uid,
            name: displayName,
            avatar: data.avatar || '',
            chosenScenario: data.chosenScenario || null,
            unlockedStations: data.unlockedStations || [1],

            // Campos de registro (si existen en Firestore)
            nombre: data.nombre,
            apellido: data.apellido,
            usuario: data.usuario,
            email: data.email,
            telefono: data.telefono,
            edad: data.edad,
          };

          setPlayerState((currentState) => {
            if (JSON.stringify(currentState) === JSON.stringify(newState)) {
              return currentState;
            }
            return newState;
          });

          // Si falta avatar o escenario, lo tratamos como "nuevo" para completar Onboarding visual
          if (!newState.avatar || !newState.chosenScenario) {
            setIsNewUser(true);
          } else {
            setIsNewUser(false);
          }

          const allStationsComplete = stations
            .filter(s => s.id !== 9) // Excluir la estación 9 del chequeo de completitud
            .every((s) => newState.unlockedStations?.includes(s.id));


          if (allStationsComplete) {
            setIsCompletionDialogOpen(true);
          } else {
            setIsCompletionDialogOpen(false);
          }
        } else {
          // No existe documento en Firestore -> mostrar flujo de Onboarding
          setIsNewUser(true);
        }
      },
      (error) => {
        console.error('Error fetching player state:', error);
        setIsFetchingPlayer(false);
        setIsNewUser(true);
      }
    );

    return unsubscribe;
  }, [user, db]);

  useEffect(() => {
    if (user) {
      const unsub = fetchInitialPlayerState();
      return () => {
        if (unsub) unsub();
      };
    } else {
      setPlayerState(null);
      setIsNewUser(true);
      setIsFetchingPlayer(false);
    }
  }, [user, fetchInitialPlayerState]);
  
  const handleResetOnboarding = () => {
    // Después de un reset de progreso, se vuelve a mostrar el Onboarding
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
      // Tomamos los datos existentes para NO perder nada
      const docSnap = await getDoc(playerDocRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};
      
      const { signupData, ...onboardingData } = data;

      // Partimos de lo que ya hay en Firestore
      const finalData: Record<string, any> = { ...existingData };

      // 1. Incorporar datos de registro (si vienen del SignUpForm)
      if (signupData) {
        // Mapea todos los campos del formulario de registro
        Object.assign(finalData, {
          nombre: signupData.nombre,
          apellido: signupData.apellido,
          usuario: signupData.usuario,
          email: signupData.email,
          clave: signupData.clave, // Asegúrate de guardar la clave si es necesario
          telefono: signupData.telefono,
          edad: signupData.edad,
        });
      }

      // Si no existe email en el doc y el usuario autenticado tiene email, lo rellenamos
      if (!finalData.email && user.email) {
        finalData.email = user.email;
      }

      // 2. Incorporar siempre los datos del juego (avatar, escenario, estaciones)
      Object.assign(finalData, {
        id: user.uid,
        ...onboardingData, // avatar, chosenScenario
        unlockedStations:
          Array.isArray(existingData?.unlockedStations) &&
          existingData.unlockedStations.length > 0
            ? existingData.unlockedStations
            : [1],
      });
      
      // 3. Definir `name` solo si tenemos algo real
      const derivedName: string =
        (finalData.nombre && String(finalData.nombre).trim()) ||
        (finalData.usuario && String(finalData.usuario).trim()) ||
        (finalData.name && String(finalData.name).trim()) ||
        'Jugador';
        
      finalData.name = derivedName;

      // Guardar en Firestore, fusionando con lo que ya exista.
      await setDoc(playerDocRef, finalData, { merge: true });
      
      // La actualización del estado se gestionará automáticamente por el `onSnapshot`
      // al detectar el cambio en la base de datos, no es necesario llamar a `setPlayerState` aquí.
      
      setIsNewUser(false);
  
    } catch (error) {
      console.error('Failed to save player data:', error);
      toast({
        title: 'Error al guardar',
        description:
          'No se pudo guardar tu progreso de bienvenida. Inténtalo de nuevo.',
        variant: 'destructive',
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
    return (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onLoginSuccess={fetchInitialPlayerState}
      />
    );
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
    { top: '65%', left: '12%' },
    { top: '60%', left: '32%' },
    { top: '50%', left: '45%' },
    { top: '38%', left: '55%' },
    { top: '60%', left: '65%' },
    { top: '70%', left: '80%' },
    { top: '55%', left: '88%' },
    { top: '35%', left: '75%' },
    { top: '25%', left: '90%' },
  ];
  
  const generatePath = (positions: { top: string; left: string }[]) => {
    if (positions.length < 2) return '';
    return positions
      .map((pos, index) => {
        const command = index === 0 ? 'M' : 'L';
        return `${command} ${pos.left.replace('%', '')} ${pos.top.replace('%', '')}`;
      })
      .join(' ');
  };

  const pathD = generatePath(stations.map((s) => stationPositions[s.id - 1]));

  return (
    <BackgroundImage>
      <GameHeader
        playerState={playerState}
        setPlayerState={setPlayerState}
        onFullReset={handleResetOnboarding}
      />

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
