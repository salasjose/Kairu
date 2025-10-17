
"use client";

import { useState } from "react";
import ChallengeContainer from "@/app/components/ChallengeContainer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Station5() {
  const [completed, setCompleted] = useState(false);

  const handleComplete = () => {
    // In a real scenario, you'd check if videos were watched.
    // For now, we allow manual completion.
    if (!completed) {
      // Logic to encourage user to watch videos before completing.
    }
    return completed;
  };
  
  const sustainableDesignImage = PlaceHolderImages.find(p => p.id === 'sustainable-design-video');

  return (
    <ChallengeContainer
      stationId={5}
      title="Estación 5: Diseño Sostenible"
      description="Mira los siguientes videos para aprender sobre los principios del diseño y la arquitectura sostenible."
      onChallengeComplete={handleComplete}
    >
      <Card>
        <CardHeader>
          <CardTitle>Videos Educativos</CardTitle>
          <CardDescription>Aprende de los expertos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
           {sustainableDesignImage && (
              <div className="flex justify-center mb-6">
                <Image 
                    src={sustainableDesignImage.imageUrl} 
                    alt={sustainableDesignImage.description} 
                    width={400} 
                    height={300} 
                    className="rounded-lg border-4 border-white shadow-md w-full max-w-sm h-auto"
                    data-ai-hint={sustainableDesignImage.imageHint}
                />
              </div>
           )}
          <p className="text-muted-foreground">¡Próximamente un reproductor de video!</p>
          <Button onClick={() => setCompleted(true)}>Simular Finalización</Button>
        </CardContent>
      </Card>
    </ChallengeContainer>
  );
}
