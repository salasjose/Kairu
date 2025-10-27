"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, PartyPopper, Recycle, Trash2, Leaf, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

type WasteCategory = 'recycle' | 'organic' | 'trash';

interface WasteItem {
  id: number;
  name: string;
  category: WasteCategory;
}

const initialWasteItems: WasteItem[] = [
  { id: 1, name: 'Botella plástica', category: 'recycle' },
  { id: 2, name: 'Cáscara de banano', category: 'organic' },
  { id: 3, name: 'Papel higiénico usado', category: 'trash' },
  { id: 4, name: 'Caja de cartón', category: 'recycle' },
  { id: 5, name: 'Restos de manzana', category: 'organic' },
  { id: 6, name: 'Lata de refresco', category: 'recycle' },
  { id: 7, name: 'Pañal desechable', category: 'trash' },
  { id: 8, name: 'Periódico', category: 'recycle' },
  { id: 9, name: 'Bolsa de papas fritas', category: 'trash'},
  { id: 10, name: 'Hojas de jardín', category: 'organic' },
];

const bins: { category: WasteCategory; label: string; icon: React.ElementType; color: string }[] = [
  { category: 'recycle', label: 'Reciclaje', icon: Recycle, color: 'text-blue-500' },
  { category: 'organic', label: 'Orgánico', icon: Leaf, color: 'text-green-500' },
  { category: 'trash', label: 'Basura', icon: Trash2, color: 'text-gray-600' },
];

const Game = ({ onGameWin, onRestartRequest }: { onGameWin: () => void; onRestartRequest: () => void; }) => {
  const [wasteItems, setWasteItems] = useState(() => [...initialWasteItems].sort(() => Math.random() - 0.5));
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
    if (gameWon || isTimeUp) return;
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
  }, [timeLeft, gameWon, isTimeUp]);

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
      <div className="mb-6 text-center">
        <div className="text-2xl font-bold text-primary tabular-nums">
            Tiempo Restante: {formatTime(timeLeft)}
        </div>
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
                 if (yOffset > 100) { // Dropped on the bins area
                    const xOffset = info.offset.x;
                    const binWidth = window.innerWidth / 3;
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

export default function WasteClassificationGameContainer({ onComplete, onBack }: { onComplete: () => void; onBack: () => void; }) {
  const [gameState, setGameState] = useState<'playing' | 'won'>('playing');
  const [key, setKey] = useState(0); // Used to force-remount the Game component on restart

  const handleGameWin = useCallback(() => {
    setGameState('won');
    toast({
        title: "¡Reto Superado!",
        description: "Has clasificado todos los residuos correctamente. ¡Eres un experto en reciclaje!",
    });
  }, []);

  const handleRestart = useCallback(() => {
    setGameState('playing');
    setKey(prevKey => prevKey + 1);
  }, []);

  if (gameState === 'won') {
    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center min-h-[400px]">
            <PartyPopper className="w-24 h-24 text-yellow-500 animate-bounce mb-4" />
            <h2 className="text-4xl font-bold font-headline text-primary mb-2">¡Ganaste!</h2>
            <p className="text-muted-foreground text-lg mb-6">Eres un verdadero Guardián del Planeta.</p>
            <div className='flex gap-4'>
                <Button onClick={handleRestart} variant="outline" size="lg">
                    <RefreshCw className="mr-2" />
                    Jugar de Nuevo
                </Button>
                <Button onClick={onComplete} size="lg">
                    <CheckCircle className="mr-2" />
                    Completar y Reclamar Premio
                </Button>
            </div>
        </div>
    )
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al menú
        </Button>
        <h2 className="text-2xl md:text-3xl font-bold text-primary font-headline text-center">Clasifica tus Residuos</h2>
        <Button onClick={handleRestart} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Reiniciar
        </Button>
      </div>
      <Game key={key} onGameWin={handleGameWin} onRestartRequest={handleRestart} />
    </div>
  );
}
