
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from 'next/dynamic';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lightbulb, Link as LinkIcon, CheckCircle } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import Logo from "../Logo";
import { usePrizeCart } from "@/hooks/use-prize-cart";

const ArtDirectedBackground = dynamic(() => import('../ArtDirectedBackground'), {
  loading: () => <div className="w-full flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <Logo className="h-24 animate-pulse" />
      <p className="text-primary/70 mt-4">Cargando Fondo...</p>
    </div>,
  ssr: false,
});


const challenges = {
  learn: {
    title: "Aprende",
    description: "Energías que mueven el mundo: Descubre cómo la naturaleza nos enseña a producir energía sin agotarla. Pega el enlace de un video y guárdalo.",
    icon: Lightbulb,
    imageId: "sustainable-design-video"
  },
};

type ChallengeId = keyof typeof challenges;

const ChallengeScreen = ({ challengeId, onBack, onComplete, isCompleted }: { challengeId: ChallengeId, onBack: () => void, onComplete: () => void, isCompleted: boolean }) => {
    const challenge = challenges[challengeId];
    const imageInfo = PlaceHolderImages.find(p => p.id === challenge.imageId);
    const { user } = useUser();
    const db = useFirestore();

    const [url, setUrl] = useState("");
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                setVideoUrl(null); // No es un video de youtube, no se puede embeber.
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
                if (docSnap.exists() && docSnap.data().station8Url) {
                    const savedUrl = docSnap.data().station8Url;
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
        if (isCompleted) return;

        if (!url.trim()) {
            toast({ title: "URL vacía", description: "Por favor, ingresa una URL válida.", variant: "destructive" });
            return;
        }
        if (user && db) {
            try {
                const docRef = doc(db, 'users', user.uid);
                await setDoc(docRef, { station8Url: url }, { merge: true });
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
                        <CardTitle className="text-center">{challenge.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-center">
                        <div className="mx-auto mb-6 w-full max-w-sm h-auto aspect-video bg-black rounded-lg border-4 border-white shadow-md flex items-center justify-center">
                          {isLoading ? (
                            <p className="text-white">Cargando...</p>
                          ) : videoUrl ? (
                             <iframe
                                src={videoUrl}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="rounded-lg w-full h-full"
                              ></iframe>
                          ) : (
                            imageInfo && <Image 
                                src={imageInfo.imageUrl} 
                                alt={imageInfo.description} 
                                width={400} 
                                height={300} 
                                className="rounded-lg object-cover w-full h-full opacity-50"
                                data-ai-hint={imageInfo.imageHint}
                            />
                          )}
                        </div>
                        <p className="text-muted-foreground">{challenge.description}</p>
                        <div className="flex gap-2 max-w-md mx-auto">
                            <LinkIcon className="h-10 text-muted-foreground" />
                            <Input
                                type="url"
                                placeholder="https://youtube.com/tu-video"
                                value={url}
                                onChange={(e) => handleUrlChange(e.target.value)}
                                disabled={isLoading || isCompleted}
                            />
                        </div>
                        {isCompleted ? (
                             <Button size="lg" disabled>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Reto Completado
                             </Button>
                        ) : (
                            <Button onClick={handleSaveAndComplete} size="lg">Guardar y Completar</Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


export default function Station8() {
  const stationId = 8;
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const { prizes } = usePrizeCart();
  const router = useRouter();
  
  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage = "¡Has llegado a Vitalia! La energía del sol, del viento y del agua nos impulsa hacia un futuro más limpio. Recarga tu energía, comparte tu luz y sigue construyendo un planeta lleno de vida. ¡Tu fuerza también renueva el mundo!";
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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


  const handleComplete = (challengeId: ChallengeId) => {
    // Only unlock and show prize if it's not already claimed
    if (!hasClaimedPrize) {
        unlockStation(stationId + 1);
        toast({
            title: `¡Estación ${stationId} Completada!`,
            description: `¡Reto '${challenges[challengeId].title}' superado!`,
        });
        setIsPrizeModalOpen(true);
    }
    setSelectedChallenge(null);
  };
  
  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };
  
  const hasClaimedPrize = prizes.some(p => p.stationId === stationId);
  const isChallengeCompleted = hasClaimedPrize;

  const renderContent = () => {
    if (selectedChallenge) {
      return <ChallengeScreen 
                  challengeId={selectedChallenge} 
                  onBack={() => setSelectedChallenge(null)} 
                  onComplete={() => handleComplete(selectedChallenge)}
                  isCompleted={isChallengeCompleted}
              />
    }

    return (
      <>
        <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
          <h1 className="text-3xl md:text-5xl">Vitalia</h1>
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
                <Card className="w-60 md:w-64 h-auto bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors relative">
                    {isChallengeCompleted && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5 shadow-lg z-10">
                        <CheckCircle className="text-white h-5 w-5" />
                    </div>
                  )}
                  <CardContent className="flex flex-col items-center justify-center text-center p-4 h-full">
                    <Icon className="w-12 h-12 md:w-16 md:h-16 text-primary mb-3" />
                    <h2 className="font-bold font-headline text-xl md:text-2xl text-primary">
                      {challenge.title}
                    </h2>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>
        {isChallengeCompleted && (
          <p className="text-sm text-muted-foreground bg-background/80 p-2 rounded-md">
              Ya has completado esta estación.
          </p>
        )}
      </>
    );
  }

  return (
    <>
      <ArtDirectedBackground
        desktopSrc="/backgrounds/VitaliaPC.png"
        tabletSrc="/backgrounds/VitaliaTablet.png"
        mobileSrc="/backgrounds/Vitalia1075_X_1944.png"
      >
        {renderContent()}
         {/* Yara Character and Dialog */}
        <div className="absolute bottom-4 right-4 sm:right-8 z-20 w-full max-w-xs sm:max-w-sm md:max-w-md pointer-events-none">
            <AnimatePresence>
                {showYaraDialog && yaraCharImage && !selectedChallenge && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex items-end gap-2"
                  >
                    <div className="flex-grow mb-4">
                      <Card className="p-3 shadow-lg bg-white/95 relative">
                          <TypewriterText text={yaraMessage} className="text-sm text-primary font-medium" delay={1} />
                          <div className="absolute bottom-[-10px] left-8 w-0 h-0 border-r-[10px] border-r-transparent border-t-[10px] border-t-white/95 border-l-[10px] border-l-transparent"></div>
                      </Card>
                    </div>
                     <motion.div
                        key="yara"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0, transition: { duration: 0.8, delay: 0.2 } }}
                        exit={{ opacity: 0, x: 50, transition: { delay: 0.3, duration: 0.5 } }}
                        className="w-24 h-auto md:w-32 shrink-0"
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
