
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
  Sparkles,
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
import { useUser, useFirestore } from "@/firebase/hooks";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useChallengeProgress } from "@/hooks/use-challenge-progress";
import ArtDirectedBackground from "../ArtDirectedBackground";

const ChallengeDetail = ({
  title,
  description,
  onComplete,
  onBack,
  challengeId,
}: {
  title: string;
  description: string;
  onComplete: () => void;
  onBack: () => void;
  challengeId: ChallengeId;
}) => {
  const { user } = useUser();
  const db = useFirestore();
  const [url, setUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  
  const getDbFieldForChallenge = (id: ChallengeId) => {
    switch (id) {
        case 'video-separate': return 'station3UrlSeparate';
        case 'photos-crafts': return 'station3UrlCrafts';
        default: return null;
    }
  }

  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);
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
  }, []);

  useEffect(() => {
    const fetchUrl = async () => {
        const dbField = getDbFieldForChallenge(challengeId);
        if (!user || !db || !dbField) return;
        
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data()[dbField]) {
                const savedUrl = docSnap.data()[dbField];
                handleUrlChange(savedUrl);
            }
        } catch (error) {
            console.error(`Error fetching ${dbField} from Firestore:`, error);
        }
    };
    fetchUrl();
  }, [challengeId, user, db, handleUrlChange]);

  const handleSaveAndComplete = async () => {
    const dbField = getDbFieldForChallenge(challengeId);
    if (!dbField) { 
        onComplete();
        return;
    }

    if (!url.trim()) {
        toast({
            title: "Reto Incompleto",
            description: "Debes ingresar una URL válida para completar el reto.",
            variant: "destructive",
        });
        return;
    }

    if (!user || !db) {
        toast({ title: "Error", description: "No se puede guardar. Usuario no autenticado.", variant: "destructive" });
        return;
    }
    
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { [dbField]: url }, { merge: true });
        toast({ title: "Guardado", description: `Tu enlace para '${title}' ha sido guardado.` });
        onComplete();
    } catch (error) {
        console.error(`Error saving ${dbField} to Firestore:`, error);
        toast({ title: "Error al guardar", description: "No se pudo guardar la URL en la nube.", variant: "destructive" });
    }
  };
  
  const challengeInfo = challenges[challengeId];
  const imageInfo = PlaceHolderImages.find(
    (p) => p.id === challengeInfo.imageId
  );
  
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
              {videoUrl && videoUrl.includes("youtube.com/embed") ? (
                 <iframe
                    src={videoUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg w-full h-full"
                ></iframe>
              ) : imageInfo ? (
                 <Image
                    src={imageInfo.imageUrl}
                    alt={imageInfo.description}
                    width={400}
                    height={225}
                    className="rounded-lg object-cover w-full h-full"
                  />
              ) : null}
            </div>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {description}
            </p>

            <div className="mb-6 flex gap-2 max-w-md mx-auto">
                <LinkIcon className="h-10 text-muted-foreground" />
                <Input
                type="url"
                placeholder="Pega el enlace de tu post aquí..."
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                />
            </div>
            
            <Button onClick={handleSaveAndComplete} size="lg">
                <CheckCircle className="mr-2" />
                Guardar y Completar
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
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const { completedChallenges, completeChallenge } = useChallengeProgress();
  const router = useRouter();

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage = "¡Qué emoción! En ReNova descubriremos que nada se desperdicia cuando usamos la creatividad. Convierte lo viejo en nuevo, lo usado en útil y demuestra que transformar también es cuidar. ¡Manos a la obra!";
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
  
  const handleChallengeComplete = (challengeId: ChallengeId) => {
    // For the "game" challenge, the individual game components will handle completion state.
    // This function is now mainly for the other challenges.
    if (challengeId !== 'game') {
      completeChallenge(stationId, challengeId);
    }
    setSelectedChallenge(null); 
    toast({
        title: `¡Reto '${challenges[challengeId].title}' completado!`,
        description: "¡Sigue así! Completa todos los retos para avanzar."
    });
  };

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    unlockStation(stationId + 1);
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: "¡Has desbloqueado la siguiente estación!",
    });
    router.push("/");
  };
  
  const stationCompletedChallenges = Object.keys(completedChallenges[stationId] || {});
  const areAllChallengesComplete = (Object.keys(challenges) as ChallengeId[]).every(id => stationCompletedChallenges.includes(id));
  
  if (selectedChallenge === "game") {
    return (
      <RecyclingGame
        onBack={() => setSelectedChallenge(null)}
      />
    );
  }

  if (selectedChallenge) {
    const challengeInfo = challenges[selectedChallenge];

    return (
      <ChallengeDetail
        title={challengeInfo.title}
        description={challengeInfo.description}
        challengeId={selectedChallenge}
        onComplete={() => handleChallengeComplete(selectedChallenge)}
        onBack={() => setSelectedChallenge(null)}
      />
    );
  }

  return (
    <>
      <ArtDirectedBackground
        desktopSrc="/backgrounds/RenovaPC.png"
        tabletSrc="/backgrounds/RenovaTablet.png"
        mobileSrc="/backgrounds/Renova1075_X_1944.png"
      >
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">ReNova</h1>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8">
            {(Object.keys(challenges) as ChallengeId[]).map((key) => {
              const challenge = challenges[key];
              const Icon = challenge.icon;
              const isCompleted = stationCompletedChallenges.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedChallenge(key)}
                  className="transition-transform duration-300 hover:scale-105 group"
                >
                  <Card className="w-48 h-56 bg-card/70 backdrop-blur-sm hover:bg-card/90 transition-colors relative">
                    <CardContent className="flex flex-col items-center justify-center text-center p-2 md:p-4 h-full">
                      <Icon className="w-10 h-10 md:w-12 md:h-12 text-primary mb-2 md:mb-3" />
                      <h2 className="font-bold font-headline text-base md:text-lg text-primary">
                        {challenge.title}
                      </h2>
                    </CardContent>
                     {isCompleted && (
                        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-lg">
                            <CheckCircle className="text-white h-5 w-5" />
                        </div>
                    )}
                  </Card>
                </button>
              );
            })}
          </div>

          <div className="mt-4 max-w-md mx-auto space-y-4">
             <Button
                onClick={() => setIsPrizeModalOpen(true)}
                disabled={!areAllChallengesComplete}
                size="lg"
            >
                Completar Estación y Reclamar Insignia
            </Button>
            {!areAllChallengesComplete && (
                <p className="bg-background/80 p-2 rounded-md text-sm">
                    Completa los {Object.keys(challenges).length - stationCompletedChallenges.length} retos restantes para reclamar tu insignia.
                </p>
            )}
          </div>

        </div>

         {/* Yara Character and Dialog */}
        <div className="absolute bottom-4 right-4 z-20 flex items-end gap-4 pointer-events-none">
          <AnimatePresence>
              {showYaraDialog && yaraCharImage && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20, transition: { duration: 0.5 } }}
                    transition={{ duration: 0.5 }}
                    className="flex items-end gap-4"
                >
                    <div className="w-64 mb-4">
                        <Card className="p-3 shadow-lg bg-white/95 relative">
                            <TypewriterText text={yaraMessage} className="text-sm text-primary font-medium"/>
                            <div className="absolute bottom-[-10px] right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                        </Card>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.8 } }}
                        exit={{ opacity: 0, x: 50, transition: { duration: 0.5 } }}
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
                </motion.div>
              )}
          </AnimatePresence>
        </div>

      </ArtDirectedBackground>
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={stationId}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
