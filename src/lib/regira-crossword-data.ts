import type { CrosswordData } from '@/lib/types';

const gridLayout: (string | null)[][] = [
    [null,   null,  null,    null,    null,    null,    'E',    null,    null,    null,    null,    null,    null,    null,   'D'],
    [null,    null,   'E',    null,   'I',    null,   null,   null,   null,   null,   null,   null,   'O',    null,   'U'],
    [null,    null,   'U',    null,   'R',    'E',    'C',    'I',    'C',    'L',    'A',    'R',    'T',    null,   'R'],
    [null,    null,   'S',    null,   'C',    null,   null,   'P',    null,   null,   'B',    null,   'E',    null,   'A'],
    [null,    null,   'A',    null,   'U',    null,   'C',    'O',    'M',    'P',    'O',    'S',    'T',    null,   'B'],
    [null,    null,   'R',    null,   'L',    null,   'I',    null,   null,   'D',    null,   'I',    null,   null,   'L'],
    [null,    null,   null,   null,   'A',    null,   'R',    null,   null,   'O',    null,   'N',    null,   null,   'E'],
    [null,    null,   null,   null,   'R',    null,   'C',    null,   null,   'S',    null,   'O',    null,   null,   null],
    [null,    null,   null,   null,   null,   null,   'U',    null,   null,   'O',    null,   'S',    null,   null,   null],
    [null,    null,   null,   null,   null,   null,   'L',    null,   null,   'T',    null,   'T',    null,   null,   null],
    [null,    null,   null,   null,   null,   null,   'A',    null,   null,   'E',    null,   'E',    null,   null,   null],
    [null,   null,   null,   null,   null,   null,   'R',    null,   null,   'N',    null,   'N',    null,   null,   null],
    [null,   null,   null,   null,   null,   null,   null,   null,   null,   'I',    null,   'I',    null,   null,   null],
    [null,   null,   null,   null,   null,   null,   null,   null,   null,   'B',    null,   'B',    null,   null,   null],
    [null,   null,   null,   null,   null,   null,   null,   null,   null,   'L',    null,   'L',    null,   null,   null],
];

// Normalize grid to have '#' for nulls
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
      { number: 6, clue: 'Ideas creativas para cuidar el ambiente y hacer proyectos sostenibles.', answer: 'ECOIDEAS' },
      { number: 1, clue: 'Acción de convertir algo usado en un nuevo objeto útil.', answer: 'RECICLAR' },
      { number: 8, clue: 'Abono natural que se hace con restos de comida y hojas.', answer: 'COMPOST' },
      { number: 7, clue: 'Algo que dura bastante tiempo sin dañarse o romperse.', answer: 'DURABLE' },
    ],
    down: [
      { number: 2, clue: 'Persona que crea ideas y proyectos para hacer cosas nuevas.', answer: 'EMPRENDEDOR' },
      { number: 3, clue: 'Volver a usar un objeto sin botarlo para darle una segunda vida.', answer: 'REUSAR' },
      { number: 4, clue: 'Color que se relaciona con la naturaleza y el cuidado del planeta.', answer: 'VERDE' },
      { number: 5, clue: 'Modelo que evita desperdicios al mantener los materiales en uso por más tiempo.', answer: 'CIRCULAR' },
    ],
  },
};
