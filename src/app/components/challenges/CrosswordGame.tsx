"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowLeft, CheckCircle, RefreshCw, Eye } from "lucide-react";

/** Tipos */
type Direction = "across" | "down";
type CellStatus = "correct" | "incorrect" | "neutral";

export interface CrosswordData {
  title: string;
  grid: string[][]; // '#' = bloque, letra en mayúscula
  clues: {
    across: { number: number; text: string }[];
    down: { number: number; text: string }[];
  };
}

type Start = { number: number; r: number; c: number; len: number; dir: Direction };

/** Utilidades */
const strip = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();

function deriveStarts(grid: string[][]): { starts: Start[]; numbers: number[][] } {
  const rows = grid.length;
  const cols = grid[0].length;
  const numbers = Array.from({ length: rows }, () => Array(cols).fill(0));
  const starts: Start[] = [];
  let current = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === "#") continue;
      const leftBlocked = c === 0 || grid[r][c - 1] === "#";
      const upBlocked = r === 0 || grid[r - 1][c] === "#";
      let started = false;

      if (leftBlocked && c + 1 < cols && grid[r][c + 1] !== "#") {
        let len = 1;
        while (c + len < cols && grid[r][c + len] !== "#") len++;
        if (!started) current++;
        numbers[r][c] = current;
        starts.push({ number: current, r, c, len, dir: "across" });
        started = true;
      }
      if (upBlocked && r + 1 < rows && grid[r + 1][c] !== "#") {
        let len = 1;
        while (r + len < rows && grid[r + len][c] !== "#") len++;
        if (!started) current++;
        numbers[r][c] = started ? numbers[r][c] : current;
        starts.push({ number: numbers[r][c] || current, r, c, len, dir: "down" });
      }
    }
  }
  return { starts, numbers };
}

function nextCell(grid: string[][], r: number, c: number, dir: Direction, backwards = false) {
  const rows = grid.length, cols = grid[0].length;
  let rr = r, cc = c;
  while (true) {
    if (dir === "across") cc += backwards ? -1 : 1;
    else rr += backwards ? -1 : 1;
    if (rr < 0 || cc < 0 || rr >= rows || cc >= cols) return null;
    if (grid[rr][cc] !== "#") return { r: rr, c: cc };
  }
}

