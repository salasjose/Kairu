"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import ChallengeContainer from "../ChallengeContainer";
import { cn } from "@/lib/utils";

const ChallengeDetail = ({
  title,
  description,
  onBack,
  image,
  imageHint,
}: {
  title: string;
  description: string;
  onBack: () => void;
  image: string;
  imageHint: string;
}) => (
  <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-full">
    <div className="w-full">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a los retos
      </Button>
      <Card className="text-center w-full shadow-lg">
        <CardContent className="p-6">
          <h3 className="font-bold text-2xl text-primary font-headline mb-4">
            {title}
          </h3>
          <div className="flex justify-center mb-6">
            <Image
              src={image}
              alt={description}
              width={400}
              height={300}
              className="rounded-lg border-4 border-white shadow-md w-full max-w-sm h-auto"
              data-ai-hint={imageHint}
            />
          </div>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {description}
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default function Station1() {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);

  const faunaImage = PlaceHolderImages.find((p) => p.id === "fauna-capybara");
  const habitatImage = PlaceHolderImages.find((p) => p.id === "habitat-build-1");
  const biodiversidadBgImage = PlaceHolderImages.find((p) => p.id === "biodiversidad-background");
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");

  const challenges = {
    "Reto 1": {
      title: "Reto 1: Identificar Especies",
      description:
        "¡Próximamente un divertido juego para identificar la flora y fauna local!",
      image: faunaImage?.imageUrl ?? "https://picsum.photos/seed/fauna/400/300",
      imageHint: faunaImage?.imageHint ?? "local fauna",
    },
    "Reto 2": {
      title: "Reto 2: Crear un Hábitat",
      description:
        "¡Próximamente podrás subir fotos de cómo construyes un hogar para la vida silvestre!",
      image: habitatImage?.imageUrl ?? "https://picsum.photos/seed/habitat/400/300",
      imageHint: habitatImage?.imageHint ?? "wildlife habitat",
    },
  };

  const handleChallengeComplete = () => {
    return selectedChallenge !== null;
  };
  
  if (selectedChallenge) {
    const challengeData = challenges[selectedChallenge as keyof typeof challenges];
    return (
      <ChallengeContainer
        stationId={1}
        title="Estación Bionexus"
        description="Completa uno de los retos para ganar tu insignia."
        onChallengeComplete={handleChallengeComplete}
      >
        <ChallengeDetail
          {...challengeData}
          onBack={() => setSelectedChallenge(null)}
        />
      </ChallengeContainer>
    );
  }

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {biodiversidadBgImage && (
          <Image
            src={biodiversidadBgImage.imageUrl}
            alt={biodiversidadBgImage.description}
            fill
            style={{objectFit: 'cover'}}
            className="z-0 opacity-80"
            data-ai-hint={biodiversidadBgImage.imageHint}
          />
      )}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
        <div className="bg-[#D95E32] text-white font-kalam py-3 px-10 rounded-lg shadow-lg -rotate-3 mb-8">
          <h1 className="text-4xl md:text-5xl">Bionexus</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-8">
          {(Object.keys(challenges) as (keyof typeof challenges)[]).map((reto, index) => (
            <button
              key={reto}
              onClick={() => setSelectedChallenge(reto)}
              className={cn(
                "relative transition-transform duration-300 hover:scale-105",
                index === 0 ? "md:-rotate-6" : "md:rotate-6"
              )}
            >
              <div className="absolute inset-0 bg-white shadow-2xl rounded-lg transform -rotate-1"></div>
              <div className="relative bg-white w-60 h-64 md:w-64 md:h-72 rounded-lg shadow-2xl flex flex-col items-center justify-center p-4 border-4 border-gray-200">
                <h2 className="font-kalam text-3xl md:text-4xl text-orange-600">
                  {challenges[reto].title}
                </h2>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-[#D95E32] text-white font-kalam py-3 px-10 rounded-lg shadow-lg rotate-2">
          <p className="text-xl md:text-2xl">Yara habla...</p>
        </div>

        {yaraCharImage && (
          <div className="absolute bottom-4 left-4 z-20 hidden md:block">
            <Image
              src={yaraCharImage.imageUrl}
              alt={yaraCharImage.description}
              width={140}
              height={140}
              className="transform -scale-x-100"
              data-ai-hint={yaraCharImage.imageHint}
            />
          </div>
        )}

        <div className="mt-4 max-w-md mx-auto">
          <p className="bg-background/80 p-4 rounded-md text-center">
            Selecciona uno de los retos para completar la estación. ¡Al
            terminar, volverás al mapa para continuar tu aventura!
          </p>
        </div>
      </div>
    </div>
  );
}
