"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, FileText, Gamepad2, Puzzle, Link as LinkIcon } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import { useRouter } from "next/navigation";
import { useStationProgress } from "@/hooks/use-station-progress";
import { toast } from "@/hooks/use-toast";
import WordSearchGame from "./WordSearchGame";
import CrosswordGame from "./CrosswordGame";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";
import { useUser, useFirestore } from "@/firebase/hooks";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { CROSSWORD_DATA } from "@/lib/crossword-data";

const challenges = {
  learn: {
    title: "Aprende",
    description: "Copia y pega la URL de tu video sobre ideas sostenibles.",
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
    const { user } = useUser();
    const db = useFirestore();
    const [url, setUrl] = useState("");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const sustainableDesignImage = PlaceHolderImages.find(p => p.id === 'sustainable-design-video');

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
            if (!user || !db) {
                setIsLoading(false);
                return;
            }
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().station5Url) {
                    const savedUrl = docSnap.data().station5Url;
                    handleUrlChange(savedUrl);
                }
            } catch (error) {
                console.error("Error fetching URL from Firestore:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUrl();
    }, [user, db, handleUrlChange]);

    const handleSaveAndComplete = async () => {
        if (!url.trim()) {
            toast({ title: "URL vacía", description: "Por favor, ingresa una URL válida.", variant: "destructive" });
            return;
        }
        if (user && db) {
            try {
                const docRef = doc(db, 'users', user.uid);
                await setDoc(docRef, { station5Url: url }, { merge: true });
                toast({ title: "¡Guardado!", description: "La URL de tu video ha sido guardada." });
                onComplete();
            } catch (error) {
                console.error("Error saving URL to Firestore:", error);
                toast({ title: "Error al Guardar", description: "No se pudo guardar la URL.", variant: "destructive" });
            }
        } else {
            toast({ title: "Usuario no encontrado", description: "Debes iniciar sesión para guardar tu progreso.", variant: "destructive" });
        }
    };


    return (
        <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center flex-grow">
            <div className="w-full">
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                </Button>
                <Card className="w-full shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-center">{challenges.learn.title}</CardTitle>
                        <CardDescription className="text-center">{challenges.learn.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                       <div className="mx-auto mb-6 w-full max-w-sm h-auto aspect-video bg-black rounded-lg border-4 border-white shadow-md flex items-center justify-center">
                          {isLoading ? (
                            <p className="text-white">Cargando...</p>
                          ) : videoUrl && videoUrl.includes("youtube.com/embed") ? (
                             <iframe
                                src={videoUrl}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="rounded-lg w-full h-full"
                              ></iframe>
                          ) : (
                            sustainableDesignImage && <Image 
                                src={sustainableDesignImage.imageUrl} 
                                alt={sustainableDesignImage.description} 
                                width={400} 
                                height={300} 
                                className="rounded-lg object-cover w-full h-full opacity-50"
                                data-ai-hint={sustainableDesignImage.imageHint}
                            />
                          )}
                        </div>
                        
                        <div className="flex gap-2 max-w-md mx-auto">
                            <LinkIcon className="h-10 text-muted-foreground" />
                            <Input
                                type="url"
                                placeholder="https://youtube.com/tu-video"
                                value={url}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                disabled={isLoading}
                            />
                        </div>
                        
                        <Button onClick={handleSaveAndComplete} size="lg">Guardar y Completar</Button>
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
  
  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage = "¡Wow, llegamos a ZonaCreativa! Este es el espacio donde tu imaginación se vuelve sostenible transformando ideas que inspiren un cambio positivo. ¡Tu creatividad puede cambiar el mundo!";
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sostenibilidadBgImage = PlaceHolderImages.find(p => p.id === 'sostenibilidad-background');
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === 'char-yara');

  const scheduleYaraDialog = useCallback(() => {
    if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    yaraTimerRef.current = setTimeout(() => {
      setShowYaraDialog(true);
      const hideTimer = setTimeout(() => setShowYaraDialog(false), 60000); // Hide after 1 minute
      const reappearTimer = setTimeout(scheduleYaraDialog, 60000 + 120000); // Reappear after 2 more minutes
    }, 10000); // Initial appearance after 10 seconds
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
    return (
        <main className="min-h-screen bg-gray-900 p-6 flex items-start justify-center">
          <div className="mx-auto max-w-7xl">
            <h1 className="text-2xl font-bold text-white mb-4">Crucigrama: Transformación Sostenible</h1>
            <div className="rounded-xl bg-gray-800/60 p-4 ring-1 ring-gray-700">
              <CrosswordGame data={CROSSWORD_DATA} onBack={() => setSelectedChallenge(null)} onComplete={() => handleComplete("crossword")} />
            </div>
          </div>
        </main>
      );
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
