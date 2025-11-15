"use server";

import { generateCrosswordPuzzle } from "@/ai/flows/adaptive-crossword-puzzle";
import type { CrosswordData } from "@/lib/types";
import { initializeAdminApp, getAdminStorage } from "@/firebase/admin";

export async function uploadImageAction(dataUrl: string, storagePath: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const adminApp = initializeAdminApp();
    const bucket = getAdminStorage(adminApp).bucket();
    
    // Extract content type and base64 data from data URL
    const matches = dataUrl.match(/^data:(.+);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      return { success: false, error: "Formato de URL de datos inválido." };
    }

    const contentType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    
    const file = bucket.file(storagePath);
    
    await file.save(buffer, {
      metadata: {
        contentType: contentType,
      },
    });

    // Make the file publicly readable
    await file.makePublic();

    // Return the public URL
    const publicUrl = file.publicUrl();

    return { success: true, url: publicUrl };

  } catch (e) {
    console.error("Error uploading image via Server Action:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred during upload.";
    return { success: false, error: errorMessage };
  }
}


export async function handleGenerateCrossword(topic: string, size: number): Promise<{ success: boolean; data?: CrosswordData; error?: string }> {
  try {
    const result = await generateCrosswordPuzzle({ topic, size });
    
    if (!result || !result.puzzle) {
      console.error("AI did not return puzzle data", result);
      return { success: false, error: "La IA no pudo generar los datos del crucigrama." };
    }

    let puzzleData: CrosswordData;
    try {
      // The AI model sometimes returns a JSON string, sometimes a JSON object inside a string.
      // This handles both cases.
      const parsedResult = JSON.parse(result.puzzle);
      if (typeof parsedResult === 'string') {
        puzzleData = JSON.parse(parsedResult);
      } else {
        puzzleData = parsedResult;
      }
    } catch (e) {
      console.error("Error parsing crossword JSON from AI:", e, "Raw data:", result.puzzle);
      // Attempt to fix common markdown issues from the AI
      const fixedJsonString = result.puzzle.replace(/```json/g, '').replace(/```/g, '').trim();
       try {
         puzzleData = JSON.parse(fixedJsonString);
       } catch (finalError) {
         return { success: false, error: "Se recibió un formato de crucigrama no válido de la IA." };
       }
    }
    
    // Basic validation of the parsed data
    if (!puzzleData.grid || !puzzleData.across || !puzzleData.down) {
       console.error("Invalid puzzle structure:", puzzleData);
       return { success: false, error: "El formato del crucigrama recibido es inválido." };
    }

    return { success: true, data: puzzleData };
  } catch (e) {
    console.error("Error generating crossword:", e);
    const errorMessage = e instanceof Error ? e.message : "An unknown error occurred.";
    if (errorMessage.includes('JSON')) {
       return { success: false, error: "La IA devolvió un formato de crucigrama no válido. Por favor, intenta de nuevo." };
    }
    return { success: false, error: "No se pudo conectar con el servicio de generación de crucigramas." };
  }
}
