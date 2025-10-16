"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { CrosswordData } from "@/lib/types";
import { cn } from "@/lib/utils";

const staticPuzzle: CrosswordData = {
  grid: [
    ["#", "#", "#", "1", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "2", "S", "3", "U", "E", "L", "O", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "O", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["4", "F", "A", "U", "N", "A", "#", "#", "#", "7", "#", "8", "#", "#", "#"],
    ["#", "#", "#", "N", "#", "#", "#", "#", "9", "A", "G", "U", "A", "#", "#"],
    ["#", "#", "6", "R", "E", "C", "I", "C", "L", "A", "R", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "B", "#", "I", "#", "#", "#"],
    ["#", "11", "R", "I", "O", "#", "#", "10", "B", "O", "S", "Q", "U", "E", "#"],
    ["#", "#", "#", "A", "#", "#", "#", "#", "#", "S", "#", "O", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "12", "V", "I", "D", "A", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "13", "H", "U", "E", "L", "L", "A", "#", "#", "#", "#", "#", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#"],
    ["14", "S", "O", "S", "T", "E", "N", "I", "B", "L", "E", "#", "#", "#", "#"],
  ],
  across: [
    { number: 2, clue: "Capa superior de la tierra, vital para la agricultura.", answer: "SUELO" },
    { number: 4, clue: "Conjunto de animales de una región.", answer: "FAUNA" },
    { number: 6, clue: "Proceso para convertir residuos en nuevos productos.", answer: "RECICLAR" },
    { number: 9, clue: "Recurso hídrico esencial para la vida.", answer: "AGUA" },
    { number: 11, clue: "Corriente de agua natural.", answer: "RIO" },
    { number: 12, clue: "La biodiversidad es la variedad de...", answer: "VIDA" },
    { number: 13, clue: "Medida del impacto humano en el ambiente (____ ecológica).", answer: "HUELLA" },
    { number: 14, clue: "Desarrollo que satisface las necesidades del presente sin comprometer las del futuro.", answer: "SOSTENIBLE" },
  ],
  down: [
    { number: 1, clue: "Organismos que realizan la fotosíntesis.", answer: "FLORA" },
    { number: 3, clue: "Sinónimo de ecológico.", answer: "VERDE" },
    { number: 5, clue: "Capa gaseosa que rodea la Tierra.", answer: "AIRE" },
    { number: 7, clue: "Astro rey que nos da energía.", answer: "SOL" },
    { number: 8, clue: "Extensa área de árboles.", answer: "BOSQUE" },
    { number: 10, clue: "Proceso por el cual los residuos se descomponen naturalmente.", answer: "COMPOST" },
  ],
};


export default function Station8() {
  const [puzzle, setPuzzle] = useState<CrosswordData | null>(staticPuzzle);
  const [userGrid, setUserGrid] = useState<string[][] | null>(staticPuzzle.grid.map(row => row.map(cell => (cell === "#" || !/^[A-Z]$/.test(cell) ? "#" : ""))));
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  useEffect(() => {
    if (puzzle) {
      inputRefs.current = Array(puzzle.grid.length).fill(null).map(() => Array(puzzle.grid[0].length).fill(null));
    }
  }, [puzzle]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
    if (!userGrid) return;
    const value = e.target.value.toUpperCase().slice(-1);
    const newUserGrid = userGrid.map(r => [...r]);
    newUserGrid[row][col] = value;
    setUserGrid(newUserGrid);

    if (value && col < userGrid[0].length - 1 && inputRefs.current[row][col + 1]) {
      inputRefs.current[row][col + 1]?.focus();
    }
  };

   const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    if (!userGrid) return;
    let nextRow = row, nextCol = col;
    let moved = false;
    switch (e.key) {
        case 'ArrowUp': e.preventDefault(); nextRow = row > 0 ? row - 1 : userGrid.length - 1; moved = true; break;
        case 'ArrowDown': e.preventDefault(); nextRow = row < userGrid.length - 1 ? row + 1 : 0; moved = true; break;
        case 'ArrowLeft': e.preventDefault(); nextCol = col > 0 ? col - 1 : userGrid[0].length - 1; moved = true; break;
        case 'ArrowRight': e.preventDefault(); nextCol = col < userGrid[0].length - 1 ? col + 1 : 0; moved = true; break;
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
       for(let i = 0; i < userGrid.length * userGrid[0].length; i++) {
            const targetRef = inputRefs.current[nextRow]?.[nextCol];
            if(targetRef) {
                targetRef.focus();
                return;
            }
            switch (e.key) {
                case 'ArrowUp': nextRow = nextRow > 0 ? nextRow - 1 : userGrid.length - 1; break;
                case 'ArrowDown': nextRow = nextRow < userGrid.length - 1 ? nextRow + 1 : 0; break;
                case 'ArrowLeft': nextCol = nextCol > 0 ? nextCol - 1 : userGrid[0].length - 1; break;
                case 'ArrowRight': nextCol = nextCol < userGrid[0].length - 1 ? nextCol + 1 : 0; break;
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
  
  const handleComplete = () => {
    return isCorrect === true;
  }
  
  const renderCell = (cell: string, r: number, c: number) => {
    if (cell === "#") {
        return <div key={`${r}-${c}`} className="bg-foreground/20" />;
    }
    
    const isLetter = /^[A-Z]$/.test(cell);
    
    let clueNumber: number | null = null;
    if (isLetter) {
        puzzle?.across.forEach(clue => {
            if (puzzle.grid[r][c-1] === '#' && puzzle.grid[r][c] === clue.answer[0]) {
                 clueNumber = clue.number
            }
        });
        puzzle?.down.forEach(clue => {
             if ((r === 0 || puzzle.grid[r-1][c] === '#') && puzzle.grid[r][c] === clue.answer[0]) {
                 clueNumber = clue.number;
             }
        });

        const acrossClue = puzzle?.across.find(cl => cl.number === clueNumber);
        if (acrossClue && userGrid) {
            let match = true;
            for(let i=0; i<acrossClue.answer.length; i++) {
                if(puzzle.grid[r][c+i] !== acrossClue.answer[i]) match = false;
            }
            if (!match) clueNumber = null;
        }

        const downClue = puzzle?.down.find(cl => cl.number === clueNumber);
         if (downClue && userGrid) {
            let match = true;
            for(let i=0; i<downClue.answer.length; i++) {
                if( r+i >= puzzle.grid.length || puzzle.grid[r+i][c] !== downClue.answer[i]) match = false;
            }
            if (!match) clueNumber = null;
        }


        // Re-check logic for numbers
        const acrossStart = puzzle?.across.find(a => {
            const word = a.answer;
            return puzzle.grid[r][c] === word[0] && (c === 0 || puzzle.grid[r][c-1] === '#') && puzzle.grid[r][c+word.length-1] === word[word.length-1]
        });

        const downStart = puzzle?.down.find(d => {
             const word = d.answer;
            return puzzle.grid[r][c] === word[0] && (r === 0 || puzzle.grid[r-1][c] === '#') && (r + word.length -1 < puzzle.grid.length && puzzle.grid[r+word.length-1][c] === word[word.length-1]);
        });
       
        if(acrossStart) clueNumber = acrossStart.number;
        if(downStart) clueNumber = downStart.number;

         if (r === 1 && c === 2) clueNumber = 2;
         if (r === 1 && c === 4) clueNumber = 3;
         if (r === 3 && c === 0) clueNumber = 4;
         if (r === 5 && c === 2) clueNumber = 6;
         if (r === 3 && c === 9) clueNumber = 7;
         if (r === 3 && c === 11) clueNumber = 8;
         if (r === 4 && c === 8) clueNumber = 9;
         if (r === 6 && c === 9) clueNumber = 10;
         if (r === 7 && c === 1) clueNumber = 11;
         if (r === 9 && c === 5) clueNumber = 12;
         if (r === 11 && c === 2) clueNumber = 13;
         if (r === 13 && c === 0) clueNumber = 14;


    }

    return (
        <div key={`${r}-${c}`} className="relative bg-card">
            {clueNumber && <span className="absolute top-0 left-0.5 text-xxs text-muted-foreground">{clueNumber}</span>}
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
                className={cn("w-full h-full aspect-square text-center uppercase font-bold text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-primary z-10",
                isCorrect === false && userGrid?.[r]?.[c] && cell !== userGrid?.[r]?.[c] ? "bg-destructive/20 text-destructive" : "",
                isCorrect === true ? "bg-primary/20 text-primary" : ""
                )}
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
           <div className="md:col-span-2 text-center mt-4">
              <Button onClick={checkSolution} disabled={isCorrect === true}>Verificar mis Respuestas</Button>
           </div>
        </div>
      )}
    </ChallengeContainer>
  );
}
