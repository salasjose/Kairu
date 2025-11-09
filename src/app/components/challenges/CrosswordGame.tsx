
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { CrosswordData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, ArrowLeft, CheckCircle, Lightbulb, RefreshCw } from "lucide-react";
import { handleGenerateCrossword } from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";

type Direction = "across" | "down";

interface CrosswordGameProps {
    topic: string;
    onBack: () => void;
    onComplete: () => void;
}

export default function CrosswordGame({ topic, onBack, onComplete }: CrosswordGameProps) {
    const [gridData, setGridData] = useState<CrosswordData | null>(null);
    const [gridState, setGridState] = useState<string[][]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
    const [direction, setDirection] = useState<Direction>("across");

    const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

    const generateGame = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setGridData(null);
        setGridState([]);

        const result = await handleGenerateCrossword(topic, 10);
        
        if (result.success && result.data) {
            setGridData(result.data);
            const initialGrid = result.data.grid.map(row => row.map(cell => (cell === "#" ? "#" : "")));
            setGridState(initialGrid);
            inputRefs.current = Array(10).fill(null).map(() => Array(10).fill(null));
        } else {
            setError(result.error || "No se pudo generar el crucigrama.");
            toast({
                title: "Error de Generación",
                description: result.error || "No se pudo generar el crucigrama. Intenta de nuevo.",
                variant: "destructive",
            });
        }
        setIsLoading(false);
    }, [topic]);

    useEffect(() => {
        generateGame();
    }, [generateGame]);

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
        let value = e.target.value.toUpperCase();
        if (value.length > 1) {
            value = value.charAt(value.length - 1);
        }

        const newGridState = [...gridState];
        newGridState[row][col] = value;
        setGridState(newGridState);

        if (value) {
            if (direction === "across" && col < gridState[0].length - 1 && gridState[row][col + 1] !== '#') {
                inputRefs.current[row][col + 1]?.focus();
            } else if (direction === "down" && row < gridState.length - 1 && gridState[row + 1][col] !== '#') {
                inputRefs.current[row + 1][col]?.focus();
            }
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
        if (e.key === "Backspace" && !gridState[row][col]) {
             if (direction === "across" && col > 0 && gridState[row][col - 1] !== '#') {
                inputRefs.current[row][col - 1]?.focus();
            } else if (direction === "down" && row > 0 && gridState[row - 1][col] !== '#') {
                inputRefs.current[row - 1][col]?.focus();
            }
        }
    }

    const handleCellClick = (row: number, col: number) => {
        if (gridData?.grid[row][col] === "#") return;

        if (selectedCell?.row === row && selectedCell?.col === col) {
            setDirection(prev => prev === "across" ? "down" : "across");
        } else {
            setSelectedCell({ row, col });
            const clue = findClueForCell(row, col);
            if (clue) {
              setDirection(clue.direction);
            }
        }
    };
    
   const findWordStart = (number: number, dir: Direction): [number, number] | null => {
        if (!gridData) return null;
        
        for (let r = 0; r < gridData.grid.length; r++) {
            for (let c = 0; c < gridData.grid[r].length; c++) {
                const clueNumber = getClueNumberForCell(r, c);
                if (clueNumber === number) {
                    if (dir === 'across' && (c === 0 || gridData.grid[r][c-1] === '#')) {
                        const clue = gridData.across.find(cl => cl.number === number);
                        if (clue) return [r, c];
                    }
                    if (dir === 'down' && (r === 0 || gridData.grid[r-1][c] === '#')) {
                        const clue = gridData.down.find(cl => cl.number === number);
                        if (clue) return [r, c];
                    }
                }
            }
        }
        return null;
    };
  
  const getClueNumberForCell = (r: number, c: number) => {
      if (!gridData || gridData.grid[r][c] === '#') return null;

      const isAcrossStart = (c === 0 || gridData.grid[r][c - 1] === '#') && c < 9 && gridData.grid[r][c+1] !== '#';
      const isDownStart = (r === 0 || gridData.grid[r - 1][c] === '#') && r < 9 && gridData.grid[r+1][c] !== '#';

      if(isAcrossStart || isDownStart) {
          const acrossClue = gridData.across.find(clue => {
              const wordStart = findWordStart(clue.number, 'across');
              return wordStart && wordStart[0] === r && wordStart[1] === c;
          });
          if(acrossClue) return acrossClue.number;

          const downClue = gridData.down.find(clue => {
               const wordStart = findWordStart(clue.number, 'down');
               return wordStart && wordStart[0] === r && wordStart[1] === c;
          });
          if(downClue) return downClue.number;
      }
      return null;
  }
  
  const findClueForCell = (row: number, col: number) => {
      if(!gridData) return null;

       // Check across
      for (const clue of gridData.across) {
          const start = findWordStart(clue.number, 'across');
          if (start && row === start[0] && col >= start[1] && col < start[1] + clue.answer.length) {
              return { ...clue, direction: 'across' as Direction };
          }
      }
      // Check down
      for (const clue of gridData.down) {
          const start = findWordStart(clue.number, 'down');
          if (start && col === start[1] && row >= start[0] && row < start[0] + clue.answer.length) {
              return { ...clue, direction: 'down' as Direction };
          }
      }
      return null;
  }


    const checkSolution = () => {
        if (!gridData) return;

        let correct = true;
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                if (gridData.grid[r][c] !== "#") {
                    if (gridState[r][c] !== gridData.grid[r][c]) {
                        correct = false;
                        break;
                    }
                }
            }
            if (!correct) break;
        }

        if (correct) {
            toast({ title: "¡Felicidades!", description: "Has completado el crucigrama correctamente." });
            onComplete();
        } else {
            toast({ title: "Casi listo", description: "Algunas respuestas son incorrectas. ¡Sigue intentando!", variant: "destructive" });
        }
    };
    
    const getHighlightedCells = () => {
        if (!selectedCell || !gridData) return [];
        const { row, col } = selectedCell;
        
        const clue = findClueForCell(row, col);
        if(!clue) return [{r: row, c: col}];

        const start = findWordStart(clue.number, clue.direction);
        if(!start) return [{r: row, c: col}];

        const [startRow, startCol] = start;
        const cells: {r: number, c: number}[] = [];
        for (let i = 0; i < clue.answer.length; i++) {
            const r = clue.direction === 'down' ? startRow + i : startRow;
            const c = clue.direction === 'across' ? startCol + i : startCol;
            cells.push({ r, c });
        }
        return cells;
    }

    const highlightedCells = getHighlightedCells();
    
    if (isLoading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold font-headline mb-4">Generando Crucigrama...</h2>
                <p className="text-muted-foreground mb-4">Esto puede tardar un momento...</p>
                <Skeleton className="w-full aspect-square max-w-lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center">
                 <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold font-headline text-destructive mb-2">Error al Generar Crucigrama</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <div className="flex gap-4">
                    <Button onClick={onBack} variant="outline">Volver</Button>
                    <Button onClick={generateGame}><RefreshCw className="mr-2"/>Intentar de Nuevo</Button>
                </div>
            </div>
        );
    }
    
    if (!gridData) return (
      <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center">
          <p>No se pudieron cargar los datos del crucigrama.</p>
          <Button onClick={onBack} variant="outline" className="mt-4">Volver</Button>
      </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 p-4 max-w-7xl mx-auto items-start">
            <div className="w-full lg:w-auto">
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a los retos
                </Button>
                <div 
                    className="grid grid-cols-10 gap-0.5 bg-black border-2 border-black rounded-sm"
                    style={{width: 'clamp(300px, 90vw, 600px)', aspectRatio: '1/1'}}
                >
                    {gridState.map((row, r) =>
                        row.map((cell, c) => {
                            const isBlack = gridData.grid[r][c] === "#";
                            const isHighlighted = highlightedCells.some(hc => hc.r === r && hc.c === c);
                            const isSelected = selectedCell?.row === r && selectedCell?.col === c;
                            const clueNumber = getClueNumberForCell(r,c);


                            return (
                                <div
                                    key={`${r}-${c}`}
                                    className={cn(
                                        "aspect-square flex items-center justify-center relative",
                                        isBlack ? "bg-black" : "bg-white",
                                        !isBlack && "cursor-pointer",
                                        isSelected && !isBlack && "bg-yellow-200",
                                        isHighlighted && !isSelected && !isBlack && "bg-yellow-100/70"
                                    )}
                                    onClick={() => handleCellClick(r, c)}
                                >
                                    {clueNumber && <span className="absolute top-0 left-0.5 text-[8px] font-bold">{clueNumber}</span>}
                                    {!isBlack && (
                                        <input
                                            ref={el => (inputRefs.current[r][c] = el)}
                                            type="text"
                                            maxLength={1}
                                            value={cell}
                                            onChange={(e) => handleInput(e, r, c)}
                                            onKeyDown={(e) => handleKeyDown(e, r, c)}
                                            className="w-full h-full text-center bg-transparent border-none outline-none text-lg md:text-xl font-bold uppercase"
                                        />
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
                 <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button onClick={checkSolution} size="lg"><CheckCircle className="mr-2"/>Comprobar Solución</Button>
                 </div>
            </div>

            <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Horizontales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm max-h-[400px] overflow-y-auto">
                        {gridData.across.sort((a,b) => a.number - b.number).map(clue => (
                            <p key={`across-${clue.number}`}><span className="font-bold">{clue.number}.</span> {clue.clue}</p>
                        ))}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Verticales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm max-h-[400px] overflow-y-auto">
                        {gridData.down.sort((a,b) => a.number - b.number).map(clue => (
                            <p key={`down-${clue.number}`}><span className="font-bold">{clue.number}.</span> {clue.clue}</p>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    