/** Componente principal */
export default function CrosswordGame({
  data,
  onBack,
  onComplete,
}: {
  data: CrosswordData;
  onBack?: () => void;
  onComplete: () => void;
}) {
  const grid = useMemo(() => data.grid.map(row => row.map(v => (v === "#" ? "#" : strip(v)))), [data.grid]);
  const rows = grid.length, cols = grid[0].length;

  const { numbers } = useMemo(() => deriveStarts(grid), [grid]);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>({r: 0, c: 0});
  const [dir, setDir] = useState<Direction>("across");
  const [state, setState] = useState<string[][]>(() =>
    grid.map(row => row.map(cell => (cell === "#" ? "#" : "")))
  );
  const [status, setStatus] = useState<CellStatus[][]>(() =>
    grid.map(row => row.map(() => "neutral"))
  );
  const [showSolution, setShowSolution] = useState(false);

  const refs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: rows }, () => Array(cols).fill(null))
  );

  useEffect(() => {
    if (showSolution) {
      setState(grid.map(row => row.map(cell => (cell === "#" ? "#" : cell))));
      setStatus(grid.map(row => row.map(cell => (cell === "#" ? "neutral" : "correct"))));
    } else {
       // Only reset if it was previously showing the solution
       if (state.some((row, r) => row.some((cell, c) => cell === grid[r][c] && cell !== '#'))) {
           setState(grid.map(row => row.map(cell => (cell === "#" ? "#" : ""))));
           setStatus(grid.map(row => row.map(() => "neutral")));
       }
    }
  }, [showSolution, grid, state]);


  const resetGame = () => {
    setShowSolution(false);
    setState(grid.map(r=>r.map(c=>c==="#"?"#":"")));
    setStatus(grid.map(r=>r.map(()=> "neutral")));
    setSelected({r:0, c:0});
    refs.current[0][0]?.focus();
  }

  const currentWordCells = useMemo(() => {
    if (!selected) return [];
    const { r, c } = selected;
    if (grid[r][c] === "#") return [];
    const cells: { r: number; c: number }[] = [{ r, c }];
    let rr = r, cc = c;
    while (true) {
      const prev = nextCell(grid, rr, cc, dir, true);
      if (!prev) break;
      if ((dir === "across" && prev.r !== rr) || (dir === "down" && prev.c !== cc)) break;
      rr = prev.r; cc = prev.c;
      cells.unshift(prev);
      if ((dir === "across" && (cc === 0 || grid[rr][cc - 1] === "#")) ||
          (dir === "down" && (rr === 0 || grid[rr - 1][cc] === "#"))) break;
    }
    rr = r; cc = c;
    while (true) {
      const nxt = nextCell(grid, rr, cc, dir, false);
      if (!nxt) break;
      if ((dir === "across" && nxt.r !== rr) || (dir === "down" && nxt.c !== cc)) break;
      rr = nxt.r; cc = nxt.c;
      cells.push(nxt);
      if ((dir === "across" && (cc === cols - 1 || grid[rr][cc + 1] === "#")) ||
          (dir === "down" && (rr === rows - 1 || grid[rr + 1][cc] === "#"))) break;
    }
    return cells;
  }, [selected, dir, grid, rows, cols]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>, r: number, c: number) => {
    let v = strip(e.target.value);
    if (v.length > 1) v = v.at(-1)!;

    const next = state.map(row => row.slice());
    next[r][c] = v;
    setState(next);

    if (currentWordCells.length) {
      const st = status.map(row => row.slice());
      for (const { r: rr, c: cc } of currentWordCells) st[rr][cc] = "neutral";
      setStatus(st);
    }

    if (v) {
      const n = nextCell(grid, r, c, dir);
      if (n) {
        setSelected(n);
        refs.current[n.r][n.c]?.focus();
      }
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>, r: number, c: number) => {
    if (e.key === "Backspace" && !state[r][c]) {
      const prev = nextCell(grid, r, c, dir, true);
      if (prev) {
        setSelected(prev);
        refs.current[prev.r][prev.c]?.focus();
      }
    }
    if (e.key === " " || e.key === "Tab") {
      e.preventDefault();
      setDir(d => (d === "across" ? "down" : "across"));
    }
    if (e.key === "ArrowRight") { e.preventDefault(); setDir("across"); move("across", false); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setDir("across"); move("across", true); }
    if (e.key === "ArrowDown") { e.preventDefault(); setDir("down"); move("down", false); }
    if (e.key === "ArrowUp") { e.preventDefault(); setDir("down"); move("down", true); }

    function move(d: Direction, back: boolean) {
      const nxt = nextCell(grid, r, c, d, back);
      if (nxt) { setSelected(nxt); refs.current[nxt.r][nxt.c]?.focus(); }
    }
  };

  const check = () => {
    const st = status.map(row => row.slice());
    let all = true;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c] === "#") continue;
        const ok = state[r][c] && strip(state[r][c]) === grid[r][c];
        st[r][c] = ok ? "correct" : "incorrect";
        if (!ok) all = false;
      }
    }
    setStatus(st);
    if (all) {
        alert("🎉 ¡Completado!");
        onComplete();
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 flex flex-col lg:flex-row gap-8 items-start">
      <div>
        {onBack && (
          <Button variant="ghost" onClick={onBack} className="mb-4 text-white hover:bg-gray-700 hover:text-white">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Button>
        )}
        <div
          className="grid gap-[2px] rounded-md p-2 bg-gray-900"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        >
          {grid.map((row, r) =>
            row.map((cell, c) => {
              const isBlock = cell === "#";
              const isSel = selected?.r === r && selected?.c === c;
              const hi = currentWordCells.some(k => k.r === r && k.c === c);
              const n = numbers[r][c];

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => { if (!isBlock) { setSelected({ r, c }); refs.current[r][c]?.focus(); } }}
                  className={cn(
                    "relative aspect-square flex items-center justify-center border",
                    isBlock
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-300",
                    isSel && !isBlock && "bg-yellow-200",
                    hi && !isSel && !isBlock && "bg-yellow-100/50",
                    status[r][c] === "correct" && "bg-green-200",
                    status[r][c] === "incorrect" && "bg-red-200"
                  )}
                >
                  {n > 0 && !isBlock && (
                    <span className="absolute left-0.5 top-0.5 text-[9px] font-semibold text-gray-600 select-none">
                      {n}
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
                      className="h-full w-full text-center bg-transparent outline-none border-none text-base md:text-xl font-bold uppercase"
                      aria-label={`Fila ${r + 1}, Columna ${c + 1}`}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={check}><CheckCircle className="mr-2 h-4 w-4" />Comprobar</Button>
          <Button variant="outline" onClick={() => setShowSolution(s => !s)}>
            <Eye className="mr-2 h-4 w-4" />
            {showSolution ? "Ocultar solución" : "Ver solución"}
          </Button>
          <Button variant="secondary" onClick={resetGame}>
            <RefreshCw className="mr-2 h-4 w-4" />Reiniciar
          </Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gray-800/60 border-gray-700 text-white">
          <CardHeader><CardTitle>Horizontales</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm max-h-[400px] overflow-y-auto">
            {data.clues.across.map(cl => (
              <p key={`a-${cl.number}`}><span className="font-bold">{cl.number}.</span> {cl.text}</p>
            ))}
          </CardContent>
        </Card>
        <Card className="bg-gray-800/60 border-gray-700 text-white">
          <CardHeader><CardTitle>Verticales</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm max-h-[400px] overflow-y-auto">
            {data.clues.down.map(cl => (
              <p key={`d-${cl.number}`}><span className="font-bold">{cl.number}.</span> {cl.text}</p>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
