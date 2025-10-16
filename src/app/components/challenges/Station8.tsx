"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { handleGenerateCrossword } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { CrosswordData } from "@/lib/types";
import { cn } from "@/lib/utils";

const TOPICS = ["Biodiversity", "Sustainability", "Recycling", "Water Conservation", "Circular Economy"];

export default function Station8() {
  const [puzzle, setPuzzle] = useState<CrosswordData | null>(null);
  const [userGrid, setUserGrid] = useState<string[][] | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const [currentTopic, setCurrentTopic] = useState('');

  const generatePuzzle = () => {
    const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)];
    setCurrentTopic(topic);
    setError(null);
    setPuzzle(null);
    setUserGrid(null);
    setIsCorrect(null);
    startTransition(async () => {
      const result = await handleGenerateCrossword(topic, 10);
      if (result.success && result.data) {
        setPuzzle(result.data);
        const newGrid = result.data.grid.map(row => row.map(cell => (cell === "#" ? "#" : "")));
        setUserGrid(newGrid);
        inputRefs.current = Array(10).fill(null).map(() => Array(10).fill(null));
      } else {
        setError(result.error || "An unknown error occurred.");
        toast({ title: "Generation Failed", description: result.error, variant: "destructive" });
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
    const value = e.target.value.toUpperCase().slice(-1);
    const newUserGrid = userGrid!.map(r => [...r]);
    newUserGrid[row][col] = value;
    setUserGrid(newUserGrid);

    if (value && col < 9 && inputRefs.current[row][col + 1]) {
      inputRefs.current[row][col + 1]?.focus();
    }
  };

   const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    let nextRow = row, nextCol = col;
    switch (e.key) {
        case 'ArrowUp': e.preventDefault(); nextRow = row > 0 ? row - 1 : 9; break;
        case 'ArrowDown': e.preventDefault(); nextRow = row < 9 ? row + 1 : 0; break;
        case 'ArrowLeft': e.preventDefault(); nextCol = col > 0 ? col - 1 : 9; break;
        case 'ArrowRight': e.preventDefault(); nextCol = col < 9 ? col + 1 : 0; break;
        case 'Backspace':
            if (!userGrid![row][col] && col > 0 && inputRefs.current[row][col - 1]) {
                e.preventDefault();
                inputRefs.current[row][col-1]?.focus();
            }
            return;
        default: return;
    }
    // Find next valid cell
    for(let i = 0; i < 100; i++) {
        const targetRef = inputRefs.current[nextRow]?.[nextCol];
        if(targetRef) {
            targetRef.focus();
            return;
        }
        switch (e.key) {
            case 'ArrowUp': nextRow = nextRow > 0 ? nextRow - 1 : 9; break;
            case 'ArrowDown': nextRow = nextRow < 9 ? nextRow + 1 : 0; break;
            case 'ArrowLeft': nextCol = nextCol > 0 ? nextCol - 1 : 9; break;
            case 'ArrowRight': nextCol = nextCol < 9 ? nextCol + 1 : 0; break;
        }
    }
}, [userGrid]);


  const checkSolution = () => {
    if (!puzzle || !userGrid) return;
    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        if (puzzle.grid[r][c] !== "#" && puzzle.grid[r][c] !== userGrid[r][c]) {
          setIsCorrect(false);
          toast({ title: "Not quite!", description: "Some letters are incorrect. Keep trying!", variant: "destructive" });
          return;
        }
      }
    }
    setIsCorrect(true);
    toast({ title: "Correct!", description: "You've solved the puzzle!" });
  };
  
  const handleComplete = () => {
    return isCorrect === true;
  }

  return (
    <ChallengeContainer
      stationId={8}
      title="Station 8: Crossword Challenge"
      description="Test your environmental vocabulary. Generate a random crossword and solve it!"
      onChallengeComplete={handleComplete}
    >
      <div className="text-center mb-6">
        <Button onClick={generatePuzzle} disabled={isPending}>
          {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {puzzle ? "Generate New Puzzle" : "Generate Crossword"}
        </Button>
      </div>

      {isPending && <p className="text-center text-primary">Generating your personal puzzle on "{currentTopic}"...</p>}
      {error && <p className="text-center text-destructive">{error}</p>}

      {puzzle && userGrid && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex justify-center">
            <div className="grid grid-cols-10 gap-0.5 bg-muted-foreground p-1 rounded-md aspect-square max-w-sm w-full">
              {puzzle.grid.map((row, r) =>
                row.map((cell, c) =>
                  cell === "#" ? (
                    <div key={`${r}-${c}`} className="bg-foreground" />
                  ) : (
                    <input
                      key={`${r}-${c}`}
                      ref={el => inputRefs.current[r][c] = el}
                      type="text"
                      maxLength={1}
                      value={userGrid[r][c]}
                      onChange={(e) => handleInputChange(e, r, c)}
                      onKeyDown={(e) => handleKeyDown(e, r, c)}
                      className={cn("w-full aspect-square text-center uppercase font-bold text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary",
                       isCorrect === false && userGrid[r][c] && puzzle.grid[r][c] !== userGrid[r][c] ? "bg-destructive/20 text-destructive" : "",
                       isCorrect === true ? "bg-primary/20 text-primary" : ""
                      )}
                    />
                  )
                )
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-bold text-lg mb-2 font-headline text-primary">Across</h3>
              <ul className="space-y-1">
                {puzzle.across.map(clue => <li key={`a-${clue.number}`}><b>{clue.number}.</b> {clue.clue}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2 font-headline text-primary">Down</h3>
              <ul className="space-y-1">
                {puzzle.down.map(clue => <li key={`d-${clue.number}`}><b>{clue.number}.</b> {clue.clue}</li>)}
              </ul>
            </div>
          </div>
           <div className="md:col-span-2 text-center mt-4">
              <Button onClick={checkSolution} disabled={isCorrect === true}>Check My Answers</Button>
           </div>
        </div>
      )}
    </ChallengeContainer>
  );
}
