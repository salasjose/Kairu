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
  ['K', 'O', 'S', 'Q', 'C', 'S', 'V', 'Q', 'M', 'S'],
  ['Z', 'R', 'C', 'Q', 'M', 'U', 'Y', 'Z', 'P', 'U'],
  ['J', 'A', 'U', 'E', 'L', 'O', 'L', 'F', 'O', 'E'],
  ['B', 'O', 'S', 'Q', 'U', 'E', 'A', 'W', 'S', 'L'],
  ['N', 'G', 'L', 'P', 'O', 'D', 'R', 'A', 'T', 'O'],
  ['S', 'O', 'L', 'A', 'M', 'B', 'I', 'E', 'N', 'T'],
];

// Pre-calculate word positions for instant solve
const wordPositions: { [word: string]: [number, number][] } = {
    'RECICLAR': [[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7],[1,8]],
    'FAUNA': [[2,1],[2,2],[2,3],[2,4],[2,5]],
    'FLORA': [[3,1],[3,2],[3,3],[3,4],[3,5]],
    'AGUA': [[0,9],[1,9],[2,9],[3,9]],
    'SUELO': [[7,8],[6,8],[5,8],[4,8],[3,8]],
    'BOSQUE': [[7,0],[7,1],[7,2],[7,3],[7,4],[7,5]],
    'SOL': [[9,0],[9,1],[9,2]],
    'COMPOST': [[2,8],[3,8],[4,8],[5,8],[6,8],[7,8],[8,8]],
};


const WordSearchGame = ({ onComplete, onBack, gameId, isCompleted }: { onComplete: () => void; onBack: () => void; gameId: string, isCompleted?: boolean }) => {
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [foundWords, setFoundWords] = useState<string[]>(isCompleted ? wordsToFind : []);
  const [foundCells, setFoundCells] = useState<[number, number][]>(isCompleted ? Object.values(wordPositions).flat() as [number, number][] : []);
  const [isSelecting, setIsSelecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(240);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>(isCompleted ? 'won' : 'playing');

  useEffect(() => {
    if (gameState !== 'playing' || timeLeft <= 0) {
      if (timeLeft <= 0) {
        setGameState('lost');
        toast({ title: "¡Se acabó el tiempo!", variant: "destructive" });
      }
      return;
    }
  
    const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timerId);
  }, [timeLeft, gameState]);

  useEffect(() => {
    if (foundWords.length === wordsToFind.length && !isCompleted) {
      setGameState('won');
      onComplete();
    }
  }, [foundWords, isCompleted, onComplete]);

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
                <Button onClick={onBack} size="lg">
                    <CheckCircle className="mr-2" />
                    Volver a la Estación
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
            { !isCompleted ? (
                <div className="text-2xl font-bold text-primary tabular-nums">
                    {formatTime(timeLeft)}
                </div>
            ) : <div className="w-24"/> }
        </div>
       <div className="grid md:grid-cols-3 gap-8 items-start">
         <div 
           className={cn(
                "md:col-span-2 grid grid-cols-10 gap-1 bg-card border p-2 rounded-lg aspect-square select-none",
                !isCompleted && "touch-none"
            )}
           onMouseUp={!isCompleted ? endSelection : undefined}
           onMouseLeave={!isCompleted ? endSelection : undefined}
           onTouchEnd={!isCompleted ? endSelection : undefined}
           onTouchCancel={!isCompleted ? endSelection : undefined}
           onTouchMove={!isCompleted ? handleTouchMove : undefined}
         >
           {grid.map((row, r) =>
             row.map((letter, c) => (
               <motion.div
                 key={`${r}-${c}`}
                 data-r={r}
                 data-c={c}
                 onMouseDown={!isCompleted ? () => startSelection(r, c) : undefined}
                 onMouseEnter={!isCompleted ? () => moveSelection(r, c) : undefined}
                 onTouchStart={!isCompleted ? (e) => { e.preventDefault(); startSelection(r, c); } : undefined}
                 className={cn(
                   'flex items-center justify-center aspect-square text-lg font-bold uppercase rounded-md transition-colors',
                   !isCompleted && 'cursor-pointer',
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
             {isCompleted && <p className="mt-4 text-sm text-green-600 font-bold">¡Ya has completado este reto!</p>}
           </CardContent>
         </Card>
       </div>
    </div>
  );
};

export default WordSearchGame;
