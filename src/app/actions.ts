
"use server";

import { generateCrosswordPuzzle } from "@/ai/flows/adaptive-crossword-puzzle";
import type { CrosswordData } from "@/lib/types";
import { getAdminStorage } from "@/firebase/admin";
import { getDownloadURL } from "firebase-admin/storage";

export async function handlePhotoUpload(dataUrl: string, path: string): Promise<string> {
    const storage = getAdminStorage();
    const bucket = storage.bucket();
    
    // Create a buffer from the base64 data
    const buffer = Buffer.from(dataUrl.split(',')[1], 'base64');
    
    // Create a file reference in the bucket
    const file = bucket.file(path);

    // Upload the file
    await file.save(buffer, {
        metadata: {
            contentType: 'image/jpeg', // O el tipo de contenido que corresponda
        },
    });

    // Get the public URL
    const downloadUrl = await getDownloadURL(file);

    return downloadUrl;
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
      const fixedJsonString = result.puzzle.replace(/'''json/g, '').replace(/'''/g, '').trim();
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
