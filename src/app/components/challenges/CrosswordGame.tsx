
"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, RefreshCw, Trophy } from "lucide-react";

const palabrasData = [
    { id: '1H', number: 1, clue: 'Uso responsable de los recursos naturales para satisfacer necesidades actuales sin comprometer las futuras.', answer: 'SOSTENIBILIDAD', direction: 'across', row: 0, col: 0 },
    { id: '2V', number: 2, clue: 'Cambio positivo hacia un modelo que respeta el medio ambiente y promueve la equidad social.', answer: 'TRANSFORMACION', direction: 'down', row: 0, col: 2 },
    { id: '3H', number: 3, clue: 'Proceso que busca equilibrar lo económico, lo social y lo ambiental.', answer: 'DESARROLLO', direction: 'across', row: 2, col: 0 },
    { id: '4V', number: 4, clue: 'Capacidad de mantener el equilibrio ecológico y social a largo plazo.', answer: 'RESILIENCIA', direction: 'down', row: 2, col: 5 },
    { id: '5H', number: 5, clue: 'Acción de volver a utilizar un producto o material para alargar su vida útil.', answer: 'REUTILIZAR', direction: 'across', row: 4, col: 2 },
    { id: '6H', number: 6, clue: 'Práctica que reduce el consumo de materiales y energía.', answer: 'ECOEFICIENCIA', direction: 'across', row: 6, col: 0 },
    { id: '7V', number: 7, clue: 'Energía obtenida de fuentes como el sol, el viento o el agua.', answer: 'RENOVABLE', direction: 'down', row: 6, col: 8 },
    { id: '8V', number: 8, clue: 'Sistema que permite transformar residuos en nuevos productos.', answer: 'RECICLAJE', direction: 'down', row: 7, col: 1 },
    { id: '9H', number: 9, clue: 'Modelo de producción y consumo que implica compartir, alquilar, reutilizar, reparar, renovar y reciclar materiales y productos existentes.', answer: 'ECONOMIA', direction: 'across', row: 8, col: 3 },
    { id: '10H', number: 10, clue: 'Valor que impulsa a cuidar el planeta y actuar de forma responsable con el entorno.', answer: 'CONCIENCIA', direction: 'across', row: 10, col: 0 },
];

const gridSize = { rows: 12, cols: 15 };

const createInitialGrid = () => {
    const initialGrid = Array(gridSize.rows).fill(null).map(() => Array(gridSize.cols).fill({ user: '', solution: '', isBlock: true, clues: [] as string[], number: null as number | null }));
    palabrasData.forEach(palabra => {
        let { row, col, direction, answer, id, number } = palabra;
        for (let i = 0; i < answer.length; i++) {
            const r = direction === 'across' ? row : row + i;
            const c = direction === 'across' ? col + i : col;
            if (r < gridSize.rows && c < gridSize.cols) {
                initialGrid[r][c] = {
                    ...initialGrid[r][c],
                    solution: answer[i],
                    isBlock: false,
                    clues: [...initialGrid[r][c].clues, id]
                };
                 if (i === 0) {
                   initialGrid[r][c].number = number;
                }
            }
        }
    });
    return initialGrid;
};

