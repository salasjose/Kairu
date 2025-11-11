'use server';

/**
 * @fileOverview Generates a crossword puzzle based on environmental education topics.
 *
 * - generateCrosswordPuzzle - A function that generates a crossword puzzle.
 * - CrosswordPuzzleInput - The input type for the generateCrosswordPuzzle function.
 * - CrosswordPuzzleOutput - The return type for the generateCrosswordPuzzle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CrosswordPuzzleInputSchema = z.object({
  topic: z
    .string()
    .describe(
      'The environmental education topic to generate the crossword puzzle for.'
    ),
  size: z.number().describe('The size of the crossword puzzle (e.g., 10 for 10x10).'),
});
export type CrosswordPuzzleInput = z.infer<typeof CrosswordPuzzleInputSchema>;

const CrosswordPuzzleOutputSchema = z.object({
  puzzle: z.string().describe('The crossword puzzle data in JSON format.'),
});
export type CrosswordPuzzleOutput = z.infer<typeof CrosswordPuzzleOutputSchema>;

export async function generateCrosswordPuzzle(
  input: CrosswordPuzzleInput
): Promise<CrosswordPuzzleOutput> {
  return generateCrosswordPuzzleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'crosswordPuzzlePrompt',
  input: {schema: CrosswordPuzzleInputSchema},
  output: {schema: CrosswordPuzzleOutputSchema},
  model: 'googleai/gemini-pro',
  prompt: `Eres un experto generador de crucigramas en español.

  Genera un crucigrama de {{size}}x{{size}} basado en el tema: "{{topic}}".

  La salida DEBE ser un string JSON válido que represente los datos del crucigrama. El JSON debe contener los siguientes campos:

  - 'grid': Un array 2D que representa la cuadrícula del crucigrama. Usa '#' para las casillas negras y letras para las casillas llenas.
  - 'across': Un array de objetos, cada uno con 'number', 'clue', y 'answer' para las pistas horizontales.
  - 'down': Un array de objetos, cada uno con 'number', 'clue', y 'answer' para las pistas verticales.

  Utiliza palabras relacionadas con Sostenibilidad, Transformación, Desarrollo, Resiliencia, Reciclaje, Ecoeficiencia, Renovable, Reutilizar, Economía Circular y Conciencia Ambiental.

  Ejemplo de salida JSON (para un crucigrama más pequeño de 3x3):
  '{"grid":[["A","B","C"],["D","#","E"],["F","G","H"]],"across":[{"number":1,"clue":"Primera letra","answer":"A"},{"number":2,"clue":"Segunda letra","answer":"B"}],"down":[{"number":1,"clue":"Otra letra","answer":"D"},{"number":2,"clue":"Una letra más","answer":"F"}]}'

  Asegúrate de que el crucigrama generado se pueda resolver y que las pistas sean relevantes para el tema especificado. Las pistas y respuestas deben estar en español. No incluyas saltos de línea ni markdown en la salida. El JSON debe ser compacto y en una sola línea.
`,
});

const generateCrosswordPuzzleFlow = ai.defineFlow(
  {
    name: 'generateCrosswordPuzzleFlow',
    inputSchema: CrosswordPuzzleInputSchema,
    outputSchema: CrosswordPuzzleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
