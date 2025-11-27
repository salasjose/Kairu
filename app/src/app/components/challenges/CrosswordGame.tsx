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
  isCompleted = false,
}: {
  data: CrosswordData;
  onBack?: () => void;
  onComplete: () => void;
  onLose: () => void;
  isCompleted?: boolean;
}) {
  const grid = useMemo(() => data.grid.map(row => row.map(v => v === "#" ? "#" : v)), [data.grid]);
  const rows = grid.length;
  const cols = grid[0].length;
  
  const clueNumbers = useMemo(() => {
    const numbers: { [key: string]: number } = {};
    
    // Asignar números a las celdas basadas en las pistas
    const assignNumbers = (clues: { number: number, answer: string }[], direction: 'across' | 'down') => {
      clues.forEach(clue => {
        let found = false;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            let match = true;
            if (direction === 'across') {
              if (c + clue.answer.length > cols) continue;
              // Check for blocker before
              if (c > 0 && grid[r][c-1] !== '#') continue;
              for (let i = 0; i < clue.answer.length; i++) {
                if (grid[r][c + i].toUpperCase() !== clue.answer[i].toUpperCase()) {
                  match = false;
                  break;
                }
              }
            } else { // 'down'
              if (r + clue.answer.length > rows) continue;
              // Check for blocker before
              if (r > 0 && grid[r-1][c] !== '#') continue;
              for (let i = 0; i < clue.answer.length; i++) {
                if (grid[r + i][c].toUpperCase() !== clue.answer[i].toUpperCase()) {
                  match = false;
                  break;
                }
              }
            }
            if (match) {
              numbers[`${r},${c}`] = clue.number;
              found = true;
              break;
            }
          }
          if (found) break;
        }
      });
    };

    assignNumbers(data.clues.across, 'across');
    assignNumbers(data.clues.down, 'down');

    return numbers;

  }, [grid, rows, cols, data.clues]);


  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [dir, setDir] = useState<"across" | "down">("across");
  const [state, setState] = useState<string[][]>(() => grid.map(row => row.map(cell => (cell === "#" ? "#" : ""))));
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>(isCompleted ? 'won' : 'playing');

  const refs = useRef<(HTMLInputElement | null)[][]>(Array.from({ length: rows }, () => Array(cols).fill(null)));
  
  useEffect(() => {
    if (isCompleted) {
        setState(grid);
        setGameState('won');
    }
  }, [isCompleted, grid]);


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


  const resetGame = () => {
    if (isCompleted) return;
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
            {!isCompleted && (
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
            )}
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
                  onClick={() => { if (!isBlock && gameState === 'playing') { setSelected({ r, c }); refs.current[r][c]?.focus(); } }}
                  className={cn(
                    "relative aspect-square flex items-center justify-center border",
                    isBlock ? "bg-gray-800 border-gray-700" : "bg-white border-gray-300",
                    isSel && !isBlock && !isCompleted && "bg-yellow-200"
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
                      disabled={gameState !== 'playing' || isCompleted}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {!isCompleted && (
          <div className="mt-4 flex flex-wrap gap-2 md:gap-3">
            <Button onClick={checkSolution} disabled={gameState !== 'playing'}>
              <CheckCircle className="mr-2 h-4 w-4" />Comprobar
            </Button>
          </div>
        )}
         {isCompleted && (
             <div className="mt-4">
                 <Button disabled size="lg">
                    <CheckCircle className="mr-2"/>
                    Reto Completado
                 </Button>
             </div>
        )}
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
