"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { CrosswordData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { handleGenerateCrossword } from "@/app/actions";
import { Skeleton } from "@/components/ui/skeleton";

type Direction = "across" | "down";
type CellStatus = "correct" | "incorrect" | "neutral";

type StartMap = {
  number: number;
  direction: Direction;
  row: number;
  col: number;
  length: number;
  answer: string;
  clue: string;
};

function stripDiacritics(s: string) {
  if (!s) return "";
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export default function CrosswordGame({
  topic,
  onBack,
  onComplete,
  staticData,
}: {
  topic: string;
  onBack: () => void;
  onComplete: () => void;
  staticData?: CrosswordData;
}) {
  const [gridData, setGridData] = useState<CrosswordData | null>(staticData || null);
  const [gridState, setGridState] = useState<string[][]>([]);
  const [cellStatuses, setCellStatuses] = useState<CellStatus[][]>([]);
  const [isLoading, setIsLoading] = useState(!staticData);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<Direction>("across");

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  const rows = gridData?.grid.length ?? 0;
  const cols = gridData?.grid[0]?.length ?? 0;

  const canonizedGrid = useMemo(() => {
    if (!gridData) return [];
    return gridData.grid.map((row) =>
      row.map((cell) => (cell === "#" ? "#" : stripDiacritics(cell.toUpperCase())))
    );
  }, [gridData]);

  const initializeGrid = useCallback((data: CrosswordData) => {
    const initialState = data.grid.map((row) => row.map((cell) => (cell === "#" ? "#" : "")));
    const initialStatuses = data.grid.map((row) => row.map(() => "neutral" as CellStatus));

    setGridState(initialState);
    setCellStatuses(initialStatuses);

    inputRefs.current = Array.from({ length: data.grid.length }, () =>
      Array.from({ length: data.grid[0].length }, () => null)
    );

    setIsComplete(false);
    setShowErrors(false);
    setSelectedCell(null);
    setDirection("across");
  }, []);

  const generateGame = useCallback(async () => {
    if (staticData) {
      setGridData(staticData);
      initializeGrid(staticData);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setGridData(null);

    try {
      const result = await handleGenerateCrossword(topic, 15);

      if (result.success && result.data) {
        setGridData(result.data);
        initializeGrid(result.data);
      } else {
        throw new Error(result.error || "No se pudo generar el crucigrama.");
      }
    } catch (err: any) {
      const msg = err?.message ?? "No se pudo generar el crucigrama.";
      setError(msg);
      toast({
        title: "Error de Generación",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [topic, staticData, initializeGrid]);

  useEffect(() => {
    generateGame();
  }, [generateGame]);

  const starts = useMemo<StartMap[]>(() => {
    if (!gridData) return [];
    const numberedStarts = new Map<string, number>();
    let currentNumber = 1;

    const allClues = [
        ...gridData.across.map(c => ({...c, direction: 'across' as Direction})),
        ...gridData.down.map(c => ({...c, direction: 'down' as Direction}))
    ];

    allClues.sort((a,b) => a.number - b.number);
    
    const out: StartMap[] = [];

    for (const clue of allClues) {
        let found = false;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                if(canonizedGrid[r][c] === '#') continue;

                const word = stripDiacritics(clue.answer.toUpperCase());
                let matches = true;

                if (clue.direction === 'across') {
                    if (c + word.length > cols) continue;
                    // Check if it's a valid start
                    if (c > 0 && canonizedGrid[r][c-1] !== '#') continue;

                    for(let i = 0; i < word.length; i++) {
                        if (c + i >= cols || canonizedGrid[r][c+i] !== word[i]) {
                           matches = false;
                           break;
                        }
                    }
                     if (matches && (c + word.length === cols || canonizedGrid[r][c+word.length] === '#')) {
                         out.push({ ...clue, row: r, col: c, length: word.length });
                         found = true;
                         break;
                     }
                } else { // down
                    if (r + word.length > rows) continue;
                    // Check if it's a valid start
                    if (r > 0 && canonizedGrid[r-1][c] !== '#') continue;

                     for(let i = 0; i < word.length; i++) {
                        if (r + i >= rows || canonizedGrid[r+i][c] !== word[i]) {
                           matches = false;
                           break;
                        }
                    }
                     if (matches && (r + word.length === rows || canonizedGrid[r+word.length][c] === '#')) {
                        out.push({ ...clue, row: r, col: c, length: word.length });
                        found = true;
                        break;
                     }
                }
            }
            if (found) break;
        }
    }
    return out;
  }, [gridData, rows, cols, canonizedGrid]);


  const startsByCell = useMemo(() => {
    const map = new Map<string, { across?: StartMap; down?: StartMap }>();
    for (const st of starts) {
      for (let i = 0; i < st.length; i++) {
        const r = st.direction === "down" ? st.row + i : st.row;
        const c = st.direction === "across" ? st.col + i : st.col;
        const key = `${r},${c}`;
        const entry = map.get(key) ?? {};
        entry[st.direction] = st;
        map.set(key, entry);
      }
    }
    return map;
  }, [starts]);

  const getCurrentStart = useCallback((r: number, c: number, dir: Direction): StartMap | undefined => {
    const entry = startsByCell.get(`${r},${c}`);
    return entry?.[dir];
  }, [startsByCell]);


  const moveToNextCell = (r: number, c: number, dir: Direction, backwards = false) => {
    if (!gridData) return;
    let rr = r;
    let cc = c;
    while (true) {
      if (dir === "across") cc += backwards ? -1 : 1;
      else rr += backwards ? -1 : 1;

      if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) break;
      if (gridData.grid[rr][cc] !== "#") {
        inputRefs.current[rr][cc]?.focus();
        setSelectedCell({ row: rr, col: cc });
        return;
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
    if (isComplete) return;

    let value = stripDiacritics(e.target.value.toUpperCase());
    if (value.length > 1) value = value.charAt(value.length - 1);

    const next = gridState.map((r) => r.slice());
    next[row][col] = value;
    setGridState(next);

    const st = getCurrentStart(row, col, direction);
    if (st) {
      const statuses = cellStatuses.map((r) => r.slice());
      for (let i = 0; i < st.length; i++) {
        const rr = st.direction === "down" ? st.row + i : st.row;
        const cc = st.direction === "across" ? st.col + i : st.col;
        if (gridData?.grid[rr][cc] !== "#") statuses[rr][cc] = "neutral";
      }
      setCellStatuses(statuses);
    }
    setShowErrors(false);

    if (value) moveToNextCell(row, col, direction, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    if (e.key === "Backspace" && !gridState[row][col]) moveToNextCell(row, col, direction, true);
    if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      setDirection((d) => (d === "across" ? "down" : "across"));
    }
    if (e.key === "ArrowRight") { e.preventDefault(); setDirection("across"); moveToNextCell(row, col, "across", false); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setDirection("across"); moveToNextCell(row, col, "across", true); }
    if (e.key === "ArrowDown") { e.preventDefault(); setDirection("down"); moveToNextCell(row, col, "down", false); }
    if (e.key === "ArrowUp") { e.preventDefault(); setDirection("down"); moveToNextCell(row, col, "down", true); }
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gridData || gridData.grid[row][col] === "#") return;
    if (selectedCell?.row === row && selectedCell?.col === col) {
      const entry = startsByCell.get(`${row},${col}`);
      if (entry?.across && entry?.down) {
          setDirection((prev) => (prev === "across" ? "down" : "across"));
      }
    } else {
      setSelectedCell({ row, col });
      const entry = startsByCell.get(`${row},${col}`);
      if (entry?.across && !entry?.down) setDirection("across");
      else if (!entry?.across && entry?.down) setDirection("down");
    }
    inputRefs.current[row][col]?.focus();
  };

  const checkAnswers = () => {
    if (!gridData) return;

    let allCorrect = true;
    const statuses = cellStatuses.map((r) => r.slice());

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (canonizedGrid[r][c] !== "#") {
          if (gridState[r][c] === canonizedGrid[r][c]) statuses[r][c] = "correct";
          else {
            statuses[r][c] = "incorrect";
            allCorrect = false;
          }
        }
      }
    }
    setCellStatuses(statuses);

    if (allCorrect) {
      setIsComplete(true);
      setShowErrors(false);
      toast({ title: "¡Felicidades!", description: "Has completado el crucigrama correctamente." });
      setTimeout(onComplete, 1200);
    } else {
      setShowErrors(true);
      setIsComplete(false);
      toast({
        title: "Casi listo",
        description: "Algunas respuestas son incorrectas. ¡Sigue intentando!",
        variant: "destructive",
      });
    }
  };

  const resetGame = () => {
    if (gridData) initializeGrid(gridData);
  };

  const highlightedCells = useMemo(() => {
    if (!selectedCell || !gridData) return [];
    const st = getCurrentStart(selectedCell.row, selectedCell.col, direction);
    if (!st) return [{ r: selectedCell.row, c: selectedCell.col }];
    const cells: { r: number; c: number }[] = [];
    for (let i = 0; i < st.length; i++) {
      const r = st.direction === "down" ? st.row + i : st.row;
      const c = st.direction === "across" ? st.col + i : st.col;
      if (gridData.grid[r]?.[c] !== "#") cells.push({ r, c });
    }
    return cells;
  }, [selectedCell, direction, gridData, getCurrentStart]);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center">
        <h2 className="text-2xl font-bold font-headline mb-4">Generando Crucigrama...</h2>
        <p className="text-muted-foreground mb-4">La IA está creando tu reto. Esto puede tardar un momento...</p>
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
          <Button onClick={generateGame}><RefreshCw className="mr-2" />Intentar de Nuevo</Button>
        </div>
      </div>
    );
  }

  if (!gridData) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center">
        <p>No se pudieron cargar los datos del crucigrama.</p>
        <Button onClick={onBack} variant="outline" className="mt-4">Volver</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-4 max-w-7xl mx-auto items-start">
      <div className="w-full lg:w-auto">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a los retos
        </Button>

        <div
          className="grid gap-0.5 bg-black border-2 border-black rounded-sm"
          style={{
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            width: "clamp(320px, 90vw, 640px)",
          }}
        >
          {gridState.map((row, r) =>
            row.map((cell, c) => {
              const isBlack = gridData.grid[r][c] === "#";
              const isHighlighted = highlightedCells.some((hc) => hc.r === r && hc.c === c);
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const status = cellStatuses[r][c];
              
              const startInfo = starts.find(s => s.row === r && s.col === c);

              return (
                <div
                  key={`${r}-${c}`}
                  className={cn(
                    "aspect-square flex items-center justify-center relative",
                    isBlack ? "bg-black" : "bg-white",
                    !isBlack && "cursor-pointer",
                    isSelected && !isBlack && "bg-yellow-200",
                    isHighlighted && !isSelected && !isBlack && "bg-yellow-100/70",
                    status === "correct" && !isBlack && "bg-green-200",
                    status === "incorrect" && !isBlack && "bg-red-200"
                  )}
                  onClick={() => handleCellClick(r, c)}
                >
                  {startInfo && (
                    <span className="absolute top-0 left-0.5 text-[8px] font-bold select-none">
                      {startInfo.number}
                    </span>
                  )}
                  {!isBlack && (
                    <input
                      ref={(el) => { if(inputRefs.current[r]) inputRefs.current[r][c] = el; }}
                      type="text"
                      maxLength={1}
                      value={cell === "#" ? "" : cell}
                      onFocus={() => setSelectedCell({row: r, col: c})}
                      onChange={(e) => handleInput(e, r, c)}
                      onKeyDown={(e) => handleKeyDown(e, r, c)}
                      className={cn(
                        "w-full h-full text-center bg-transparent border-none outline-none text-lg md:text-xl font-bold uppercase",
                        status === "incorrect" && "text-red-700"
                      )}
                      aria-label={`Fila ${r + 1}, Columna ${c + 1}`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={checkAnswers} size="lg">
            <CheckCircle className="mr-2" />
            Comprobar Solución
          </Button>
          <Button onClick={resetGame} size="lg" variant="outline">
            <RefreshCw className="mr-2" />
            Reiniciar
          </Button>
        </div>

        <div className="mt-4 text-center">
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
        </div>
      </div>

      <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Horizontales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm max-h-[400px] overflow-y-auto">
            {gridData.across
              .slice()
              .sort((a, b) => a.number - b.number)
              .map((clue) => (
                <p key={`across-${clue.number}`} className="cursor-pointer" onClick={() => {
                    const start = starts.find(s => s.number === clue.number && s.direction === 'across');
                    if(start) handleCellClick(start.row, start.col);
                }}>
                  <span className="font-bold">{clue.number}.</span> {clue.clue}
                </p>
              ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Verticales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm max-h-[400px] overflow-y-auto">
            {gridData.down
              .slice()
              .sort((a, b) => a.number - b.number)
              .map((clue) => (
                 <p key={`down-${clue.number}`} className="cursor-pointer" onClick={() => {
                    const start = starts.find(s => s.number === clue.number && s.direction === 'down');
                    if(start) handleCellClick(start.row, start.col);
                }}>
                  <span className="font-bold">{clue.number}.</span> {clue.clue}
                </p>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
