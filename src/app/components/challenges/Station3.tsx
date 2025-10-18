"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle,
  Recycle,
  Trash2,
  Video,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import RecyclingGame from "./RecyclingGame";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const ChallengeDetail = ({
  title,
  description,
  onComplete,
  onBack,
  image,
  imageHint,
}: {
  title: string;
  description: string;
  onComplete: () => void;
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
          <Button onClick={onComplete} size="lg">
            <CheckCircle className="mr-2" />
            Completar Reto
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
);

const challenges = {
  "video-cleanup": {
    title: "Video de Limpieza",
    description:
      "Sube un video tuyo en una campaña de limpieza a YouTube/Instagram/TikTok y pega la URL.",
    imageId: "cleanup-video",
    icon: Video,
  },
  "video-separate": {
    title: "Video de Separación",
    description:
      "Sube un video tuyo separando residuos sólidos y pega la URL.",
    imageId: "waste-separation",
    icon: Recycle,
  },
  "game": {
    title: "Juego de Reciclaje",
    description:
      "Juega un divertido juego para poner a prueba tus habilidades de clasificación de residuos.",
    imageId: "recycling-game",
    icon: Trash2,
  },
  "photos-crafts": {
    title: "Artesanías Recicladas",
    description:
      "Sube 4 fotos de accesorios o adornos que hayas hecho con materiales reciclados.",
    imageId: "recycled-art",
    icon: Sparkles,
  },
};

type ChallengeId = keyof typeof challenges;

export default function Station3() {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(
    null
  );
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const streetBgImage = PlaceHolderImages.find((p) => p.id === "street-background");
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");

  const handleComplete = (challengeId: ChallengeId) => {
    unlockStation(4);
    toast({
      title: "¡Estación ReNova Completada!",
      description: `¡Buen trabajo con el reto '${challenges[challengeId].title}'!`,
    });
    setIsPrizeModalOpen(true);
  };

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };

  if (selectedChallenge === "game") {
    return (
      <RecyclingGame
        onComplete={() => handleComplete("game")}
        onBack={() => setSelectedChallenge(null)}
      />
    );
  }

  if (selectedChallenge) {
    const challengeInfo = challenges[selectedChallenge];
    const imageInfo = PlaceHolderImages.find(
      (p) => p.id === challengeInfo.imageId
    );
    const challengeData = {
      title: challengeInfo.title,
      description: challengeInfo.description,
      image: imageInfo?.imageUrl ?? "https://picsum.photos/seed/placeholder/400/300",
      imageHint: imageInfo?.imageHint ?? "image",
    };

    return (
      <ChallengeDetail
        {...challengeData}
        onComplete={() => handleComplete(selectedChallenge)}
        onBack={() => setSelectedChallenge(null)}
      />
    );
  }

  return (
    <>
      <div className="w-full min-h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {streetBgImage && (
            <Image
              src={streetBgImage.imageUrl}
              alt={streetBgImage.description}
              fill
              objectFit="cover"
              className="z-0 opacity-70"
              data-ai-hint={streetBgImage.imageHint}
            />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">ReNova</h1>
            <p className="text-base md:text-xl">Gestión de Residuos</p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-8 mb-8">
            {(Object.keys(challenges) as ChallengeId[]).map((key) => {
              const challenge = challenges[key];
              const Icon = challenge.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedChallenge(key)}
                  className="transition-transform duration-300 hover:scale-105 group"
                >
                  <Card className="w-36 h-44 md:w-48 md:h-56 bg-card/70 backdrop-blur-sm hover:bg-card/90 transition-colors">
                    <CardContent className="flex flex-col items-center justify-center text-center p-2 md:p-4 h-full">
                      <Icon className="w-10 h-10 md:w-12 md:h-12 text-primary mb-2 md:mb-3" />
                      <h2 className="font-bold font-headline text-base md:text-lg text-primary">
                        {challenge.title}
                      </h2>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          <div className="mt-4 max-w-md mx-auto">
            <p className="bg-background/80 p-4 rounded-md text-center">
              Selecciona uno de los retos para demostrar cómo gestionas los
              residuos. ¡Al terminar, volverás al mapa!
            </p>
          </div>

          {yaraCharImage && (
            <div className="absolute bottom-4 -left-8 z-20 hidden md:block">
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
        </div>
      </div>
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={3}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
