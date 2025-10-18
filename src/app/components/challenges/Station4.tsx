"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BrainCircuit, Link as LinkIcon } from "lucide-react";
import WaterQuiz from "@/app/components/challenges/WaterQuiz";
import { Input } from "@/components/ui/input";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const challenges = {
  quiz: {
    title: "Water Quiz",
    description:
      "Pon a prueba tus conocimientos sobre el agua en un emocionante juego de preguntas.",
    icon: BrainCircuit,
  },
  post: {
    title: "Post de Conservación",
    description: "Crea un post sobre la conservación del agua y comparte el enlace.",
    icon: LinkIcon,
  },
};

type ChallengeId = keyof typeof challenges;

const PostChallenge = ({
  onComplete,
  onBack,
}: {
  onComplete: () => void;
  onBack: () => void;
}) => {
  const [url, setUrl] = useState("");
  const waterPostImage = PlaceHolderImages.find((p) => p.id === "water-post");

  const handleSubmit = () => {
    if (url.trim() && (url.startsWith("http://") || url.startsWith("https://"))) {
      onComplete();
    } else {
      toast({
        title: "URL Inválida",
        description: "Por favor, ingresa una URL válida.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-full">
      <div className="w-full">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a los retos
        </Button>
        <Card className="text-center w-full shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-bold text-2xl text-primary font-headline mb-4">
              Post de Conservación
            </h3>
            <Image
              src={waterPostImage?.imageUrl ?? "https://picsum.photos/seed/waterpost/400/300"}
              alt={waterPostImage?.description ?? "Social media post about water conservation"}
              width={400}
              height={300}
              className="rounded-lg border-4 border-white shadow-md mx-auto mb-6 w-full max-w-sm h-auto"
              data-ai-hint={waterPostImage?.imageHint ?? "water conservation post"}
            />
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Crea un post en redes sociales sobre la conservación del agua y pega
              la URL aquí.
            </p>
            <div className="flex gap-2 max-w-md mx-auto">
              <Input
                type="url"
                placeholder="https://ejemplo.com/post"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <Button onClick={handleSubmit}>Enviar</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function Station4() {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const mapBgImage = PlaceHolderImages.find((p) => p.id === "map-background");
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");

  const handleComplete = (challengeId: ChallengeId) => {
    unlockStation(5);
    toast({
      title: "¡Estación TerrAzul Completada!",
      description: `¡Reto '${challenges[challengeId].title}' superado!`,
    });
    setIsPrizeModalOpen(true);
  };

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };

  const renderContent = () => {
    if (selectedChallenge === "quiz") {
      return (
        <WaterQuiz
          onComplete={() => handleComplete("quiz")}
          onBack={() => setSelectedChallenge(null)}
          onSwitchChallenge={() => setSelectedChallenge("post")}
        />
      );
    }
    if (selectedChallenge === "post") {
      return (
        <PostChallenge
          onComplete={() => handleComplete("post")}
          onBack={() => setSelectedChallenge(null)}
        />
      );
    }
    return (
      <div className="w-full min-h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-200 to-cyan-200 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          {mapBgImage && (
            <Image
                src={mapBgImage.imageUrl}
                alt={mapBgImage.description}
                fill
                objectFit="cover"
                className="z-0"
                data-ai-hint={mapBgImage.imageHint}
              />
          )}
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">TerrAzul</h1>
            <p className="text-base md:text-xl">Recursos Hídricos</p>
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
                  <Card className="w-60 md:w-64 h-auto md:h-56 bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors">
                    <CardContent className="flex flex-col items-center justify-center text-center p-4 h-full">
                      <Icon className="w-12 h-12 md:w-16 md:h-16 text-primary mb-3" />
                      <h2 className="font-bold font-headline text-xl md:text-2xl text-primary">
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

          <div className="mt-4 max-w-md mx-auto">
            <p className="bg-background/80 p-4 rounded-md text-center">
              Selecciona uno de los retos para demostrar tu compromiso con la
              conservación del agua.
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
    );
  };

  return (
    <>
      {renderContent()}
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={4}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
