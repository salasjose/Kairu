import type { CrosswordData } from '@/app/components/challenges/CrosswordGame';
import { GRID_TEXT, parseGrid } from "@/lib/matrix-to-grid";

export const CROSSWORD_DATA: CrosswordData = {
  title: "Transformación Sostenible",
  grid: parseGrid(GRID_TEXT),
  clues: {
    across: [
      { number: 1, text: "Uso responsable de los recursos naturales para satisfacer las necesidades actuales sin comprometer las futuras." },
      { number: 2, text: "Acción de volver a utilizar un producto o material para alargar su vida útil." },
      { number: 3, text: "Proceso que busca equilibrar lo económico, lo social y lo ambiental." },
      { number: 4, text: "Práctica que reduce el consumo de materiales y energía." },
      { number: 5, text: "Energía obtenida de fuentes como el sol, el viento o el agua." },
    ],
    down: [
      { number: 6, text: "Sistema que permite transformar residuos en nuevos productos." },
      { number: 7, text: "Capacidad de mantener el equilibrio ecológico y social a largo plazo." },
      { number: 8, text: "Valor que impulsa a cuidar el planeta y actuar de forma responsable." },
      { number: 9, text: "Dimensión que equilibra recursos para el bienestar y la sostenibilidad." },
      { number: 10, text: "Cambio positivo hacia un modelo que respeta el medio ambiente y promueve la equidad social." },
    ],
  },
};
