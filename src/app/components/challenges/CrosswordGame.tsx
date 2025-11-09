
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
            // Prioritize across if available
            const isInAcross = gridData?.across.some(a => {
                const start = findWordStart(a.number);
                if (!start) return false;
                const [startRow, startCol] = start;
                return row === startRow && col >= startCol && col < startCol + a.answer.length;
            });

            const isInDown = gridData?.down.some(d => {
                const start = findWordStart(d.number);
                if (!start) return false;
                const [startRow, startCol] = start;
                return col === startCol && row >= startRow && row < startRow + d.answer.length;
            })

            if (isInAcross) {
                setDirection("across");
            } else if (isInDown) {
                setDirection("down");
            }
        }
    };
    
   const findWordStart = (number: number): [number, number] | null => {
        if (!gridData) return null;
        
        const acrossClue = gridData.across.find(c => c.number === number);
        if (acrossClue) {
            for (let r = 0; r < 10; r++) {
                for (let c = 0; c <= 10 - acrossClue.answer.length; c++) {
                    const word = gridData.grid[r].slice(c, c + acrossClue.answer.length).join('');
                    if (word === acrossClue.answer) {
                        return [r, c];
                    }
                }
            }
        }

        const downClue = gridData.down.find(c => c.number === number);
        if (downClue) {
            for (let c = 0; c < 10; c++) {
                for (let r = 0; r <= 10 - downClue.answer.length; r++) {
                    let word = '';
                    for(let i=0; i<downClue.answer.length; i++) {
                        word += gridData.grid[r+i][c];
                    }
                    if (word === downClue.answer) {
                        return [r, c];
                    }
                }
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
        
        const clues = direction === 'across' ? gridData.across : gridData.down;

        for (const clue of clues) {
            const start = findWordStart(clue.number);
            if (!start) continue;

            let [startRow, startCol] = start;
            let inThisWord = false;
            
            if (direction === 'across') {
                if (row === startRow && col >= startCol && col < startCol + clue.answer.length) {
                    inThisWord = true;
                }
            } else { // down
                if (col === startCol && row >= startRow && row < startRow + clue.answer.length) {
                    inThisWord = true;
                }
            }

            if(inThisWord){
                const cells: {r: number, c: number}[] = [];
                for (let i = 0; i < clue.answer.length; i++) {
                    const r = direction === 'down' ? startRow + i : startRow;
                    const c = direction === 'across' ? startCol + i : startCol;
                    cells.push({ r, c });
                }
                return cells;
            }
        }
        return [{r: row, c: col}];
    }

    const highlightedCells = getHighlightedCells();
    
    if (isLoading) {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center">
                <h2 className="text-2xl font-bold font-headline mb-4">Generando Crucigrama...</h2>
                <Skeleton className="w-full aspect-square max-w-lg" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center">
                 <AlertCircle className="w-16 h-16 text-destructive mb-4" />
                <h2 className="text-2xl font-bold font-headline text-destructive mb-2">Error</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <div className="flex gap-4">
                    <Button onClick={onBack} variant="outline">Volver</Button>
                    <Button onClick={generateGame}><RefreshCw className="mr-2"/>Intentar de Nuevo</Button>
                </div>
            </div>
        );
    }
    
    if (!gridData) return null;

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
                            const clueNumber = gridData.across.find(clue => findWordStart(clue.number)?.[0] === r && findWordStart(clue.number)?.[1] === c)?.number
                                            || gridData.down.find(clue => findWordStart(clue.number)?.[0] === r && findWordStart(clue.number)?.[1] === c)?.number;


                            return (
                                <div
                                    key={`${r}-${c}`}
                                    className={cn(
                                        "aspect-square flex items-center justify-center relative",
                                        isBlack ? "bg-black" : "bg-white",
                                        !isBlack && "cursor-pointer",
                                        isSelected && "bg-yellow-200",
                                        isHighlighted && !isSelected && "bg-yellow-100/70"
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
                        {gridData.across.map(clue => (
                            <p key={`across-${clue.number}`}><span className="font-bold">{clue.number}.</span> {clue.clue}</p>
                        ))}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Verticales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm max-h-[400px] overflow-y-auto">
                        {gridData.down.map(clue => (
                            <p key={`down-${clue.number}`}><span className="font-bold">{clue.number}.</span> {clue.clue}</p>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    