export default function CrosswordGame({ onBack, onComplete }: { onBack: () => void; onComplete: () => void; }) {
    const [grid, setGrid] = useState(createInitialGrid());
    const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
    const [direction, setDirection] = useState<'across' | 'down'>('across');
    const [isComplete, setIsComplete] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[][]>(Array(gridSize.rows).fill(null).map(() => Array(gridSize.cols).fill(null)));

    const currentClueId = useMemo(() => {
        const cell = grid[selectedCell.row][selectedCell.col];
        if (!cell || cell.isBlock) return null;
        const clue = cell.clues.find(c => (direction === 'across' && c.includes('H')) || (direction === 'down' && c.includes('V')));
        return clue || cell.clues[0];
    }, [selectedCell, direction, grid]);

    const handleCellClick = (row: number, col: number) => {
        if (grid[row][col].isBlock) return;
        if (selectedCell.row === row && selectedCell.col === col) {
            setDirection(prev => prev === 'across' ? 'down' : 'across');
        } else {
            setSelectedCell({ row, col });
            const cell = grid[row][col];
            if (cell.clues.some(c => c.includes('H'))) {
              setDirection('across');
            } else {
              setDirection('down');
            }
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
        let value = e.target.value.toUpperCase();
        if (value.length > 1) {
            value = value.charAt(value.length - 1);
        }
        
        const newGrid = grid.map(r => r.map(c => ({...c})));
        newGrid[row][col].user = value;
        setGrid(newGrid);
        
        setShowErrors(false);

        if (value) {
           moveNext(row, col, 1);
        }
    };

    const moveNext = (row: number, col: number, step: number) => {
        let nextRow = row;
        let nextCol = col;

        if (direction === 'across') {
            nextCol += step;
            if (nextCol >= gridSize.cols || nextCol < 0 || grid[nextRow][nextCol].isBlock) return;
        } else {
            nextRow += step;
            if (nextRow >= gridSize.rows || nextRow < 0 || grid[nextRow][nextCol].isBlock) return;
        }
        
        inputRefs.current[nextRow]?.[nextCol]?.focus();
        setSelectedCell({ row: nextRow, col: nextCol });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                setDirection('across');
                moveNext(row, col, 1);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                setDirection('across');
                moveNext(row, col, -1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                setDirection('down');
                moveNext(row, col, 1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setDirection('down');
                moveNext(row, col, -1);
                break;
            case 'Backspace':
                if (!grid[row][col].user) {
                    e.preventDefault();
                    moveNext(row, col, -1);
                }
                break;
             case 'Enter':
                e.preventDefault();
                handleCellClick(row, col); // Toggle direction
                break;
        }
    };
    
    const checkAnswers = () => {
        let allCorrect = true;
        for (let r = 0; r < gridSize.rows; r++) {
            for (let c = 0; c < gridSize.cols; c++) {
                if (!grid[r][c].isBlock) {
                    if (grid[r][c].user !== grid[r][c].solution) {
                        allCorrect = false;
                    }
                }
            }
        }
        
        if (allCorrect) {
            setIsComplete(true);
            setShowErrors(false);
            toast({ title: "¡Felicidades!", description: "Has completado el crucigrama correctamente." });
            setTimeout(onComplete, 2000);
        } else {
            setShowErrors(true);
            setIsComplete(false);
            toast({ title: "Casi listo", description: "Algunas respuestas son incorrectas. ¡Sigue intentando!", variant: "destructive" });
        }
    };

    const resetGame = () => {
        setGrid(createInitialGrid());
        setSelectedCell({row: 0, col: 0});
        setIsComplete(false);
        setShowErrors(false);
    };

    const solveGame = () => {
        const newGrid = grid.map(row => 
            row.map(cell => {
                if (!cell.isBlock) {
                    return { ...cell, user: cell.solution };
                }
                return cell;
            })
        );
        setGrid(newGrid);
        setIsComplete(true);
        setShowErrors(false);
        toast({ title: "¡Crucigrama Resuelto!", description: "Aquí tienes la solución." });
    };
    
    const renderGrid = () => {
      return grid.map((row, r) =>
        row.map((cell, c) => {
          const isSelected = selectedCell.row === r && selectedCell.col === c;
          const isHighlighted = cell.clues.includes(currentClueId || '');
          const isError = showErrors && !cell.isBlock && cell.user !== cell.solution;

          return (
            <div
              key={`${r}-${c}`}
              className={cn(
                "w-full aspect-square border border-gray-300 flex items-center justify-center relative",
                cell.isBlock ? "bg-black" : "bg-white",
                !cell.isBlock && "cursor-pointer",
                isHighlighted && !cell.isBlock && "bg-yellow-100",
                isSelected && !cell.isBlock && "bg-yellow-300",
              )}
              onClick={() => handleCellClick(r, c)}
            >
              {cell.number && <span className="absolute top-0 left-0.5 text-[8px] font-bold select-none">{cell.number}</span>}
              {!cell.isBlock && (
                <input
                  ref={el => inputRefs.current[r][c] = el}
                  type="text"
                  maxLength={1}
                  value={cell.user}
                  onChange={e => handleInputChange(e, r, c)}
                  onKeyDown={e => handleKeyDown(e, r, c)}
                  onFocus={() => setSelectedCell({row: r, col: c})}
                  className={cn(
                    "w-full h-full text-center bg-transparent border-none outline-none text-lg md:text-xl font-bold uppercase",
                    isError && "text-red-500"
                  )}
                />
              )}
            </div>
          );
        })
      );
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8 p-4 max-w-7xl mx-auto items-start">
            <div className="w-full lg:w-auto">
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a los retos
                </Button>
                <div className="flex-shrink-0">
                    <div
                      className="inline-grid gap-0.5 p-2 bg-black border-2 border-black rounded-lg"
                      style={{ gridTemplateColumns: `repeat(${gridSize.cols}, minmax(0, 1fr))` }}
                    >
                      {renderGrid()}
                    </div>
                </div>
                 <footer className="text-center mt-6 space-y-4">
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button onClick={checkAnswers} size="lg"><CheckCircle className="mr-2"/>Comprobar</Button>
                        <Button onClick={solveGame} size="lg" variant="secondary"><Trophy className="mr-2"/>Resolver</Button>
                        <Button onClick={resetGame} size="lg" variant="outline"><RefreshCw className="mr-2"/>Reiniciar</Button>
                    </div>
                    {isComplete && (
                        <div className="p-3 bg-green-100 border border-green-300 rounded-lg text-green-800 font-semibold">
                            🎉 ¡Felicidades! Has completado el crucigrama.
                        </div>
                    )}
                     {showErrors && !isComplete && (
                        <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 font-semibold">
                            Algunas respuestas son incorrectas. ¡Sigue intentando!
                        </div>
                    )}
                </footer>
            </div>

            <aside className="flex-1 max-w-2xl w-full">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <Card>
                        <CardHeader>
                            <CardTitle>Horizontales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm max-h-[400px] overflow-y-auto">
                            {palabrasData.filter(p => p.direction === 'across').map(p => (
                                <p key={p.id} className={cn("cursor-pointer", currentClueId === p.id && "font-bold text-primary")}>
                                  <strong>{p.number}.</strong> {p.clue}
                                </p>
                            ))}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Verticales</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm max-h-[400px] overflow-y-auto">
                           {palabrasData.filter(p => p.direction === 'down').map(p => (
                                <p key={p.id} className={cn("cursor-pointer", currentClueId === p.id && "font-bold text-primary")}>
                                  <strong>{p.number}.</strong> {p.clue}
                                </p>
                           ))}
                        </CardContent>
                    </Card>
                </div>
            </aside>
        </div>
    );
}
