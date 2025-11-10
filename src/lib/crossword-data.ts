import type { CrosswordData } from './types';

export const SUSTAINABILITY_PUZZLE: CrosswordData = {
  title: "Transformación Sostenible",
  grid: [
    ["S", "O", "S", "T", "E", "N", "I", "B", "I", "L", "I", "D", "A", "D", "#"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "T"],
    ["D", "E", "S", "A", "R", "R", "O", "L", "L", "O", "#", "#", "#", "#", "R"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "R", "E", "S", "#", "A"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "E", "#", "I", "#", "N"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "S", "#", "L", "#", "S"],
    ["R", "E", "N", "O", "V", "A", "B", "L", "E", "#", "I", "#", "I", "#", "F"],
    ["#", "#", "#", "#", "#", "#", "#", "#", "#", "#", "L", "#", "E", "#", "O"],
    ["R", "E", "C", "I", "C", "L", "A", "R", "#", "#", "I", "#", "N", "#", "R"],
    ["#", "#", "#", "#", "#", "#", "F", "#", "#", "#", "E", "#", "C", "#", "M"],
    ["#", "E", "C", "O", "E", "F", "I", "C", "I", "E", "N", "C", "I", "A", "A"],
    ["#", "#", "#", "#", "#", "#", "C", "#", "#", "#", "#", "#", "A", "#", "C"],
    ["E", "C", "O", "N", "O", "M", "I", "A", "#", "#", "#", "#", "#", "#", "I"],
    ["#", "#", "#", "#", "#", "N", "#", "#", "#", "#", "#", "#", "#", "#", "O"],
    ["C", "O", "N", "C", "I", "E", "N", "C", "I", "A", "#", "#", "#", "#", "N"],
  ],
  across: [
    { number: 1, clue: "Uso responsable de los recursos naturales para satisfacer las necesidades actuales sin comprometer las futuras.", answer: "SOSTENIBILIDAD" },
    { number: 2, clue: "Proceso que busca equilibrar lo económico, lo social y lo ambiental.", answer: "DESARROLLO" },
    { number: 3, clue: "Energía obtenida de fuentes como el sol, el viento o el agua.", answer: "RENOVABLE" },
    { number: 4, clue: "Acción de volver a utilizar un producto o material para alargar su vida útil.", answer: "RECICLAR" },
    { number: 5, clue: "Práctica que reduce el consumo de materiales y energía.", answer: "ECOEFICIENCIA" },
    { number: 6, clue: "Dimensión que equilibra recursos para el bienestar y la sostenibilidad.", answer: "ECONOMIA" },
    { number: 7, clue: "Valor que impulsa a cuidar el planeta y actuar de forma responsable con el entorno.", answer: "CONCIENCIA" },
  ],
  down: [
    { number: 8, clue: "Cambio positivo hacia un modelo que respeta el medio ambiente y promueve la equidad social.", answer: "TRANSFORMACION" },
    { number: 9, clue: "Capacidad de mantener el equilibrio ecológico y social a largo plazo.", answer: "RESILIENCIA" },
    { number: 10, clue: "Sistema que permite transformar residuos en nuevos productos.", answer: "REUTILIZAR" }, // Esta es una palabra que se cruza, reutilizar también podría ser una pista vertical
  ],
};
