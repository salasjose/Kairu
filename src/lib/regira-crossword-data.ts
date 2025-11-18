import type { CrosswordData } from '@/lib/types';

const gridLayout: (string | null)[][] = [
    [null, null, null, 'E', null, null, null, null, null, null, null, null],
    [null, 'R', 'E', 'C', 'I', 'C', 'L', 'O', null, null, null, null],
    ['E', 'M', 'P', 'R', 'E', 'N', 'D', 'E', 'D', 'O', 'R', null],
    ['C', null, null, 'E', null, null, null, null, null, 'C', null, null],
    ['O', null, null, 'U', 'D', 'U', 'R', 'A', 'B', 'L', 'E', null],
    ['I', null, null, 'S', null, null, null, null, 'C', null, null, 'V'],
    ['D', null, 'C', 'A', null, null, null, 'V', 'O', 'M', 'P', 'E'],
    ['E', null, 'O', 'R', null, null, null, 'E', null, 'P', null, 'R'],
    ['A', null, 'M', null, null, null, null, 'R', null, 'O', null, 'D'],
    ['S', null, 'P', null, null, null, null, 'D', null, 'S', null, 'E'],
    [null, null, 'O', null, null, null, null, 'E', null, 'T', null, null],
    [null, null, 'S', 'T', null, null, null, null, null, null, null, null],
];


// Normalize grid to have '#' for nulls and expand to a uniform size of 12x12
const parseGrid = (layout: (string | null)[][]): string[][] => {
  const size = 12;
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
      { number: 2, clue: 'Persona que crea ideas y proyectos para hacer cosas nuevas.', answer: 'EMPRENDEDOR' },
      { number: 4, clue: 'Algo que dura bastante tiempo sin dañarse o romperse.', answer: 'DURABLE' },
      { number: 5, clue: 'Ideas creativas para cuidar el ambiente y hacer proyectos sostenibles.', answer: 'ECOIDEAS' },
      { number: 6, clue: 'Abono natural que se hace con restos de comida y hojas.', answer: 'COMPOST' },
      { number: 7, clue: 'Modelo que evita desperdicios al mantener los materiales en uso por más tiempo.', answer: 'CIRCULAR' },
    ],
    down: [
      { number: 1, clue: 'Acción de convertir algo usado en un nuevo objeto útil.', answer: 'RECICLO' },
      { number: 3, clue: 'Volver a usar un objeto sin botarlo para darle una segunda vida.', answer: 'REUSAR' },
      { number: 8, clue: 'Color que se relaciona con la naturaleza y el cuidado del planeta.', answer: 'VERDE' },
    ],
  },
};
