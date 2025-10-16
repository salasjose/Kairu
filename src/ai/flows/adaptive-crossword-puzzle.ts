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
  prompt: `You are a crossword puzzle generator expert.

  Generate a crossword puzzle of size {{size}}x{{size}} based on the topic: {{topic}}.

  The output MUST be valid JSON that represents the crossword puzzle data. The JSON should contain the following fields:

  - 'grid': A 2D array representing the crossword grid. Use '#' for black squares and letters for filled squares.
  - 'across': An array of objects, each containing 'number', 'clue', and 'answer' for the across clues.
  - 'down': An array of objects, each containing 'number', 'clue', and 'answer' for the down clues.

  Example JSON output (for a smaller 3x3 puzzle):
  {
    "grid": [
      ["A", "B", "C"],
      ["D", "#", "E"],
      ["F", "G", "H"]
    ],
    "across": [
      {"number": 1, "clue": "First letter", "answer": "A"},
      {"number": 2, "clue": "Second letter", "answer": "B"}
    ],
    "down": [
      {"number": 1, "clue": "Another letter", "answer": "D"},
      {"number": 2, "clue": "Yet another letter", "answer": "F"}
    ]
  }

  Ensure the generated puzzle is solvable and the clues are relevant to the specified topic.
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
