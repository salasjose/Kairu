"use client";

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, PartyPopper, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

const wordsToFind = ['RECICLAR', 'FAUNA', 'FLORA', 'AGUA', 'SUELO', 'BOSQUE', 'SOL', 'COMPOST'];

const grid = [
  ['E', 'C', 'O', 'S', 'I', 'S', 'T', 'E', 'M', 'A'],
  ['L', 'R', 'E', 'C', 'I', 'C', 'L', 'A', 'R', 'G'],
  ['O', 'F', 'A', 'U', 'N', 'A', 'X', 'B', 'C', 'U'],
  ['S', 'L', 'O', 'R', 'R', 'I', 'O', 'S', 'O', 'A'],
  ['Z', 'O', 'C', 'B', 'M', 'O', 'V', 'Q', 'M', 'S'],
  ['B', 'R', 'S', 'Q', 'U', 'E', 'Y', 'Z', 'P', 'U'],
  ['J', 'A', 'U', 'E', 'L', 'O', 'L', 'F', 'O', 'E'],
  ['K', 'A', 'E', 'L', 'C', 'S', 'A', 'W', 'S', 'L'],
  ['N', 'G', 'L', 'P', 'O', 'D', 'R', 'A', 'T', 'O'],
  ['S', 'O', 'L', 'A', 'M', 'B', 'I', 'E', 'N', 'T'],
];

const WordSearchGame = ({ onComplete, onBack }: { onComplete: () => void; onBack: () => void; gameId: string }) => {
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<[number, number][]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(240);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setGameState('lost');
      toast({ title: "¡Se acabó el tiempo!", variant: "destructive" });
    }
  }, [timeLeft, gameState]);

  useEffect(() => {
    if (foundWords.length === wordsToFind.length) {
      setGameState('won');
      toast({ title: "¡Ganaste!", description: "Has encontrado todas las palabras." });
    }
  }, [foundWords]);

  const startSelection = (r: number, c: number) => {
    if (gameState !== 'playing') return;
    setIsSelecting(true);
    setSelectedCells([[r, c]]);
  };

  const moveSelection = (r: number, c: number) => {
    if (!isSelecting || gameState !== 'playing') return;
    
    const startCell = selectedCells[0];
    const newSelection: [number, number][] = [startCell];
    const dr = Math.sign(r - startCell[0]);
    const dc = Math.sign(c - startCell[1]);

    // Only allow straight or diagonal lines
    if (Math.abs(r - startCell[0]) === Math.abs(c - startCell[1]) || r === startCell[0] || c === startCell[1]) {
      let currR = startCell[0] + dr;
      let currC = startCell[1] + dc;
      while ((dr !== 0 && (dr > 0 ? currR <= r : currR >= r)) || (dc !== 0 && (dc > 0 ? currC <= c : currC >= c))) {
        newSelection.push([currR, currC]);
        if(currR === r && currC === c) break;
        currR += dr;
        currC += dc;
      }
      setSelectedCells(newSelection);
    }
  };

  const endSelection = () => {
    if (gameState !== 'playing' || !isSelecting) return;
    setIsSelecting(false);
    
    const selectedWord = selectedCells.map(([r, c]) => grid[r][c]).join('');
    const reversedSelectedWord = selectedCells.slice().reverse().map(([r, c]) => grid[r][c]).join('');

    const foundWord = wordsToFind.find(word => word === selectedWord || word === reversedSelectedWord);

    if (foundWord && !foundWords.includes(foundWord)) {
      setFoundWords(prev => [...prev, foundWord]);
      setFoundCells(prev => [...prev, ...selectedCells]);
      toast({ title: `¡Encontraste "${foundWord}"!`, className: 'bg-green-500/20' });
    }
    setSelectedCells([]);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element) {
      const r = parseInt(element.getAttribute('data-r') || '-1', 10);
      const c = parseInt(element.getAttribute('data-c') || '-1', 10);
      if (r !== -1 && c !== -1) {
        moveSelection(r, c);
      }
    }
  };


  const handleRestart = () => {
    setSelectedCells([]);
    setFoundWords([]);
    setFoundCells([]);
    setIsSelecting(false);
    setTimeLeft(240);
    setGameState('playing');
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const isCellSelected = (r: number, c: number) => {
    return selectedCells.some(([selR, selC]) => selR === r && selC === c);
  };
  
  const isCellFound = (r: number, c: number) => {
    return foundCells.some(([foundR, foundC]) => foundR === r && foundC === c);
  };

  
  if (gameState === 'won') {
    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center min-h-[400px]">
            <PartyPopper className="w-24 h-24 text-yellow-500 animate-bounce mb-4" />
            <h2 className="text-4xl font-bold font-headline text-primary mb-2">¡Reto Completado!</h2>
            <p className="text-muted-foreground text-lg mb-6">¡Encontraste todas las palabras! Eres un experto ambiental.</p>
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

  if (gameState === 'lost') {
    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center min-h-[400px]">
            <AlertCircle className="w-24 h-24 text-destructive mb-4" />
            <h2 className="text-3xl font-bold font-headline text-destructive mb-2">¡Se acabó el tiempo!</h2>
            <p className="text-muted-foreground text-lg mb-6">No te preocupes, ¡la próxima vez lo conseguirás!</p>
            <Button onClick={handleRestart} size="lg">
                <RefreshCw className="mr-2" />
                Volver a Intentar
            </Button>
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
        <h2 className="text-2xl md:text-3xl font-bold text-primary font-headline text-center">Sopa de Letras</h2>
         <div className="text-2xl font-bold text-primary tabular-nums">
            {formatTime(timeLeft)}
        </div>
      </div>
       <div className="grid md:grid-cols-3 gap-8 items-start">
         <div 
           className="md:col-span-2 grid grid-cols-10 gap-1 bg-card border p-2 rounded-lg aspect-square select-none"
           onMouseUp={endSelection}
           onMouseLeave={endSelection}
           onTouchEnd={endSelection}
           onTouchCancel={endSelection}
           onTouchMove={handleTouchMove}
         >
           {grid.map((row, r) =>
             row.map((letter, c) => (
               <motion.div
                 key={`${r}-${c}`}
                 data-r={r}
                 data-c={c}
                 onMouseDown={() => startSelection(r, c)}
                 onMouseEnter={() => moveSelection(r, c)}
                 onTouchStart={(e) => { e.preventDefault(); startSelection(r, c); }}
                 className={cn(
                   'flex items-center justify-center aspect-square text-lg font-bold uppercase cursor-pointer rounded-md transition-colors',
                   isCellSelected(r,c) ? 'bg-primary/50 text-primary-foreground' 
                   : isCellFound(r, c) ? 'bg-green-500/30'
                   : 'bg-background hover:bg-accent'
                 )}
               >
                 {letter}
               </motion.div>
             ))
           )}
         </div>
         <Card>
           <CardHeader>
             <CardTitle>Palabras a Encontrar</CardTitle>
           </CardHeader>
           <CardContent>
             <ul className="space-y-2">
               {wordsToFind.map(word => (
                 <li key={word} className={cn("text-lg transition-all", foundWords.includes(word) && "line-through text-muted-foreground")}>
                   {word}
                 </li>
               ))}
             </ul>
           </CardContent>
         </Card>
       </div>
    </div>
  );
};

export default WordSearchGame;
