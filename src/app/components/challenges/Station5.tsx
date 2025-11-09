
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, FileText, Gamepad2, Puzzle } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import { useRouter } from "next/navigation";
import { useStationProgress } from "@/hooks/use-station-progress";
import { toast } from "@/hooks/use-toast";
import WordSearchGame from "./WordSearchGame";
import Station8 from "./Station8"; // Re-using crossword from station 8
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";

const challenges = {
  learn: {
    title: "Aprende",
    description: "Videos y Documentos sobre ideas sostenibles.",
    icon: FileText,
  },
  crossword: {
    title: "Crucigrama",
    description: "Completa, conecta y pon a prueba tu ingenio.",
    icon: Puzzle,
  },
  wordsearch: {
    title: "Sopa de letras",
    description: "Encuentra las palabras ocultas y despierta tu conciencia verde.",
    icon: Gamepad2,
  },
};

type ChallengeId = keyof typeof challenges;

const LearnChallenge = ({ onBack, onComplete }: { onBack: () => void; onComplete: () => void; }) => {
    const sustainableDesignImage = PlaceHolderImages.find(p => p.id === 'sustainable-design-video');
    return (
        <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center flex-grow">
            <div className="w-full">
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <Card className="w-full shadow-lg">
                    <CardHeader>
                        <CardTitle>Videos Educativos</CardTitle>
                        <CardDescription>Aprende de los expertos en diseño y arquitectura sostenible.</CardDescription>
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
                        <Button onClick={onComplete} size="lg">Simular Finalización y Volver</Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


export default function Station5() {
  const stationId = 5;
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();
  
  const sostenibilidadBgImage = PlaceHolderImages.find(p => p.id === 'sostenibilidad-background');


  const handleComplete = (challengeId: ChallengeId) => {
    unlockStation(stationId + 1);
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: `¡Reto '${challenges[challengeId].title}' superado!`,
    });
    setIsPrizeModalOpen(true);
  };
  
   const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };
  
    const handleSimulateComplete = () => {
    unlockStation(stationId + 1);
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: "Has simulado la finalización. ¡Escoge tu premio!",
    });
    setIsPrizeModalOpen(true);
  };
  
  if (selectedChallenge === "learn") {
    return <LearnChallenge onBack={() => setSelectedChallenge(null)} onComplete={() => handleComplete("learn")} />;
  }
  if (selectedChallenge === "crossword") {
    // Re-using Station 8 component for the crossword
    return <Station8 />;
  }
   if (selectedChallenge === "wordsearch") {
    return <WordSearchGame gameId="station5" onComplete={() => handleComplete("wordsearch")} onBack={() => setSelectedChallenge(null)} />;
  }


  return (
     <>
      <div className="w-full flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {sostenibilidadBgImage && (
            <Image
                src={sostenibilidadBgImage.imageUrl}
                alt={sostenibilidadBgImage.description}
                fill
                style={{objectFit: 'cover'}}
                className="z-0"
                data-ai-hint={sostenibilidadBgImage.imageHint}
            />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">ZonaCreativa</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8">
            {(Object.keys(challenges) as ChallengeId[]).map((key) => {
              const challenge = challenges[key];
              const Icon = challenge.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedChallenge(key)}
                  className="transition-transform duration-300 hover:scale-105 group"
                >
                  <Card className="w-60 h-auto bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors">
                    <CardContent className="flex flex-col items-center justify-center text-center p-4 h-full">
                      <Icon className="w-12 h-12 text-primary mb-3" />
                      <h2 className="font-bold font-headline text-xl text-primary">
                        {challenge.title}
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        {challenge.description}
                      </p>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
          <Button onClick={handleSimulateComplete}>Simular Finalización</Button>
        </div>

      </div>
       <PrizeDialog
        open={isPrizeModalOpen}
        stationId={stationId}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
