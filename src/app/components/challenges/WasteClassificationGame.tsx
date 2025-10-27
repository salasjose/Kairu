"use client";

import { useState, useMemo, useEffect } from 'react';
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
  { category: 'recycle', label: 'Reciclaje', icon: Recycle, color: 'bg-blue-500' },
  { category: 'organic', label: 'Orgánico', icon: Leaf, color: 'bg-green-500' },
  { category: 'trash', label: 'Basura', icon: Trash2, color: 'bg-gray-600' },
];

export default function WasteClassificationGame({ onComplete, onBack }: { onComplete: () => void; onBack: () => void; }) {
  const [wasteItems, setWasteItems] = useState(() => [...initialWasteItems].sort(() => Math.random() - 0.5));
  const [draggedItem, setDraggedItem] = useState<WasteItem | null>(null);
  const [animations, setAnimations] = useState<Record<WasteCategory, string>>({ recycle: '', organic: '', trash: '' });
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes in seconds
  const [isTimeUp, setIsTimeUp] = useState(false);


  const remainingItems = useMemo(() => wasteItems.filter(item => item), [wasteItems]);
  const gameWon = remainingItems.length === 0;

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


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, item: WasteItem) => {
    setDraggedItem(item);
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    e.dataTransfer.setData('text/plain', item.id.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const triggerAnimation = (category: WasteCategory, type: 'correct' | 'incorrect') => {
    setAnimations(prev => ({ ...prev, [category]: type }));
    setTimeout(() => {
        setAnimations(prev => ({ ...prev, [category]: '' }));
    }, 500);
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, category: WasteCategory) => {
    e.preventDefault();
    if (!draggedItem) return;

    if (draggedItem.category === category) {
      setWasteItems(prevItems => prevItems.filter(item => item.id !== draggedItem.id));
      triggerAnimation(category, 'correct');
    } else {
      toast({
        title: "¡Ups! Contenedor incorrecto",
        description: `"${draggedItem.name}" no va en la caneca de ${bins.find(b => b.category === category)?.label}.`,
        variant: "destructive",
      });
      triggerAnimation(category, 'incorrect');
    }
    setDraggedItem(null);
  };
  
  const handleRestart = () => {
    setWasteItems([...initialWasteItems].sort(() => Math.random() - 0.5));
    setTimeLeft(180);
    setIsTimeUp(false);
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (gameWon) {
    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center min-h-[400px]">
            <PartyPopper className="w-24 h-24 text-yellow-500 animate-bounce mb-4" />
            <h2 className="text-4xl font-bold font-headline text-primary mb-2">¡Ganaste!</h2>
            <p className="text-muted-foreground text-lg mb-6">Has clasificado todos los residuos correctamente. ¡Eres un experto en reciclaje!</p>
            <Button onClick={onComplete} size="lg">
                <CheckCircle className="mr-2" />
                Completar y reclamar premio
            </Button>
        </div>
    )
  }
  
  if (isTimeUp) {
    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center min-h-[400px]">
            <AlertCircle className="w-24 h-24 text-destructive mb-4" />
            <h2 className="text-4xl font-bold font-headline text-destructive mb-2">¡Se acabó el tiempo!</h2>
            <p className="text-muted-foreground text-lg mb-6">No te preocupes, la práctica hace al maestro. ¿Quieres intentarlo de nuevo?</p>
            <Button onClick={handleRestart} size="lg">
                <RefreshCw className="mr-2" />
                Volver a Intentar
            </Button>
        </div>
    )
  }


  return (
    <div className="w-full max-w-5xl mx-auto p-4">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al menú de juegos
        </Button>
        <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-primary font-headline">Juego de Clasificación</h2>
            <p className="text-muted-foreground">Arrastra cada residuo al contenedor correcto.</p>
            <div className="mt-4 text-2xl font-bold text-primary tabular-nums">
                Tiempo Restante: {formatTime(timeLeft)}
            </div>
        </div>

        {/* Waste Items */}
        <div className="mb-8 min-h-[80px] flex flex-wrap gap-3 justify-center items-center p-4 bg-muted/50 rounded-lg">
             <AnimatePresence>
                {remainingItems.map(item => (
                    <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3 }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item)}
                        onDragEnd={() => setDraggedItem(null)}
                        className="p-3 bg-card border rounded-lg shadow-sm cursor-grab active:cursor-grabbing"
                    >
                       {item.name}
                    </motion.div>
                ))}
             </AnimatePresence>
        </div>

        {/* Bins */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {bins.map(({ category, label, icon: Icon, color }) => (
                <div
                    key={category}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, category)}
                    className={cn(
                        "p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all duration-300",
                        animations[category] === 'correct' && 'animate-pulse border-green-500 bg-green-500/20',
                        animations[category] === 'incorrect' && 'animate-shake border-destructive bg-destructive/20'
                    )}
                >
                    <Icon className={cn("w-16 h-16 mb-2", color.replace('bg-', 'text-'))} />
                    <h3 className="text-xl font-bold">{label}</h3>
                </div>
            ))}
        </div>
    </div>
  );
}
