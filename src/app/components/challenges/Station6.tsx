"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, ArrowLeft, Puzzle, CheckCircle } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useFirestore } from "@/firebase/hooks";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";
import { useChallengeProgress } from "@/hooks/use-challenge-progress";
import { handleGenerateCrossword } from "@/app/actions";
import CrosswordGame from "./CrosswordGame";
import type { CrosswordData } from "@/lib/types";
import { cn } from "@/lib/utils";

const challenges = {
  video: {
    title: "Negocios Exitosos",
    description: "Carga un video sobre un negocio que aplique la economía circular.",
    icon: Upload,
  },
  crossword: {
    title: "Crucigrama Circular",
    description: "Resuelve el crucigrama sobre economía circular y sostenibilidad.",
    icon: Puzzle,
  },
};
type ChallengeId = keyof typeof challenges;

const VideoChallenge = ({ onBack, onComplete }: { onBack: () => void, onComplete: () => void }) => {
    const { user } = useUser();
    const db = useFirestore();
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const circularEconomyImage = PlaceHolderImages.find((p) => p.id === "circular-economy-product");

    useEffect(() => {
        const fetchVideo = async () => {
            if (!user || !db) {
                setIsLoading(false);
                return;
            };
            
            const userDocRef = doc(db, 'users', user.uid);
            try {
                const docSnap = await getDoc(userDocRef);
                if (docSnap.exists() && docSnap.data().station6VideoUrl) {
                setVideoUrl(docSnap.data().station6VideoUrl);
                }
            } catch (error) {
                console.error("Error fetching video URL from Firestore:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchVideo();
    }, [user, db]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith("video/")) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const dataUrl = e.target?.result as string;
                if (!user || !db) {
                    toast({ title: "Error", description: "Debes iniciar sesión para guardar tu progreso.", variant: "destructive" });
                    return;
                }
                const userDocRef = doc(db, 'users', user.uid);
                try {
                    await setDoc(userDocRef, { station6VideoUrl: dataUrl }, { merge: true });
                    setVideoUrl(dataUrl);
                    toast({ title: "Video Guardado", description: "Tu video ha sido guardado." });
                } catch (error) {
                    toast({ title: "Error al Guardar", description: "No se pudo guardar el video.", variant: "destructive" });
                }
            };
            reader.readAsDataURL(file);
        } else {
            toast({ title: "Archivo no válido", description: "Por favor, selecciona un archivo de video.", variant: "destructive" });
        }
    };
    
    const handleCompleteClick = () => {
        if (!videoUrl) {
            toast({ title: "Reto Incompleto", description: "Debes cargar un video para completar el reto.", variant: "destructive" });
            return;
        }
        onComplete();
    };

    return (
        <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-full">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*"/>
            <div className="w-full">
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver a los retos
                </Button>
                <Card className="w-full shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-bold">{challenges.video.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                        <div className="bg-black rounded-lg border-4 border-white shadow-md mx-auto mb-6 w-full max-w-sm h-auto aspect-video flex items-center justify-center">
                            {isLoading ? ( <p className="text-white">Cargando video...</p> ) 
                            : videoUrl ? ( <video src={videoUrl} controls className="w-full h-full rounded-md" /> ) 
                            : circularEconomyImage && (
                                <Image src={circularEconomyImage.imageUrl} alt={circularEconomyImage.description} width={400} height={225} className="object-cover w-full h-full opacity-50" data-ai-hint={circularEconomyImage.imageHint}/>
                            )}
                        </div>
                        <div className="flex justify-center gap-4">
                            <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="lg">
                                <Upload className="mr-2"/> Cargar Video
                            </Button>
                            <Button onClick={handleCompleteClick} size="lg" disabled={!videoUrl}>
                                Completar Reto
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const CrosswordChallenge = ({ onBack, onComplete }: { onBack: () => void, onComplete: () => void }) => {
    const [crosswordData, setCrosswordData] = useState<CrosswordData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const generate = async () => {
            setIsLoading(true);
            setError(null);
            const result = await handleGenerateCrossword("Economía Circular", 15);
            if (result.success && result.data) {
                // The AI returns clues as a flat string, let's parse them.
                const parsedAcross = typeof result.data.across === 'string' ? JSON.parse(result.data.across) : result.data.across;
                const parsedDown = typeof result.data.down === 'string' ? JSON.parse(result.data.down) : result.data.down;
                
                setCrosswordData({
                    ...result.data,
                    // The AI is supposed to return clues as {number, clue, answer}, but it is returning {number, text}
                    // We adapt to what the AI is actually sending
                    across: parsedAcross.map((c: any) => ({number: c.number, text: c.clue || c.text})),
                    down: parsedDown.map((c: any) => ({number: c.number, text: c.clue || c.text})),
                });
            } else {
                setError(result.error || "No se pudo generar el crucigrama.");
            }
            setIsLoading(false);
        };
        generate();
    }, []);

    if (isLoading) {
        return <div className="text-white text-center p-8">Generando tu crucigrama sobre Economía Circular...</div>;
    }

    if (error) {
        return <div className="text-red-400 text-center p-8">Error: {error}</div>;
    }

    if (!crosswordData) {
        return <div className="text-center p-8">No hay datos de crucigrama disponibles.</div>;
    }

    return (
        <CrosswordGame data={crosswordData} onComplete={onComplete} onBack={onBack} />
    );
};


export default function Station6() {
  const stationId = 6;
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const { completedChallenges, completeChallenge } = useChallengeProgress();
  const router = useRouter();
  
  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage = "¡Estamos en ReGira! Aquí aprenderás que todo en la naturaleza gira y se renueva. Cada recurso tiene una segunda oportunidad. ¡Es momento de cerrar el ciclo y darle nueva vida a lo que parecía terminar!";
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const regiraBgImage = PlaceHolderImages.find(p => p.id === 'regira-background');
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === 'char-yara');

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
    completeChallenge(stationId, challengeId);
    toast({
        title: `¡Reto '${challenges[challengeId].title}' superado!`,
        description: "¡Sigue así! Completa todos los retos para avanzar."
    });
    setSelectedChallenge(null); 
  };
  
  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    unlockStation(stationId + 1);
    router.push("/");
  };

  const stationProgress = completedChallenges[stationId] || {};
  const areAllChallengesComplete = Object.keys(challenges).every(id => stationProgress[id]?.completed);

  const renderContent = () => {
    if (selectedChallenge === 'video') {
        return <VideoChallenge onBack={() => setSelectedChallenge(null)} onComplete={() => handleChallengeComplete('video')} />;
    }
    if (selectedChallenge === 'crossword') {
        return <CrosswordChallenge onBack={() => setSelectedChallenge(null)} onComplete={() => handleChallengeComplete('crossword')} />;
    }

    return (
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto">
        <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
          <h1 className="text-3xl md:text-5xl">ReGira</h1>
        </div>
          
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
            {(Object.keys(challenges) as ChallengeId[]).map((key) => {
              const challenge = challenges[key];
              const Icon = challenge.icon;
              const isCompleted = stationProgress[key]?.completed;
              return (
                <button key={key} onClick={() => setSelectedChallenge(key)} className="transition-transform duration-300 hover:scale-105 group">
                  <Card className={cn("w-60 h-auto bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors relative", isCompleted && "border-green-500 border-2")}>
                     <CardContent className="flex flex-col items-center justify-center text-center p-4 h-full">
                        {isCompleted && (
                            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5 shadow-lg z-10">
                                <CheckCircle className="text-white h-5 w-5" />
                            </div>
                        )}
                        <Icon className="w-12 h-12 text-primary mb-3" />
                        <h2 className="font-bold font-headline text-xl text-primary">{challenge.title}</h2>
                        <p className="text-muted-foreground text-sm mt-1">{challenge.description}</p>
                     </CardContent>
                  </Card>
                </button>
              );
            })}
        </div>
        
        <div className="mt-4 flex flex-col items-center gap-2">
          <Button onClick={() => setIsPrizeModalOpen(true)} size="lg" disabled={!areAllChallengesComplete}>
            Completar Estación y Reclamar Insignia
          </Button>
          {!areAllChallengesComplete && (
              <p className="text-sm text-muted-foreground bg-background/80 p-2 rounded-md">
                  Completa ambos retos para activar este botón.
              </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="w-full min-h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
         {regiraBgImage && (
            <Image src={regiraBgImage.imageUrl} alt={regiraBgImage.description} fill style={{objectFit: 'cover'}} className="z-0" data-ai-hint={regiraBgImage.imageHint} />
        )}
        
        {renderContent()}
        
        {/* Yara Character and Dialog */}
        <div className="absolute bottom-4 right-4 z-20 flex items-end gap-4 pointer-events-none">
            <AnimatePresence>
                {showYaraDialog && !selectedChallenge && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} transition={{ duration: 0.5 }} className="w-64 mb-4">
                      <Card className="p-3 shadow-lg bg-white/95 relative">
                          <TypewriterText text={yaraMessage} className="text-sm text-primary font-medium"/>
                          <div className="absolute bottom-[-10px] right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                      </Card>
                  </motion.div>
                )}
            </AnimatePresence>
            
            {yaraCharImage && !selectedChallenge && (
                <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.8 } }} className="w-24 h-auto md:w-32">
                    <Image src={yaraCharImage.imageUrl} alt={yaraCharImage.description} width={150} height={187} className="h-auto w-full select-none" priority/>
                </motion.div>
            )}
        </div>
      </div>
      <PrizeDialog open={isPrizeModalOpen} stationId={stationId} onClaim={handleClaimPrize} />
    </>
  );
}
