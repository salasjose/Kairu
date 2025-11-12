"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
  Upload,
  Link as LinkIcon,
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import RecyclingGame from "./RecyclingGame";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";
import { useUser } from "@/firebase/hooks";

const STORAGE_KEY_PREFIX = "kairu-station3-challenge-";

const ChallengeDetail = ({
  title,
  description,
  onComplete,
  onBack,
  image,
  imageHint,
  challengeId,
}: {
  title: string;
  description: string;
  onComplete: () => void;
  onBack: () => void;
  image: string;
  imageHint: string;
  challengeId: ChallengeId;
}) => {
  const { user } = useUser();
  const storageKey = user ? `${STORAGE_KEY_PREFIX}${challengeId}-${user.uid}` : null;
  const [url, setUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!storageKey) return;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
        if (challengeId === 'video-cleanup' && savedData.startsWith('data:video')) {
            setVideoUrl(savedData);
        } else if (challengeId === 'video-separate' || challengeId === 'photos-crafts') {
            handleUrlChange({ target: { value: savedData } } as React.ChangeEvent<HTMLInputElement>);
        }
    }
  }, [challengeId, storageKey]);


  useEffect(() => {
    return () => {
      if (videoUrl && videoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setVideoUrl(dataUrl);
        if (storageKey) {
            try {
                localStorage.setItem(storageKey, dataUrl);
                 toast({
                    title: "Video Cargado",
                    description: "Tu video ha sido guardado para esta sesión.",
                });
            } catch (error) {
                console.error("Error saving video to localStorage", error);
                localStorage.removeItem(storageKey); // Clear item if saving failed
                setVideoUrl(URL.createObjectURL(file)); 
                toast({
                    title: "Video Cargado (Temporalmente)",
                    description: "El video es muy grande para guardarlo, se perderá si sales de la página.",
                    variant: "destructive"
                });
            }
        }
      };
      reader.readAsDataURL(file);
    } else {
      toast({
        title: "Archivo no válido",
        description: "Por favor, selecciona un archivo de video.",
        variant: "destructive",
      });
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);

    if ((challengeId === 'video-separate' || challengeId === 'photos-crafts') && storageKey) {
      localStorage.setItem(storageKey, newUrl);
    }
    
    if (
      newUrl.trim() &&
      (newUrl.startsWith("http://") || newUrl.startsWith("https://"))
    ) {
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

  const handleCompleteClick = () => {
    if (challengeId === "video-cleanup" && !videoUrl) {
      toast({
        title: "Reto Incompleto",
        description: "Debes cargar un video para continuar.",
        variant: "destructive",
      });
      return;
    }
    if (
      (challengeId === "video-separate" || challengeId === "photos-crafts") &&
      !url.trim()
    ) {
      toast({
        title: "Reto Incompleto",
        description: "Debes ingresar la URL de tu video/publicación.",
        variant: "destructive",
      });
      return;
    }
    onComplete();
  };

  const renderChallengeInput = () => {
    switch (challengeId) {
      case "video-cleanup":
        return (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="video/*"
            />
            {!videoUrl && (
              <Button
                onClick={() => fileInputRef.current?.click()}
                size="lg"
                variant="outline"
                className="w-full max-w-md mx-auto"
              >
                <Upload className="mr-2" />
                Cargar Video
              </Button>
            )}
          </>
        );
      case "video-separate":
      case "photos-crafts":
        return (
          <div className="flex gap-2 max-w-md mx-auto">
            <LinkIcon className="h-10 text-muted-foreground" />
            <Input
              type="url"
              placeholder="Pega el enlace de tu post aquí..."
              value={url}
              onChange={handleUrlChange}
            />
          </div>
        );
      default:
        return null;
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
              {title}
            </h3>
            <div className="mx-auto mb-6 w-full max-w-sm h-auto aspect-video bg-black rounded-lg border-4 border-white shadow-md flex items-center justify-center">
              {videoUrl && (challengeId === 'video-separate' || challengeId === 'photos-crafts') ? (
                <iframe
                  src={videoUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg w-full h-full"
                ></iframe>
              ) : videoUrl && challengeId === 'video-cleanup' ? (
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full rounded-md bg-black"
                />
              ) : challengeId !== 'photos-crafts' ? (
                 <Image
                  src={image}
                  alt={description}
                  width={400}
                  height={300}
                  className="rounded-lg border-4 border-white shadow-md w-full max-w-sm h-auto"
                  data-ai-hint={imageHint}
                />
              ) : null }
            </div>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {description}
            </p>

            <div className="mb-6">{renderChallengeInput()}</div>

            <Button onClick={handleCompleteClick} size="lg">
              <CheckCircle className="mr-2" />
              Completar Reto
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const challenges = {
  "game": {
    title: "Reto 1: Recolección",
    description:
      "¡Qué montón de basura! Tu misión es recolectarla y disponerla en la caneca que corresponda.",
    imageId: "recycling-game",
    icon: Trash2,
  },
  "video-separate": {
    title: "Reto 2: Video Doméstico",
    description:
      "Separa los residuos sólidos en tu hogar, haz un video de cómo lo haces. ¡Estoy ansiosa por ver tu compromiso!",
    imageId: "waste-separation",
    icon: Recycle,
  },
  "photos-crafts": {
    title: "Reto 3: Creaciones",
    description:
      "Crea nuevos productos a partir de residuos reciclados. Monta un post en Instagram, etiquétanos @fundaciontekara y @corpoguajira y comparte el enlace.",
    imageId: "recycled-art",
    icon: Sparkles,
  },
};

type ChallengeId = keyof typeof challenges;

export default function Station3() {
  const stationId = 3;
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(
    null
  );
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const [yaraMessage, setYaraMessage] = useState("¡Qué emoción! En ReNova descubriremos que nada se desperdicia cuando usamos la creatividad. Convierte lo viejo en nuevo, lo usado en útil y demuestra que transformar también es cuidar. ¡Manos a la obra!");
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const streetBgImage = PlaceHolderImages.find(
    (p) => p.id === "renova-background"
  );
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");

   const scheduleYaraDialog = useCallback(() => {
    if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    yaraTimerRef.current = setTimeout(() => {
      setShowYaraDialog(true);
      const hideTimer = setTimeout(() => setShowYaraDialog(false), 15000); 
    }, 1000); 
  }, []);

  useEffect(() => {
    scheduleYaraDialog();
    return () => {
      if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    };
  }, [scheduleYaraDialog]);

  const handleComplete = (challengeId: ChallengeId) => {
    unlockStation(stationId + 1);
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: `¡Buen trabajo con el reto '${challenges[challengeId].title}'!`,
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
      image:
        imageInfo?.imageUrl ??
        "https://picsum.photos/seed/placeholder/400/300",
      imageHint: imageInfo?.imageHint ?? "image",
    };

    return (
      <ChallengeDetail
        {...challengeData}
        challengeId={selectedChallenge}
        onComplete={() => handleComplete(selectedChallenge)}
        onBack={() => setSelectedChallenge(null)}
      />
    );
  }

  return (
    <>
      <div className="w-full flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {streetBgImage && (
          <Image
            src={streetBgImage.imageUrl}
            alt={streetBgImage.description}
            fill
            style={{ objectFit: "cover" }}
            className="z-0 opacity-70"
            data-ai-hint={streetBgImage.imageHint}
          />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">ReNova</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8">
            {(Object.keys(challenges) as ChallengeId[]).map((key) => {
              const challenge = challenges[key];
              const Icon = challenge.icon;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedChallenge(key)}
                  className="transition-transform duration-300 hover:scale-105 group"
                >
                  <Card className="w-48 h-56 bg-card/70 backdrop-blur-sm hover:bg-card/90 transition-colors">
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

          <div className="mt-4 max-w-md mx-auto space-y-4">
            <p className="bg-background/80 p-4 rounded-md text-center">
              Selecciona uno de los retos para demostrar cómo gestionas los
              residuos. ¡Al terminar, volverás al mapa!
            </p>
            <Button onClick={handleSimulateComplete}>Simular Finalización</Button>
          </div>

        </div>

         {/* Yara Character and Dialog */}
        <div className="absolute bottom-4 right-4 z-20 flex items-end gap-4 pointer-events-none">
          <AnimatePresence>
              {showYaraDialog && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                    className="w-64 mb-4"
                >
                    <Card className="p-3 shadow-lg bg-white/95 relative">
                        <TypewriterText text={yaraMessage} className="text-sm text-primary font-medium"/>
                        <div className="absolute bottom-[-10px] right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                    </Card>
                </motion.div>
              )}
          </AnimatePresence>
          
          {yaraCharImage && (
              <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.8 } }}
                  className="w-24 h-auto md:w-32"
              >
                  <Image
                      src={yaraCharImage.imageUrl}
                      alt={yaraCharImage.description}
                      width={150}
                      height={187}
                      className="h-auto w-full select-none"
                      priority
                  />
              </motion.div>
          )}
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
