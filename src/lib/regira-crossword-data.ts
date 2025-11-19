
import type { CrosswordData } from '@/lib/types';

const gridLayout: (string | null)[][] = [
  
  [null, null, null, null, null, 'E', null, null, null, null, null, null],
  [null, null, null, 'R', null, 'M', null, 'R', null, null, null, null],
  [null, null, null, 'E', null, 'P', null, 'E', null, null, null, null],
  [null, null, null, 'C', 'I',  'R', 'C',  'U','L', 'A', 'R', null],
  ['E',  'C',  'O',  'I', 'D', 'E', 'A', 'S', null, null, null, null],
  [null, null, null, 'C', null, 'N', null, 'A', null, null, null, 'V'],
  [null, null, null, 'L', null, 'D', 'U', 'R', 'A', 'B', 'L', 'E'],
  [null, null, null, 'O', null, 'E', null, null, null, null, null, 'R'],
  [null, null, null, null, null, 'D', null, null, null, null, null, 'D'],
  [null, 'C',  'O', 'M',   'P',  'O', 'S', 'T', null, null, null, 'E'],
  [null, null, null, null, null, 'R', null, null, null, null, null, null],
];


// Normalize grid to have '#' for nulls and expand to a uniform size of 15x15
const parseGrid = (layout: (string | null)[][]): string[][] => {
  const size = 15;
  const newGrid: string[][] = Array.from({ length: size }, () => Array(size).fill('#'));

  for (let r = 0; r < Math.min(layout.length, size); r++) {
    for (let c = 0; c < Math.min(layout[r].length, size); c++) {
      newGrid[r][c] = (layout[r][c] || '#').toUpperCase();
    }
  }
  return newGrid;
};

export const REGIRA_CROSSWORD_DATA: CrosswordData = {
  grid: parseGrid(gridLayout),
  clues: {
    across: [
        { number: 5, clue: 'Modelo que evita desperdicios al mantener los materiales en uso por más tiempo.', answer: 'CIRCULAR' },
        { number: 6, clue: 'Ideas creativas para cuidar el ambiente y hacer proyectos sostenibles.', answer: 'ECOIDEAS' },
        { number: 7, clue: 'Algo que dura bastante tiempo sin dañarse o romperse.', answer: 'DURABLE' },
        { number: 8, clue: 'Abono natural que se hace con restos de comida y hojas.', answer: 'COMPOST' },
    ],
    down: [
        { number: 1, clue: 'Acción de convertir algo usado en un nuevo objeto útil.', answer: 'RECICLO' },
        { number: 2, clue: 'Persona que crea ideas y proyectos para hacer cosas nuevas.', answer: 'EMPRENDEDOR' },
        { number: 3, clue: 'Volver a usar un objeto sin botarlo para darle una segunda vida.', answer: 'REUSAR' },
        { number: 4, clue: 'Color que se relaciona con la naturaleza y el cuidado del planeta.', answer: 'VERDE' },
    ],
  },
};
