
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
  name: string; // Este es el `displayName`
  avatar: string;
  unlockedStations: number[];
  chosenScenario: string | null;

  // Campos de registro
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
    
    // onSnapshot escucha cambios en tiempo real
    const unsubscribe = onSnapshot(
      playerDocRef,
      (docSnap) => {
        setIsFetchingPlayer(false);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;

          const displayName: string =
            (data.nombre && String(data.nombre).trim()) ||
            (data.usuario && String(data.usuario).trim()) ||
            'Jugador';

          const newState: PlayerState = {
            id: user.uid,
            name: displayName,
            avatar: data.avatar || '',
            chosenScenario: data.chosenScenario || null,
            unlockedStations: data.unlockedStations || [1],
            // Copiamos todos los campos del perfil
            nombre: data.nombre,
            apellido: data.apellido,
            usuario: data.usuario,
            email: data.email,
            telefono: data.telefono,
            edad: data.edad,
          };

          setPlayerState((currentState) => {
            // Evita re-renders innecesarios si el estado no ha cambiado
            if (JSON.stringify(currentState) === JSON.stringify(newState)) {
              return currentState;
            }
            return newState;
          });

          // Si falta avatar o escenario, lo tratamos como "nuevo" para completar Onboarding
          if (!newState.avatar || !newState.chosenScenario) {
            setIsNewUser(true);
          } else {
            setIsNewUser(false);
          }

          const allStationsComplete = stations
            .filter(s => s.id !== 9)
            .every((s) => newState.unlockedStations?.includes(s.id));

          if (allStationsComplete) {
            setIsCompletionDialogOpen(true);
          } else {
            setIsCompletionDialogOpen(false);
          }

        } else {
          // El documento no existe, es un usuario nuevo que necesita completar el registro.
          setIsNewUser(true);
        }
      },
      (error) => {
        console.error('Error fetching player state:', error);
        setIsFetchingPlayer(false);
        setIsNewUser(true); // Si hay un error, mostramos el onboarding
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
      // Si no hay usuario, reseteamos todo el estado local.
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
    avatar?: string;
    chosenScenario?: string;
    signupData?: z.infer<typeof SignUpFormSchema>;
  }) => {
    if (!user || !db) return;
  
    const playerDocRef = doc(db, 'users', user.uid);
  
    try {
      const finalData: Record<string, any> = {};

      // Caso 1: Es un registro nuevo. Se guardan todos los datos del formulario.
      if (data.signupData) {
        Object.assign(finalData, {
          id: user.uid,
          ...data.signupData,
          unlockedStations: [1], // Estado inicial del juego
        });
      }
      
      // Caso 2: Es un usuario existente que está completando el flujo (eligiendo avatar/lienzo).
      // O un nuevo usuario que acaba de registrarse y ahora está eligiendo avatar/lienzo.
      if (data.avatar && data.chosenScenario) {
        Object.assign(finalData, {
          avatar: data.avatar,
          chosenScenario: data.chosenScenario,
        });
      }
      
      // Si no tenemos un nombre derivado de los datos de registro, usamos el del usuario de Auth
      if (!finalData.nombre && !finalData.usuario) {
          const derivedName: string =
            (playerState?.nombre && String(playerState.nombre).trim()) ||
            (playerState?.usuario && String(playerState.usuario).trim()) ||
            'Jugador';
          finalData.name = derivedName;
      } else {
          finalData.name = finalData.nombre || finalData.usuario;
      }


      // Guardar en Firestore, fusionando con lo que ya exista.
      // Esto es clave para no borrar datos si se llama a la función en diferentes momentos.
      await setDoc(playerDocRef, finalData, { merge: true });
      
      // La actualización del estado se gestionará automáticamente por el `onSnapshot`
      // al detectar el cambio en la base de datos.
      
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
  
  // Si es un nuevo usuario (sin avatar/lienzo o sin documento), mostramos el Onboarding.
  if (isNewUser) {
    return (
      <OnboardingFlow
        onComplete={handleOnboardingComplete}
        onLoginSuccess={fetchInitialPlayerState}
      />
    );
  }
  
  // Si después de todo no hay estado de jugador, mostramos una carga final.
  if (!playerState) {
    return (
      <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background/80 backdrop-blur-sm">
        <Logo className="h-24 animate-pulse" />
        <p className="text-primary/70 mt-4">Cargando mapa...</p>
      </main>
    );
  }

  // Posiciones de las estaciones en el mapa
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
