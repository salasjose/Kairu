"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, PartyPopper, Recycle, Trash2, Leaf, AlertCircle, RefreshCw, Heart, X, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { WasteItem, wasteItemsData } from '@/lib/data';
import Image from 'next/image';

type WasteCategory = 'recycle' | 'organic' | 'trash';

const GAME_STORAGE_KEY_PREFIX = 'kairu-waste-game-';

interface GameState {
    lives: number;
    lockoutUntil: number | null;
}

const bins: { category: WasteCategory; label: string; icon: React.ElementType; color: string }[] = [
  { category: 'recycle', label: 'Reciclaje', icon: Recycle, color: 'text-blue-500' },
  { category: 'organic', label: 'Orgánico', icon: Leaf, color: 'text-green-500' },
  { category: 'trash', label: 'Basura', icon: Trash2, color: 'text-gray-600' },
];

const GameWithImages = ({ onGameWin, onRestartRequest, gameState, updateGameState }: { onGameWin: () => void; onRestartRequest: () => void; gameState: GameState, updateGameState: (newState: Partial<GameState>) => void }) => {
    const [wasteItems, setWasteItems] = useState(() => [...wasteItemsData].sort(() => Math.random() - 0.5));
    const [animations, setAnimations] = useState<Record<WasteCategory, string>>({ recycle: '', organic: '', trash: '' });
    const [timeLeft, setTimeLeft] = useState(180); // 3 minutes
    const [isTimeUp, setIsTimeUp] = useState(false);

    const currentItem = wasteItems[wasteItems.length - 1];
    const gameWon = !currentItem;

    useEffect(() => {
        if (gameWon) {
            toast({ title: "¡Reto Superado!", description: "Has clasificado todos los residuos. ¡Prepárate para el siguiente reto!" });
            onGameWin();
        }
    }, [gameWon, onGameWin]);
    
    useEffect(() => {
      if (gameWon || isTimeUp || gameState.lives <= 0) return;
      if (timeLeft > 0) {
        const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
        return () => clearTimeout(timerId);
      } else {
        setIsTimeUp(true);
        toast({
          title: "¡Se acabó el tiempo!",
          description: "No lograste clasificar todos los residuos. ¡Inténtalo de nuevo!",
          variant: "destructive",
        });
      }
    }, [timeLeft, gameWon, isTimeUp, gameState.lives]);


    const triggerAnimation = (category: WasteCategory, type: 'correct' | 'incorrect') => {
        setAnimations(prev => ({ ...prev, [category]: type }));
        setTimeout(() => {
            setAnimations(prev => ({ ...prev, [category]: '' }));
        }, 500);
    };

    const handleSelectBin = (category: WasteCategory) => {
        if (!currentItem || gameState.lives <= 0) return;

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

    if (isTimeUp) {
        return (
            <div className="w-full flex flex-col items-center justify-center text-center min-h-[300px]">
                <AlertCircle className="w-24 h-24 text-destructive mb-4" />
                <h2 className="text-3xl font-bold font-headline text-destructive mb-2">¡Se acabó el tiempo!</h2>
                <p className="text-muted-foreground text-lg mb-6">No te preocupes, la práctica hace al maestro.</p>
                <Button onClick={onRestartRequest} size="lg">
                    <RefreshCw className="mr-2" />
                    Volver a Intentar
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

const GameDragAndDrop = ({ onGameWin, onRestartRequest }: { onGameWin: () => void; onRestartRequest: () => void; }) => {
  const [wasteItems, setWasteItems] = useState(() => [...wasteItemsData].sort(() => Math.random() - 0.5).slice(0, 20));
  const [animations, setAnimations] = useState<Record<WasteCategory, string>>({ recycle: '', organic: '', trash: '' });
  
  const currentItem = wasteItems[wasteItems.length - 1];
  const gameWon = !currentItem;
  
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
    if (!currentItem) return;

    if (currentItem.category === category) {
      setWasteItems(prevItems => prevItems.slice(0, prevItems.length - 1));
      triggerAnimation(category, 'correct');
    } else {
      toast({
        title: "¡Ups! Contenedor incorrecto",
        description: `"${currentItem.name}" no va en la caneca de ${bins.find(b => b.category === category)?.label}.`,
        variant: "destructive",
      });
      triggerAnimation(category, 'incorrect');
      // Shuffle the item back in
      setWasteItems(prev => [...prev.slice(0, prev.length - 1)].sort(() => Math.random() - 0.5).concat(currentItem));
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 text-center">
        <p className="text-muted-foreground mt-2">Como Guardián del Planeta, tu misión es dar el destino correcto a cada residuo.</p>
      </div>

      <div className="relative mb-8 h-24 w-64 flex items-center justify-center">
        <AnimatePresence>
          {currentItem && (
            <motion.div
              key={currentItem.id}
              drag
              dragConstraints={{ left: -150, right: 150, top: -80, bottom: 80 }}
              dragSnapToOrigin
              onDragEnd={(event, info) => {
                 const yOffset = info.offset.y;
                 const xOffset = info.offset.x;
                 const binWidth = (window.innerWidth / 3);

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
       <div className="mt-8 text-center text-sm text-muted-foreground">
        <p><b>Pistas:</b> Observa bien los materiales. ¿Plástico limpio o sucio? ¿Vegetal o no vegetal?</p>
        <p>No te apresures, una clasificación equivocada te hace perder tiempo.</p>
       </div>
    </div>
  );
}


export default function WasteClassificationGameContainer({ gameId, onComplete, onBack }: { gameId: string; onComplete: () => void; onBack: () => void; }) {
  const [pageState, setPageState] = useState<'playing' | 'won' | 'locked'>('playing');
  const [key, setKey] = useState(0); 
  const [gameState, setGameState] = useState<GameState>({ lives: 3, lockoutUntil: null });
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState<string>("");

  const storageKey = `${GAME_STORAGE_KEY_PREFIX}${gameId}`;

  const updateGameState = useCallback((newState: Partial<GameState>) => {
    setGameState(prev => {
        const updatedState = { ...prev, ...newState };
        localStorage.setItem(storageKey, JSON.stringify(updatedState));
        return updatedState;
    });
  }, [storageKey]);

  useEffect(() => {
    const savedState = localStorage.getItem(storageKey);
    if (savedState) {
        const parsedState: GameState = JSON.parse(savedState);
        setGameState(parsedState);
        if (parsedState.lockoutUntil && parsedState.lockoutUntil > Date.now()) {
            setPageState('locked');
        }
    } else {
        localStorage.setItem(storageKey, JSON.stringify({ lives: 3, lockoutUntil: null }));
    }
  }, [storageKey, key]);

  useEffect(() => {
    if (pageState !== 'locked') return;

    const interval = setInterval(() => {
        if (gameState.lockoutUntil) {
            const timeLeft = Math.max(0, gameState.lockoutUntil - Date.now());
            if (timeLeft === 0) {
                setPageState('playing');
                updateGameState({ lives: 3, lockoutUntil: null });
                clearInterval(interval);
            }
            const hours = Math.floor((timeLeft / (1000 * 60 * 60)) % 24).toString().padStart(2, '0');
            const minutes = Math.floor((timeLeft / 1000 / 60) % 60).toString().padStart(2, '0');
            const seconds = Math.floor((timeLeft / 1000) % 60).toString().padStart(2, '0');
            setLockoutTimeLeft(`${hours}:${minutes}:${seconds}`);
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [pageState, gameState.lockoutUntil, updateGameState]);

  useEffect(() => {
    if (gameState.lockoutUntil && gameState.lockoutUntil > Date.now()) {
        setPageState('locked');
    } else if (gameState.lives <= 0) {
        // If lockout expired but lives are still 0, reset
        updateGameState({ lives: 3, lockoutUntil: null });
    }
  }, [gameState, updateGameState]);


  const handleGameWin = useCallback(() => {
    setPageState('won');
    if (gameId === 'drag-and-drop') {
      toast({
          title: "¡Reto Superado!",
          description: "Has clasificado todos los residuos correctamente. ¡Eres un experto en reciclaje!",
      });
    }
  }, [gameId]);

  const handleRestart = useCallback(() => {
    setPageState('playing');
    setKey(prevKey => prevKey + 1);
    updateGameState({lives: 3, lockoutUntil: null});
  }, [updateGameState]);

  if (pageState === 'locked') {
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

  if (pageState === 'won') {
    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center min-h-[400px]">
            <PartyPopper className="w-24 h-24 text-yellow-500 animate-bounce mb-4" />
            <h2 className="text-4xl font-bold font-headline text-primary mb-2">¡Ganaste!</h2>
            <p className="text-muted-foreground text-lg mb-6">Demostraste ser un verdadero Guardián del Planeta.</p>
            <div className='flex gap-4'>
                <Button onClick={handleRestart} variant="outline" size="lg">
                    <RefreshCw className="mr-2" />
                    Jugar de Nuevo
                </Button>
                <Button onClick={onComplete} size="lg">
                    <CheckCircle className="mr-2" />
                    Continuar Aventura
                </Button>
            </div>
        </div>
    )
  }

  const gameTitle = gameId === 'classify' ? "Clasificación por Imagen" : "Arrastra y Recicla";

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al menú
        </Button>
        <h2 className="text-2xl md:text-3xl font-bold text-primary font-headline text-center">{gameTitle}</h2>
        <Button onClick={handleRestart} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reiniciar
        </Button>
      </div>
      {gameId === 'classify' ? (
        <GameWithImages
          key={key}
          onGameWin={handleGameWin}
          onRestartRequest={handleRestart}
          gameState={gameState}
          updateGameState={updateGameState}
        />
      ) : (
        <GameDragAndDrop
          key={key}
          onGameWin={handleGameWin}
          onRestartRequest={handleRestart}
        />
      )}
    </div>
  );
}
