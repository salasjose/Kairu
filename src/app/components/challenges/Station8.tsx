
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { CrosswordData } from "@/lib/types";
import { cn } from "@/lib/utils";

const staticPuzzle: CrosswordData = {
  grid: [
    ["#", "#", "F", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "L", "#", "V", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "O", "#", "E", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["S", "U", "E", "L", "O", "#", "#", "A", "#", "#", "#", "B", "#", "#", "#"],
    ["#", "#", "A", "#", "R", "#", "S", "#", "A", "G", "U", "A", "#", "C", "#"],
    ["#", "F", "A", "U", "N", "A", "#", "L", "B", "O", "S", "Q", "U", "E", "#"],
    ["R", "E", "C", "I", "C", "L", "A", "R", "#", "#", "#", "E", "#", "M", "#"],
    ["I", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "P", "#"],
    ["O", "#", "H", "U", "E", "L", "L", "A", "#", "#", "#", "#", "#", "O", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "V", "I", "D", "A", "#", "T"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["S", "O", "S", "T", "E", "N", "I", "B", "L", "E", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
  ],
  across: [
    { number: 4, clue: "Capa superior de la tierra, vital para la agricultura.", answer: "SUELO" },
    { number: 6, clue: "Conjunto de animales de una región.", answer: "FAUNA" },
    { number: 7, clue: "Proceso para convertir residuos en nuevos productos.", answer: "RECICLAR" },
    { number: 9, clue: "Recurso hídrico esencial para la vida.", answer: "AGUA" },
    { number: 8, clue: "Medida del impacto humano en el ambiente (____ ecológica).", answer: "HUELLA" },
    { number: 10, clue: "La biodiversidad es la variedad de...", answer: "VIDA" },
    { number: 12, clue: "Desarrollo que satisface las necesidades del presente sin comprometer las del futuro.", answer: "SOSTENIBLE" },
    { number: 5, clue: "Extensa área de árboles.", answer: "BOSQUE" },
    { number: 2, clue: "Corriente de agua natural.", answer: "RIO" },
  ],
  down: [
    { number: 1, clue: "Organismos que realizan la fotosíntesis.", answer: "FLORA" },
    { number: 3, clue: "Sinónimo de ecológico.", answer: "VERDE" },
    { number: 4, clue: "Capa gaseosa que rodea la Tierra.", answer: "AIRE" },
    { number: 5, clue: "Astro rey que nos da energía.", answer: "SOL" },
    { number: 11, clue: "Proceso por el cual los residuos se descomponen naturalmente.", answer: "COMPOST" },
    { number: 2, clue: "Corriente de agua natural.", answer: "RIO" },
  ],
};

const cluePositions: { [key: string]: number } = {
  "0-2": 1, 
  "3-0": 4, 
  "1-4": 3, 
  "5-1": 6, 
  "6-0": 7, 
  "8-2": 8, 
  "4-8": 9,
  "9-9": 10,
  "4-13": 11,
  "11-0": 12,
  "5-7": 5,
  "6-1": 2, // RIO horizontal
};


export default function Station8() {
  const [puzzle, setPuzzle] = useState<CrosswordData | null>(staticPuzzle);
  const [userGrid, setUserGrid] = useState<string[][] | null>(staticPuzzle.grid.map(row => row.map(cell => (cell === "#" || !/^[A-Z]$/.test(cell) ? "#" : ""))));
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  useEffect(() => {
    if (puzzle) {
      const numRows = puzzle.grid.length;
      const numCols = puzzle.grid[0]?.length || 0;
      inputRefs.current = Array(numRows).fill(null).map(() => Array(numCols).fill(null));
    }
  }, [puzzle]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
    if (!userGrid) return;
    const value = e.target.value.toUpperCase().slice(-1);
    const newUserGrid = userGrid.map(r => [...r]);
    newUserGrid[row][col] = value;
    setUserGrid(newUserGrid);
    setIsCorrect(null); // Reset correctness check on change

    if (value && col < userGrid[0].length - 1 && inputRefs.current[row][col + 1]) {
      inputRefs.current[row][col + 1]?.focus();
    }
  };

   const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    if (!userGrid) return;
    let nextRow = row, nextCol = col;
    let moved = false;
    
    let numRows = userGrid.length;
    let numCols = userGrid[0]?.length || 0;

    switch (e.key) {
        case 'ArrowUp': e.preventDefault(); nextRow = row > 0 ? row - 1 : numRows - 1; moved = true; break;
        case 'ArrowDown': e.preventDefault(); nextRow = row < numRows - 1 ? row + 1 : 0; moved = true; break;
        case 'ArrowLeft': e.preventDefault(); nextCol = col > 0 ? col - 1 : numCols - 1; moved = true; break;
        case 'ArrowRight': e.preventDefault(); nextCol = col < numCols - 1 ? col + 1 : 0; moved = true; break;
        case 'Backspace':
            if (!userGrid[row][col] && col > 0) {
              const prevRef = inputRefs.current[row][col-1];
               if(prevRef) {
                  e.preventDefault();
                  prevRef.focus();
               }
            }
            return;
        default: return;
    }

    if (moved) {
       for(let i = 0; i < numRows * numCols; i++) {
            const targetRef = inputRefs.current[nextRow]?.[nextCol];
            if(targetRef) {
                targetRef.focus();
                return;
            }
            switch (e.key) {
                case 'ArrowUp': nextRow = nextRow > 0 ? nextRow - 1 : numRows - 1; break;
                case 'ArrowDown': nextRow = nextRow < numRows - 1 ? nextRow + 1 : 0; break;
                case 'ArrowLeft': nextCol = nextCol > 0 ? nextCol - 1 : numCols - 1; break;
                case 'ArrowRight': nextCol = nextCol < numCols - 1 ? nextCol + 1 : 0; break;
            }
        }
    }
}, [userGrid]);


  const checkSolution = () => {
    if (!puzzle || !userGrid) return;
    for (let r = 0; r < puzzle.grid.length; r++) {
      for (let c = 0; c < puzzle.grid[r].length; c++) {
        const cell = puzzle.grid[r][c];
        if (/^[A-Z]$/.test(cell) && cell !== userGrid[r][c]) {
          setIsCorrect(false);
          toast({ title: "No del todo...", description: "Algunas letras son incorrectas. ¡Sigue intentando!", variant: "destructive" });
          return;
        }
      }
    }
    setIsCorrect(true);
    toast({ title: "¡Correcto!", description: "¡Has resuelto el crucigrama!" });
  };
  
  const solvePuzzle = () => {
    if (!puzzle) return;
    const solvedGrid = puzzle.grid.map(row => row.map(cell => /^[A-Z]$/.test(cell) ? cell : ''));
    setUserGrid(solvedGrid);
    setIsCorrect(true);
    toast({ title: "¡Crucigrama Resuelto!", description: "Las respuestas han sido reveladas." });
  };

  const handleComplete = () => {
    if (isCorrect !== true) {
      checkSolution();
      return false;
    }
    return isCorrect === true;
  }
  
  const renderCell = (cell: string, r: number, c: number) => {
    if (cell === "#") {
        return <div key={`${r}-${c}`} className="bg-foreground/20 aspect-square" />;
    }
    
    const clueNumber = cluePositions[`${r}-${c}`];

    return (
        <div key={`${r}-${c}`} className="relative bg-card">
            {clueNumber && <span className="absolute top-0 left-0.5 text-xxs text-muted-foreground font-bold">{clueNumber}</span>}
            <input
                ref={el => {
                    if (!inputRefs.current[r]) inputRefs.current[r] = [];
                    inputRefs.current[r][c] = el;
                }}
                type="text"
                maxLength={1}
                value={userGrid?.[r]?.[c] || ""}
                onChange={(e) => handleInputChange(e, r, c)}
                onKeyDown={(e) => handleKeyDown(e, r, c)}
                className={cn("w-full h-full aspect-square text-center uppercase font-bold text-sm md:text-base bg-transparent focus:outline-none focus:ring-2 focus:ring-primary z-10",
                isCorrect === false && userGrid?.[r]?.[c] && cell !== userGrid?.[r]?.[c] ? "bg-destructive/20 text-destructive" : "",
                isCorrect === true ? "bg-primary/20 text-primary" : ""
                )}
                disabled={isCorrect === true}
            />
        </div>
    );
  }

  return (
    <ChallengeContainer
      stationId={8}
      title="Station 8: Crucigrama Ambiental"
      description="Pon a prueba tu vocabulario ambiental resolviendo este crucigrama."
      onChallengeComplete={handleComplete}
    >
      {!puzzle || !userGrid ? (
        <p className="text-center">Cargando crucigrama...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="flex justify-center">
            <div className="grid grid-cols-15 gap-0.5 bg-muted-foreground p-1 rounded-md aspect-square max-w-lg w-full" style={{ gridTemplateColumns: 'repeat(15, minmax(0, 1fr))' }}>
              {puzzle.grid.map((row, r) =>
                row.map((cell, c) => renderCell(cell, r, c))
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-bold text-lg mb-2 font-headline text-primary">Horizontales</h3>
              <ul className="space-y-1">
                {puzzle.across.map(clue => <li key={`a-${clue.number}`}><b>{clue.number}.</b> {clue.clue}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 font-headline text-primary">Verticales</h3>
              <ul className="space-y-1">
                {puzzle.down.map(clue => <li key={`d-${clue.number}`}><b>{clue.number}.</b> {clue.clue}</li>)}
              </ul>
            </div>
          </div>
           <div className="md:col-span-2 text-center mt-4 flex justify-center gap-4">
              <Button onClick={checkSolution} disabled={isCorrect === true}>Verificar mis Respuestas</Button>
              <Button onClick={solvePuzzle} variant="outline" disabled={isCorrect === true}>Resolver Crucigrama</Button>
           </div>
        </div>
      )}
    </ChallengeContainer>
  );
}

    