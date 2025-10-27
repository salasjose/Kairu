"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, CheckCircle } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import ChallengeContainer from "../ChallengeContainer";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const faunaImage = PlaceHolderImages.find((p) => p.id === "fauna-capybara");
const habitatImage = PlaceHolderImages.find((p) => p.id === "habitat-build-1");
const biodiversidadBgImage = PlaceHolderImages.find((p) => p.id === "biodiversidad-background");
const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");
const flowerImage = PlaceHolderImages.find((p) => p.id === "flora-flower");
const animalImage = PlaceHolderImages.find((p) => p.id === "fauna-animal");

const challenges = {
  "Reto 1": {
    title: "Reto 1: Censo Fotográfico",
    description: "Sube 4 fotos de flora y 4 de fauna local.",
  },
  "Reto 2": {
    title: "Reto 2: Crear un Hábitat",
    description: "¡Próximamente podrás subir fotos de cómo construyes un hogar para la vida silvestre!",
    image: habitatImage?.imageUrl ?? "https://picsum.photos/seed/habitat/400/300",
    imageHint: habitatImage?.imageHint ?? "wildlife habitat",
  },
};

const PhotoSlot = ({
  imageUrl,
  onAddPhoto,
}: {
  imageUrl: string | null;
  onAddPhoto: () => void;
}) => {
  return (
    <div className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center relative bg-card/50">
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt="Uploaded content"
            fill
            className="object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
        </>
      ) : (
        <div className="text-center">
          <Button variant="ghost" onClick={onAddPhoto} className="flex flex-col h-auto items-center gap-1">
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs">Añadir foto</span>
          </Button>
        </div>
      )}
    </div>
  );
};


const PhotoChallenge = ({ onBack, onComplete }: { onBack: () => void, onComplete: (completed: boolean) => void }) => {
  const [floraPhotos, setFloraPhotos] = useState<(string | null)[]>(Array(4).fill(null));
  const [faunaPhotos, setFaunaPhotos] = useState<(string | null)[]>(Array(4).fill(null));

  const handleAddPhoto = (type: "flora" | "fauna", index: number) => {
    const newPhotos = type === "flora" ? [...floraPhotos] : [...faunaPhotos];
    if (newPhotos[index] === null) {
      newPhotos[index] = type === "flora" 
        ? (flowerImage?.imageUrl ?? `https://picsum.photos/seed/flower${index}/200`)
        : (animalImage?.imageUrl ?? `https://picsum.photos/seed/animal${index}/200`);
      
      if (type === "flora") {
        setFloraPhotos(newPhotos);
      } else {
        setFaunaPhotos(newPhotos);
      }
    }
  };

  const checkCompletion = () => {
    const hasFlora = floraPhotos.some(p => p !== null);
    const hasFauna = faunaPhotos.some(p => p !== null);
    if(hasFlora && hasFauna) {
      onComplete(true);
      return true;
    }
    toast({
      title: "Casi listo",
      description: "Debes subir al menos una foto de flora y una de fauna para completar el reto.",
      variant: "destructive"
    })
    onComplete(false);
    return false;
  }

  return (
     <ChallengeContainer
      stationId={1}
      title="Estación Bionexus"
      description={challenges["Reto 1"].description}
      onChallengeComplete={checkCompletion}
    >
        <div className="w-full max-w-4xl mx-auto">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a los retos
            </Button>

            <div className="space-y-8">
                <section>
                    <h3 className="text-2xl font-bold font-headline text-primary mb-4">Flora Local</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {floraPhotos.map((photo, index) => (
                            <PhotoSlot key={`flora-${index}`} imageUrl={photo} onAddPhoto={() => handleAddPhoto("flora", index)} />
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-2xl font-bold font-headline text-primary mb-4">Fauna Local</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {faunaPhotos.map((photo, index) => (
                            <PhotoSlot key={`fauna-${index}`} imageUrl={photo} onAddPhoto={() => handleAddPhoto("fauna", index)} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    </ChallengeContainer>
  );
};


const ChallengeDetail = ({
  title,
  description,
  onBack,
  image,
  imageHint,
  onComplete
}: {
  title: string;
  description: string;
  onBack: () => void;
  image: string;
  imageHint: string;
  onComplete: (completed: boolean) => void;
}) => (
  <ChallengeContainer
    stationId={1}
    title="Estación Bionexus"
    description="Completa uno de los retos para ganar tu insignia."
    onChallengeComplete={() => {onComplete(true); return true;}}
  >
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
  </ChallengeContainer>
);


export default function Station1() {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [isChallengeCompleted, setIsChallengeCompleted] = useState(false);
  
  const handleChallengeSelection = (challenge: string) => {
    setIsChallengeCompleted(false);
    setSelectedChallenge(challenge);
  }

  const handleChallengeComplete = (completed: boolean) => {
    setIsChallengeCompleted(completed);
    // The actual completion logic is now handled inside ChallengeContainer
    // which is used by both PhotoChallenge and ChallengeDetail
    return completed;
  };
  
  if (selectedChallenge === "Reto 1") {
    return <PhotoChallenge onBack={() => setSelectedChallenge(null)} onComplete={handleChallengeComplete} />;
  }

  if (selectedChallenge === "Reto 2") {
    const challengeData = challenges["Reto 2"];
    return (
      <ChallengeDetail
        {...challengeData}
        onBack={() => setSelectedChallenge(null)}
        onComplete={handleChallengeComplete}
      />
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
              onClick={() => handleChallengeSelection(reto)}
              className={cn(
                "relative transition-transform duration-300 hover:scale-105",
                index === 0 ? "md:-rotate-6" : "md:rotate-6"
              )}
            >
              <div className="absolute inset-0 bg-white shadow-2xl rounded-lg transform -rotate-1"></div>
              <Card className="relative w-60 h-64 md:w-64 md:h-72 rounded-lg shadow-2xl flex flex-col items-center justify-center p-4 border-4 border-gray-200">
                <CardHeader>
                    <CardTitle className="font-kalam text-3xl md:text-4xl text-orange-600">
                        {challenges[reto].title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{challenges[reto].description}</p>
                </CardContent>
              </Card>
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
