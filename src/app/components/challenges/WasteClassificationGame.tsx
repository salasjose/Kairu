"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, PartyPopper, Recycle, Trash2, Leaf, AlertCircle, RefreshCw, Heart, X, Lock, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { WasteItem, wasteItemsData } from '@/lib/data';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { useUser } from '@/firebase';

type WasteCategory = 'recycle' | 'organic' | 'trash';

const GAME_STORAGE_KEY_PREFIX = 'kairu-waste-game-';

interface GameState {
    lives: number;
    lockoutUntil: number | null;
}

const bins = [
  { category: 'recycle', label: 'Reciclaje', icon: Recycle, color: 'text-blue-500' },
  { category: 'organic', label: 'Orgánico', icon: Leaf,    color: 'text-green-500' },
  { category: 'trash',   label: 'Basura',   icon: Trash2,  color: 'text-gray-600' },
] as const satisfies ReadonlyArray<{
  category: WasteCategory; label: string; icon: LucideIcon; color: string;
}>;


function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const GameWonScreen = ({ onBack }: { onBack: () => void }) => {
    return (
        <div className="w-full flex flex-col items-center justify-center text-center min-h-[300px]">
            <PartyPopper className="w-24 h-24 text-yellow-500 animate-bounce mb-4" />
            <h2 className="text-3xl font-bold font-headline text-primary mb-2">¡Juego Ganado!</h2>
            <p className="text-muted-foreground text-lg mb-6">¡Felicitaciones, has completado este reto!</p>
            <Button onClick={onBack} size="lg">
                <ArrowLeft className="mr-2" />
                Volver al Menú
            </Button>
        </div>
    );
};


