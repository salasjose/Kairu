"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle, RefreshCw, Eye, Heart, Timer, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrosswordData } from '@/lib/types';


/** Componente principal */
export default function CrosswordGame({
  data,
  onBack,
  onComplete,
  onLose,
}: {
  data: CrosswordData;
  onBack?: () => void;
  onComplete: () => void;
  onLose: () => void;
}) {
  const grid = useMemo(() => data.grid.map(row => row.map(v => v === "#" ? "#" : v)), [data.grid]);
  const rows = grid.length;
  const cols = grid[0].length;
  
  const clueNumbers = useMemo(() => {
    const numbers: { [key: string]: number } = {};
    let clueCounter = 1;
    const assignedNumbers: { [key: string]: boolean } = {};
  
    const acrossCluesByNumber: { [num: number]: boolean } = data.clues.across.reduce((acc, clue) => {
      acc[clue.number] = true;
      return acc;
    }, {} as { [num: number]: boolean });
  
    const downCluesByNumber: { [num: number]: boolean } = data.clues.down.reduce((acc, clue) => {
      acc[clue.number] = true;
      return acc;
    }, {} as { [num: number]: boolean });
  
    // Asignar números a las celdas
    const starts = new Map<number, {r: number, c: number}>();
    data.clues.across.forEach(c => starts.set(c.number, {r: -1, c: -1}));
    data.clues.down.forEach(c => starts.set(c.number, {r: -1, c: -1}));

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === '#') continue;
        const isAcrossStart = (c === 0 || grid[r][c - 1] === '#') && c + 1 < cols && grid[r][c + 1] !== '#';
        const isDownStart = (r === 0 || grid[r - 1][c] === '#') && r + 1 < rows && grid[r + 1][c] !== '#';
        if(isAcrossStart || isDownStart) {
          // Find the number from the clues
          const acrossClue = data.clues.across.find(clue => {
            const word = clue.answer;
            if(c + word.length > cols) return false;
            let match = true;
            for(let i = 0; i < word.length; i++) {
              if(grid[r][c+i] !== word[i]) {
                match = false;
                break;
              }
            }
            return match;
          });
          const downClue = data.clues.down.find(clue => {
            const word = clue.answer;
            if(r + word.length > rows) return false;
            let match = true;
            for(let i = 0; i < word.length; i++) {
              if(grid[r+i][c] !== word[i]) {
                match = false;
                break;
              }
            }
            return match;
          });
          if (isAcrossStart && acrossClue) {
            starts.set(acrossClue.number, {r,c});
          }
          if (isDownStart && downClue) {
             starts.set(downClue.number, {r,c});
          }
        }
      }
    }
    
    starts.forEach((pos, num) => {
        if (pos.r !== -1) {
            numbers[`${pos.r},${pos.c}`] = num;
        }
    });

    return numbers;

  }, [grid, rows, cols, data.clues]);


  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [dir, setDir] = useState<"across" | "down">("across");
  const [state, setState] = useState<string[][]>(() => grid.map(row => row.map(cell => (cell === "#" ? "#" : ""))));
  const [showSolution, setShowSolution] = useState(false);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');

  const refs = useRef<(HTMLInputElement | null)[][]>(Array.from({ length: rows }, () => Array(cols).fill(null)));

  useEffect(() => {
    if (gameState !== 'playing') return;
    if (timeLeft <= 0) {
        setGameState('lost');
        toast({ title: "¡Se acabó el tiempo!", variant: "destructive" });
        onLose();
        return;
    }
    const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, gameState, onLose]);


  useEffect(() => {
    if (showSolution) {
      setState(grid);
    } else {
        if (JSON.stringify(state) === JSON.stringify(grid)) {
            resetGame();
        }
    }
  }, [showSolution, grid]);


  const resetGame = () => {
    setShowSolution(false);
    setState(grid.map(r=>r.map(c=>c==="#"?"#":"")));
    setSelected(null);
    setLives(3);
    setTimeLeft(300);
    setGameState('playing');
    if (refs.current[0][0]) refs.current[0][0]?.focus();
  }

    const checkSolution = () => {
        if (gameState !== 'playing') return;

        let incorrectCells = 0;
        for(let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if(grid[r][c] !== '#') {
                    if (state[r][c].toUpperCase() !== grid[r][c].toUpperCase()) {
                        incorrectCells++;
                    }
                }
            }
        }
        
        if (incorrectCells === 0) {
            setGameState('won');
            toast({ title: "¡Felicidades!", description: "Has completado el crucigrama." });
            onComplete();
        } else {
            const newLives = lives - 1;
            setLives(newLives);
            if (newLives <= 0) {
                setGameState('lost');
                toast({ title: "¡Has perdido!", description: "Te has quedado sin vidas.", variant: "destructive" });
                onLose();
            } else {
                toast({ title: "Algunas respuestas son incorrectas", description: `Te quedan ${newLives} vidas.`, variant: "destructive" });
            }
        }
    };


  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, r: number, c: number) => {
    let v = e.target.value.toUpperCase();
    if (v.length > 1) v = v.at(-1)!;

    const nextState = state.map(row => row.slice());
    nextState[r][c] = v;
    setState(nextState);

    if (v) {
      const nextCell = findNextCell(r, c, dir, false);
      if (nextCell) {
        setSelected(nextCell);
        refs.current[nextCell.r][nextCell.c]?.focus();
      }
    }
  };
  
    const findNextCell = (r: number, c: number, direction: "across" | "down", backwards: boolean): {r: number, c: number} | null => {
        let { r: newR, c: newC } = { r, c };
        const step = backwards ? -1 : 1;
        
        while(true) {
            if (direction === 'across') newC += step;
            else newR += step;
            
            if (newR < 0 || newR >= rows || newC < 0 || newC >= cols) return null;
            if (grid[newR][newC] !== '#') return { r: newR, c: newC };
        }
    }


  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key === "Backspace" && !state[r][c]) {
      const prev = findNextCell(r, c, dir, true);
      if (prev) { setSelected(prev); refs.current[prev.r][prev.c]?.focus(); }
    } else if (e.key === "ArrowUp") { e.preventDefault(); move("down", true); }
    else if (e.key === "ArrowDown") { e.preventDefault(); move("down", false); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); move("across", true); }
    else if (e.key === "ArrowRight") { e.preventDefault(); move("across", false); }
    else if (e.key === "Tab" || e.key === " ") { e.preventDefault(); setDir(d => d === 'across' ? 'down' : 'across'); }

    function move(d: "across" | "down", back: boolean) {
      setDir(d);
      const nxt = findNextCell(r, c, d, back);
      if (nxt) { setSelected(nxt); refs.current[nxt.r][nxt.c]?.focus(); }
    }
  };
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }
  
    if (gameState === 'lost') {
        return (
             <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center min-h-[400px]">
                <AlertCircle className="w-24 h-24 text-destructive mb-4" />
                <h2 className="text-3xl font-bold font-headline text-destructive mb-2">{timeLeft <= 0 ? "¡Se acabó el tiempo!" : "¡Sin vidas!"}</h2>
                <p className="text-muted-foreground text-lg mb-6">No te preocupes, puedes volver a intentarlo más tarde.</p>
                <Button onClick={onBack} size="lg">
                    <ArrowLeft className="mr-2" />
                    Volver a la estación
                </Button>
            </div>
        )
    }

  return (
    <div className="mx-auto w-full max-w-7xl p-2 md:p-4 flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
      <div className="w-full lg:w-auto lg:flex-shrink-0">
        <div className="flex justify-between items-center mb-2 md:mb-4 flex-wrap gap-2">
            {onBack && (
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Volver
              </Button>
            )}
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1 font-bold text-lg">
                    <Heart className="h-5 w-5 text-red-500 fill-current" />
                    <span>{lives}</span>
                 </div>
                 <div className="flex items-center gap-1 font-bold text-lg tabular-nums">
                    <Timer className="h-5 w-5" />
                    <span>{formatTime(timeLeft)}</span>
                 </div>
            </div>
        </div>
        <div
          className="grid gap-px md:gap-0.5 rounded-md p-1 md:p-2 bg-gray-900 w-full max-w-[500px] mx-auto"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isBlock = cell === "#";
              const isSel = selected?.r === r && selected?.c === c;
              const clueNumber = clueNumbers[`${r},${c}`];

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => { if (!isBlock) { setSelected({ r, c }); refs.current[r][c]?.focus(); } }}
                  className={cn(
                    "relative aspect-square flex items-center justify-center border",
                    isBlock ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300",
                    isSel && !isBlock && "bg-yellow-200"
                  )}
                >
                  {clueNumber && (
                    <span className="absolute top-0 left-0.5 text-[0.5rem] md:text-[0.6rem] font-bold text-gray-500">
                      {clueNumber}
                    </span>
                  )}
                  {!isBlock && (
                    <input
                      ref={el => { if (refs.current[r]) refs.current[r][c] = el; }}
                      type="text"
                      maxLength={1}
                      value={state[r][c] === "#" ? "" : state[r][c]}
                      onChange={(e) => handleInput(e, r, c)}
                      onKeyDown={(e) => handleKey(e, r, c)}
                      onFocus={() => setSelected({r,c})}
                      className="h-full w-full text-center bg-transparent outline-none border-none text-sm sm:text-base md:text-xl font-bold uppercase"
                      aria-label={`Fila ${r + 1}, Columna ${c + 1}`}
                      disabled={gameState !== 'playing'}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 md:gap-3">
          <Button onClick={checkSolution} disabled={gameState !== 'playing'}><CheckCircle className="mr-2 h-4 w-4" />Comprobar</Button>
          <Button variant="outline" onClick={() => setShowSolution(s => !s)} disabled={gameState !== 'playing'}>
            <Eye className="mr-2 h-4 w-4" />
            {showSolution ? "Ocultar" : "Ver Solución"}
          </Button>
          <Button variant="secondary" onClick={resetGame} disabled={gameState !== 'playing'}>
            <RefreshCw className="mr-2 h-4 w-4" />Reiniciar
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 w-full h-full lg:max-h-[75vh] lg:overflow-y-auto">
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader><CardTitle>Horizontales</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.clues.across.map(cl => (
              <p key={`a-${cl.number}`}><span className="font-bold">{cl.number}.</span> {cl.clue}</p>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur-sm">
          <CardHeader><CardTitle>Verticales</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.clues.down.map(cl => (
              <p key={`d-${cl.number}`}><span className="font-bold">{cl.number}.</span> {cl.clue}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
