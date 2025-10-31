"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import type { CrosswordData } from "@/lib/types";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Lightbulb, Zap } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import { useRouter } from "next/navigation";
import { useStationProgress } from "@/hooks/use-station-progress";


const challenges = {
  learn: {
    title: "Aprende",
    description: "Energías que mueven el mundo: Descubre cómo la naturaleza nos enseña a producir energía sin agotarla (videos).",
    icon: Lightbulb,
    imageId: "sustainable-design-video"
  },
  capture: {
    title: "Captura Solar",
    description: "Usa un medidor de radiación y capta cómo se aprovecha su energía.",
    icon: Zap,
    imageId: "solar-panel-field"
  },
};

type ChallengeId = keyof typeof challenges;

const ChallengeScreen = ({ challengeId, onBack, onComplete }: { challengeId: ChallengeId, onBack: () => void, onComplete: () => void }) => {
    const challenge = challenges[challengeId];
    const imageInfo = PlaceHolderImages.find(p => p.id === challenge.imageId);

    return (
        <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center flex-grow">
            <div className="w-full">
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <Card className="w-full shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-center">{challenge.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        {imageInfo && (
                            <Image 
                                src={imageInfo.imageUrl} 
                                alt={imageInfo.description} 
                                width={400} 
                                height={300} 
                                className="rounded-lg border-4 border-white shadow-md w-full max-w-sm h-auto mx-auto"
                                data-ai-hint={imageInfo.imageHint}
                            />
                        )}
                        <p className="text-muted-foreground">{challenge.description}</p>
                        <p className="text-sm text-primary font-bold">¡Contenido próximamente!</p>
                        <Button onClick={onComplete} size="lg">Simular y Completar</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


export default function Station8() {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const handleComplete = (challengeId: ChallengeId) => {
    unlockStation(9);
    toast({
      title: "¡Estación Vitalia Completada!",
      description: `¡Reto '${challenges[challengeId].title}' superado!`,
    });
    setIsPrizeModalOpen(true);
  };
  
  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };
  
  if (selectedChallenge) {
    return <ChallengeScreen challengeId={selectedChallenge} onBack={() => setSelectedChallenge(null)} onComplete={() => handleComplete(selectedChallenge)} />
  }

  return (
    <>
      <div className="w-full min-h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-amber-100 to-yellow-200">
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">Vitalia</h1>
          </div>
            <div className="max-w-xl mx-auto bg-black/50 text-white p-4 rounded-xl mb-8">
              <p className="font-bold text-lg">YARA: "¡Has llegado a Vitalia! La energía del sol, del viento y del agua nos impulsa hacia un futuro más limpio. Recarga tu energía, comparte tu luz y sigue construyendo un planeta lleno de vida. ¡Tu fuerza también renueva el mundo!"</p>
            </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            {(Object.keys(challenges) as ChallengeId[]).map((key) => {
              const challenge = challenges[key];
              const Icon = challenge.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedChallenge(key)}
                  className="transition-transform duration-300 hover:scale-105 group"
                >
                  <Card className="w-60 md:w-64 h-auto bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors">
                    <CardContent className="flex flex-col items-center justify-center text-center p-4 h-full">
                      <Icon className="w-12 h-12 md:w-16 md:h-16 text-primary mb-3" />
                      <h2 className="font-bold font-headline text-xl md:text-2xl text-primary">
                        {challenge.title}
                      </h2>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={8}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