const GameWithImages = ({ onGameWin, onBack, gameState, updateGameState }: { onGameWin: () => void; onBack: () => void; gameState: GameState, updateGameState: (newState: Partial<GameState>) => void }) => {
    const [wasteItems, setWasteItems] = useState(() => shuffle([...wasteItemsData]).slice(0, 10));
    const [animations, setAnimations] = useState<Record<WasteCategory, string>>({ recycle: '', organic: '', trash: '' });
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
    const [isTimeUp, setIsTimeUp] = useState(false);

    const currentItem = wasteItems[wasteItems.length - 1];
    const gameWon = !currentItem;

    useEffect(() => {
        if (gameWon) {
            onGameWin();
        }
    }, [gameWon, onGameWin]);
    
    useEffect(() => {
      if (gameWon || isTimeUp || gameState.lives <= 0) return;
    
      const id = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(id);
            setIsTimeUp(true);
            toast({
              title: "¡Se acabó el tiempo!",
              description: "No lograste clasificar todos los residuos. ¡Inténtalo de nuevo!",
              variant: "destructive",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    
      return () => clearInterval(id);
    }, [gameWon, isTimeUp, gameState.lives]);


    const triggerAnimation = (category: WasteCategory, type: 'correct' | 'incorrect') => {
        setAnimations(prev => ({ ...prev, [category]: type }));
        setTimeout(() => {
            setAnimations(prev => ({ ...prev, [category]: '' }));
        }, 500);
    };

    const handleSelectBin = (category: WasteCategory) => {
        if (!currentItem || isTimeUp || gameState.lives <= 0) return;

        if (currentItem.category === category) {
            setWasteItems(prevItems => prevItems.slice(0, prevItems.length - 1));
            triggerAnimation(category, 'correct');
        } else {
            const newLives = gameState.lives - 1;
            updateGameState({ lives: newLives });
            triggerAnimation(category, 'incorrect');

            if (newLives <= 0) {
                updateGameState({ lockoutUntil: Date.now() + 60 * 60 * 1000 }); // Lock for 1 hour
                toast({
                    title: "¡Has perdido!",
                    description: "Te has quedado sin vidas. El juego se bloqueará por 1 hora.",
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "¡Incorrecto!",
                    description: `Te quedan ${newLives} ${newLives === 1 ? 'vida' : 'vidas'}.`,
                    variant: "destructive",
                });
            }
        }
    };
    
    const formatTime = (seconds: number) => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
    };

    if (isTimeUp || gameState.lives <= 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center text-center min-h-[300px]">
                <AlertCircle className="w-24 h-24 text-destructive mb-4" />
                <h2 className="text-3xl font-bold font-headline text-destructive mb-2">{isTimeUp ? "¡Se acabó el tiempo!" : "¡Sin vidas!"}</h2>
                <p className="text-muted-foreground text-lg mb-6">No te preocupes, la práctica hace al maestro.</p>
                <Button onClick={onBack} size="lg">
                    <ArrowLeft className="mr-2" />
                    Volver al Menú del Reto
                </Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center">
             <div className="mb-6 text-center w-full flex justify-between items-center px-4">
                <div className="flex gap-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        i < gameState.lives ? <Heart key={i} className="w-6 h-6 text-red-500 fill-current" /> : <Heart key={i} className="w-6 h-6 text-gray-300" />
                    ))}
                </div>
                <div className="text-2xl font-bold text-primary tabular-nums">
                    {formatTime(timeLeft)}
                </div>
             </div>

            <div className="relative mb-8 h-48 w-48 flex items-center justify-center">
                <AnimatePresence>
                {currentItem && (
                    <motion.div
                        key={currentItem.id}
                        className="absolute p-2 bg-card border rounded-lg shadow-lg text-center"
                        initial={{ y: -50, opacity: 0, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Image src={currentItem.imageUrl} alt={currentItem.name} width={150} height={150} className="object-contain rounded-md" />
                        <p className="font-semibold text-base mt-2">{currentItem.name}</p>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            <div className="grid grid-cols-3 gap-4 md:gap-6 w-full">
                {bins.map(({ category, label, icon: Icon, color }) => (
                <button
                    key={category}
                    onClick={() => handleSelectBin(category)}
                    aria-label={`Depositar en ${label}`}
                    className={cn(
                    "p-4 md:p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300 hover:border-primary hover:bg-accent",
                    animations[category] === 'correct' && 'border-green-500 bg-green-500/20',
                    animations[category] === 'incorrect' && 'animate-shake border-destructive bg-destructive/20'
                    )}
                >
                    <Icon className={cn("w-12 h-12 md:w-16 md:h-16 mb-2", color)} />
                    <h3 className="text-lg md:text-xl font-bold text-center">{label}</h3>
                </button>
                ))}
            </div>
        </div>
    );
};

// New data for the drag-and-drop game
const dragAndDropWasteItems: { name: string; category: WasteCategory }[] = [
  // Reciclables
  { name: 'Frasco de mermelada (vidrio)', category: 'recycle' },
  { name: 'Revista', category: 'recycle' },
  { name: 'Caja de cereal', category: 'recycle' },
  { name: 'Tubo de cartón (papel higiénico)', category: 'recycle' },
  { name: 'Envase de detergente', category: 'recycle' },
  { name: 'Hojas de papel bond/archivo', category: 'recycle' },
  { name: 'Bandeja de aluminio limpia', category: 'recycle' },
  { name: 'Folleto publicitario', category: 'recycle' },
  { name: 'Tapa plástica', category: 'recycle' },
  { name: 'Bolsa plástica limpia', category: 'recycle' },
  // Orgánicos
  { name: 'Bolsita de té', category: 'organic' },
  { name: 'Cáscara de papa', category: 'organic' },
  { name: 'Restos de pan', category: 'organic' },
  { name: 'Semilla de aguacate', category: 'organic' },
  { name: 'Flores marchitas', category: 'organic' },
  { name: 'Corazón de piña', category: 'organic' },
  { name: 'Aserrín de madera natural', category: 'organic' },
  { name: 'Restos de lechuga', category: 'organic' },
  { name: 'Cáscara de sandía', category: 'organic' },
  { name: 'Pelo o cabello', category: 'organic' },
  // No Reciclables (Basura)
  { name: 'Icopor (Poliestireno)', category: 'trash' },
  { name: 'Colilla de cigarrillo', category: 'trash' },
  { name: 'Caja de pizza con grasa', category: 'trash' },
  { name: 'Cepillo de dientes', category: 'trash' },
  { name: 'Espejo roto', category: 'trash' },
  { name: 'Recibo de caja (papel térmico)', category: 'trash' },
  { name: 'Cuchilla de afeitar', category: 'trash' },
  { name: 'Curita o venda', category: 'trash' },
  { name: 'Esponja de lavar platos', category: 'trash' },
  { name: 'Tubo de pasta dental', category: 'trash' },
];

const GameDragAndDrop = ({ onGameWin, onBack, gameState, updateGameState }: { onGameWin: () => void; onBack: () => void; gameState: GameState, updateGameState: (newState: Partial<GameState>) => void; }) => {
  const [wasteItems, setWasteItems] = useState(() => shuffle([...dragAndDropWasteItems]).slice(0, 15));
  const [correctlySorted, setCorrectlySorted] = useState(0);
  const [animations, setAnimations] = useState<Record<WasteCategory, string>>({ recycle: '', organic: '', trash: '' });
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  const currentItem = wasteItems[0];
  const gameWon = correctlySorted >= 15;
  
  useEffect(() => {
    if (gameWon || gameState.lives <= 0 || timeLeft <= 0) return;
    const timer = setInterval(() => {
        setTimeLeft(prev => {
            if (prev <= 1) {
                clearInterval(timer);
                updateGameState({ lockoutUntil: Date.now() + 5 * 60 * 1000 }); // Lock for 5 minutes
                return 0;
            }
            return prev - 1;
        });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameWon, gameState.lives, timeLeft, updateGameState]);

  useEffect(() => {
    if (gameWon) {
      onGameWin();
    }
  }, [gameWon, onGameWin]);

  const triggerAnimation = (category: WasteCategory, type: 'correct' | 'incorrect') => {
    setAnimations(prev => ({ ...prev, [category]: type }));
    setTimeout(() => {
        setAnimations(prev => ({ ...prev, [category]: '' }));
    }, 500);
  }

  const handleDrop = (category: WasteCategory) => {
    if (!currentItem || gameState.lives <= 0 || timeLeft <= 0) return;

    if (currentItem.category === category) {
      setCorrectlySorted(prev => prev + 1);
      setWasteItems(prevItems => prevItems.slice(1));
      triggerAnimation(category, 'correct');
    } else {
      const newLives = gameState.lives - 1;
      updateGameState({ lives: newLives });
      triggerAnimation(category, 'incorrect');
      toast({
        title: "¡Ups! Contenedor incorrecto",
        description: `"${currentItem.name}" no va ahí. Te queda${newLives === 1 ? '' : 'n'} ${newLives} vida${newLives === 1 ? '' : 's'}.`,
        variant: "destructive",
      });
      if (newLives <= 0) {
        updateGameState({ lockoutUntil: Date.now() + 5 * 60 * 1000 }); // Lock for 5 minutes
      } else {
         // Move the incorrect item to a random position in the remaining list
        setWasteItems(prev => {
            const remaining = prev.slice(1);
            const indexToInsert = Math.floor(Math.random() * (remaining.length + 1));
            remaining.splice(indexToInsert, 0, currentItem);
            return remaining;
        });
      }
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

   if (gameState.lives <= 0 || timeLeft <= 0) {
        return (
            <div className="w-full flex flex-col items-center justify-center text-center min-h-[300px]">
                <AlertCircle className="w-24 h-24 text-destructive mb-4" />
                <h2 className="text-3xl font-bold font-headline text-destructive mb-2">{timeLeft <= 0 ? "¡Se acabó el tiempo!" : "¡Sin vidas!"}</h2>
                <p className="text-muted-foreground text-lg mb-6">El reto se bloqueará por 5 minutos.</p>
                <Button onClick={onBack} size="lg">
                    <ArrowLeft className="mr-2" />
                    Volver al Menú del Reto
                </Button>
            </div>
        )
    }
  
  return (
    <div className="flex flex-col items-center">
        <div className="mb-6 text-center w-full flex justify-between items-center px-4">
            <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                    i < gameState.lives ? <Heart key={i} className="w-6 h-6 text-red-500 fill-current" /> : <Heart key={i} className="w-6 h-6 text-gray-300" />
                ))}
            </div>
             <div className="flex-1 text-center">
                <p className="text-lg font-bold">Progreso: <span className="text-primary">{correctlySorted} / 15</span></p>
            </div>
            <div className="text-2xl font-bold text-primary tabular-nums">
                {formatTime(timeLeft)}
            </div>
        </div>

      <div className="relative mb-8 h-24 w-64 flex items-center justify-center">
        <AnimatePresence>
          {currentItem && (
            <motion.div
              key={currentItem.name} // Use name as key since list is shuffled
              drag
              dragConstraints={{ left: -150, right: 150, top: -80, bottom: 80 }}
              dragSnapToOrigin
              onDragEnd={(event, info) => {
                 const yOffset = info.offset.y;
                 const xOffset = info.offset.x;

                 if (yOffset > 100) { 
                    if (xOffset < -50) handleDrop('recycle');
                    else if (xOffset > 50) handleDrop('trash');
                    else handleDrop('organic');
                 }
              }}
              className="absolute p-4 bg-card border rounded-lg shadow-lg cursor-grab active:cursor-grabbing text-center"
              initial={{ y: -50, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 50, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <p className="font-semibold text-lg">{currentItem.name}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-4 md:gap-6 w-full">
        {bins.map(({ category, label, icon: Icon, color }) => (
          <div
            key={category}
            className={cn(
              "p-4 md:p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300",
              animations[category] === 'correct' && 'border-green-500 bg-green-500/20',
              animations[category] === 'incorrect' && 'animate-shake border-destructive bg-destructive/20'
            )}
          >
            <Icon className={cn("w-12 h-12 md:w-16 md:h-16 mb-2", color)} />
            <h3 className="text-lg md:text-xl font-bold text-center">{label}</h3>
          </div>
        ))}
      </div>
    </div>
  );
}


export default function WasteClassificationGameContainer({ gameId, onComplete, onBack }: { gameId: string; onComplete: () => void; onBack: () => void; }) {
  const { user } = useUser();
  const storageKey = user ? `${GAME_STORAGE_KEY_PREFIX}${gameId}-${user.uid}` : null;
  
  const [pageState, setPageState] = useState<'playing' | 'won' | 'locked'>('playing');
  const [key, setKey] = useState(0); 
  const [gameState, setGameState] = useState<GameState>({ lives: 3, lockoutUntil: null });
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<string>("");

  const updateGameState = useCallback((newState: Partial<GameState>) => {
    setGameState(prev => {
        const updatedState = { ...prev, ...newState };
        if (storageKey) {
            localStorage.setItem(storageKey, JSON.stringify(updatedState));
        }
        return updatedState;
    });
  }, [storageKey]);

  useEffect(() => {
    if (storageKey) {
        const savedState = localStorage.getItem(storageKey);
        if (savedState) {
            const parsedState: GameState = JSON.parse(savedState);
            if (parsedState.lockoutUntil && parsedState.lockoutUntil > Date.now()) {
                setGameState(parsedState);
                setPageState('locked');
            } else {
                 updateGameState({ lives: 3, lockoutUntil: null });
            }
        } else {
            localStorage.setItem(storageKey, JSON.stringify({ lives: 3, lockoutUntil: null }));
        }
    }
  }, [storageKey, key, updateGameState]);

  const formatLockoutTime = (ms: number) => {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  useEffect(() => {
    if (pageState !== 'locked') return;

    const interval = setInterval(() => {
        if (gameState.lockoutUntil) {
            const timeLeftMs = gameState.lockoutUntil - Date.now();
            if (timeLeftMs <= 0) {
                setPageState('playing');
                updateGameState({ lives: 3, lockoutUntil: null });
                clearInterval(interval);
            } else {
                setLockoutTimeLeft(formatLockoutTime(timeLeftMs));
            }
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [pageState, gameState.lockoutUntil, updateGameState]);


  const handleGameWin = useCallback(() => {
    setPageState('won');
    onComplete();
  }, [onComplete]);

  const handleRestart = useCallback(() => {
    setPageState('playing');
    setKey(prevKey => prevKey + 1);
    updateGameState({lives: 3, lockoutUntil: null});
  }, [updateGameState]);

  if (pageState === 'won') {
      return <GameWonScreen onBack={onBack} />;
  }


  if (pageState === 'locked') {
    const lockoutMinutes = gameId === 'game-classify' ? 60 : 5;
    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center min-h-[400px]">
            <Lock className="w-24 h-24 text-destructive mb-4" />
            <h2 className="text-3xl font-bold font-headline text-destructive mb-2">Juego Bloqueado</h2>
            <p className="text-muted-foreground text-lg mb-2">Has perdido todas tus vidas.</p>
            <p className="text-muted-foreground text-lg mb-6">Vuelve a intentarlo en: <span className="font-bold text-xl tabular-nums">{lockoutTimeLeft}</span></p>
            <Button onClick={onBack}>Volver al menú</Button>
        </div>
    )
  }

  const isDragAndDrop = gameId === 'game-drag-and-drop';
  const gameInfo = {
    title: isDragAndDrop ? 'Arrastra y Recicla' : 'Clasificación por Imagen',
    GameComponent: isDragAndDrop ? GameDragAndDrop : GameWithImages,
    description: isDragAndDrop ? 'Arrastra cada residuo al contenedor correcto. Tienes 3 minutos y 3 vidas.' : 'Clasifica 10 residuos con imágenes antes de que se acabe el tiempo. ¡Cuidado, solo tienes 3 vidas!',
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al menú
        </Button>
        <h2 className="text-2xl md:text-3xl font-bold text-primary font-headline text-center">{gameInfo.title}</h2>
        <Button onClick={handleRestart} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reiniciar
        </Button>
      </div>
      <gameInfo.GameComponent
          key={key}
          onGameWin={handleGameWin}
          onBack={onBack}
          gameState={gameState}
          updateGameState={updateGameState}
        />
    </div>
  );
}
