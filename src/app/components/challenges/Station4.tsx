
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BrainCircuit, Link as LinkIcon, Upload } from "lucide-react";
import WaterQuiz from "@/app/components/challenges/WaterQuiz";
import { Input } from "@/components/ui/input";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";

const challenges = {
  quiz: {
    title: "Quiz",
    description:
      "Pon a prueba tus conocimientos sobre el agua en un emocionante juego de preguntas. ¡Demuestra todo lo que sabes!",
    icon: BrainCircuit,
  },
  post: {
    title: "Post",
    description: "Crea un post de conservación del agua, carga tu foto de evidencia, etiquétanos @fundaciontekara y @corpoguajira y comparte el enlace.",
    icon: LinkIcon,
  },
};

type ChallengeId = keyof typeof challenges;

const STORAGE_KEY_POST = "kairu-station4-post-url";

const PostChallenge = ({
  onComplete,
  onBack,
}: {
  onComplete: () => void;
  onBack: () => void;
}) => {
  const [url, setUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const waterPostImage = PlaceHolderImages.find((p) => p.id === "water-post");
  
  useEffect(() => {
    const savedUrl = localStorage.getItem(STORAGE_KEY_POST);
    if (savedUrl) {
      handleUrlChange(savedUrl);
    }
  }, []);

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    localStorage.setItem(STORAGE_KEY_POST, newUrl);

    if (newUrl.trim() && (newUrl.startsWith("http://") || newUrl.startsWith("https://"))) {
      if (newUrl.includes("youtube.com/watch?v=")) {
        const videoId = newUrl.split("v=")[1].split("&")[0];
        setVideoUrl(`https://www.youtube.com/embed/${videoId}`);
      } else if (newUrl.includes("youtu.be/")) {
        const videoId = newUrl.split("youtu.be/")[1].split("?")[0];
        setVideoUrl(`https://www.youtube.com/embed/${videoId}`);
      } else {
        setVideoUrl(newUrl); 
      }
    } else {
      setVideoUrl(null);
    }
  };


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
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center flex-grow">
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
            
            <div className="mx-auto mb-6 w-full max-w-sm h-auto aspect-video bg-black rounded-lg border-4 border-white shadow-md flex items-center justify-center">
              {videoUrl && videoUrl.includes("youtube.com/embed") ? (
                 <iframe
                    src={videoUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg w-full h-full"
                  ></iframe>
              ) : (
                <Image
                  src={waterPostImage?.imageUrl ?? "https://picsum.photos/seed/waterpost/400/300"}
                  alt={waterPostImage?.description ?? "Social media post about water conservation"}
                  width={400}
                  height={300}
                  className="rounded-lg object-cover w-full h-full"
                  data-ai-hint={waterPostImage?.imageHint ?? "water conservation post"}
                />
              )}
            </div>

            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {challenges.post.description}
            </p>
            <div className="flex flex-col gap-4 max-w-md mx-auto">
                <Button size="lg" variant="outline"><Upload className="mr-2"/> Cargar Foto de Evidencia</Button>
                <div className="flex gap-2">
                    <LinkIcon className="h-10 text-muted-foreground" />
                    <Input
                        type="url"
                        placeholder="https://ejemplo.com/post"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                    />
                    <Button onClick={handleSubmit}>Enviar</Button>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function Station4() {
  const stationId = 4;
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const terrazulBgImage = PlaceHolderImages.find((p) => p.id === "terrazul-background");
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");

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
      <div className="w-full flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {terrazulBgImage && (
            <Image
                src={terrazulBgImage.imageUrl}
                alt={terrazulBgImage.description}
                fill
                style={{objectFit: 'cover'}}
                className="z-0 opacity-80"
                data-ai-hint={terrazulBgImage.imageHint}
            />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">TerrAzul</h1>
          </div>
            <div className="max-w-xl mx-auto bg-black/50 text-white p-4 rounded-xl mb-8">
                <p className="font-bold text-lg">YARA: "¡Bienvenido a TerrAzul! Aquí fluye la vida. El agua recorre montañas, ríos y mares, y depende de nosotros mantener su pureza. ¡Cuidemos cada gota y protejamos los territorios que le dan vida al planeta!"</p>
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

          <div className="mt-4 max-w-md mx-auto space-y-4">
            <p className="bg-background/80 p-4 rounded-md text-center">
              Selecciona uno de los retos para demostrar tu compromiso con la
              conservación del agua.
            </p>
            <Button onClick={handleSimulateComplete}>Simular Finalización</Button>
          </div>

        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={stationId}
        onClaim={handleClaimPrize}
      />
    </>
  );
}

    