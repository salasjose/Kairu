"use server";

import { generateCrosswordPuzzle } from "@/ai/flows/adaptive-crossword-puzzle";
import type { CrosswordData } from "@/lib/types";

export async function handleGenerateCrossword(topic: string, size: number): Promise<{ success: boolean; data?: CrosswordData; error?: string }> {
  try {
    const result = await generateCrosswordPuzzle({ topic, size });
    
    if (!result || !result.puzzle) {
      return { success: false, error: "Failed to generate puzzle data." };
    }

    const puzzleData: CrosswordData = JSON.parse(result.puzzle);
    
    // Basic validation of the parsed data
    if (!puzzleData.grid || !puzzleData.across || !puzzleData.down) {
       return { success: false, error: "Received invalid puzzle format." };
    }

    return { success: true, data: puzzleData };
  } catch (e) {
    console.error("Error generating crossword:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    if (errorMessage.includes('JSON')) {
       return { success: false, error: "The AI returned an invalid puzzle format. Please try again." };
    }
    return { success: false, error: "Could not connect to the puzzle generation service." };
  }
}
