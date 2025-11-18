import type { CrosswordData } from '@/lib/types';

const gridLayout: (string | null)[][] = [
    [null, null, 'R', null, 'E', null, null, null, 'R', null, null, null],
    [null, null, 'E', null, 'M', null, null, null, 'E', null, null, null],
    [null, null, 'C', 'I', 'P', 'R', 'C', 'U', 'U', 'L', 'A', 'R'],
    ['E', 'C', 'O', 'I', 'D', 'E', 'A', 'S', 'S', null, 'V', null],
    [null, null, 'C', 'L', 'N', 'D', 'U', 'R', 'A', 'B', 'L', 'E'],
    [null, null, 'L', 'O', 'D', null, null, null, 'R', null, 'R', null],
    [null, null, 'O', null, 'E', null, null, null, null, null, 'D', null],
    [null, null, null, null, 'D', null, null, null, null, null, 'E', null],
    [null, null, null, null, 'O', null, null, null, null, null, null, null],
    ['C', 'O', 'M', 'P', 'O', 'S', 'T', null, null, null, null, null],
    [null, null, null, null, 'R', null, null, null, null, null, null, null],
];

// Normalize grid to have '#' for nulls and expand to a uniform size if needed
const parseGrid = (layout: (string | null)[][]): string[][] => {
  const maxCols = Math.max(...layout.map(row => row.length));
  return layout.map(row => {
    const newRow = [...row];
    while (newRow.length < maxCols) {
      newRow.push(null);
    }
    return newRow.map(cell => cell || '#');
  });
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
  }
};