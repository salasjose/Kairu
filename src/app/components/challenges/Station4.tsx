
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BrainCircuit, Link as LinkIcon, Upload } from "lucide-react";
import WaterQuiz from "@/app/components/challenges/WaterQuiz";
import { Input } from "@/components/ui/input";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";
import ResponsiveBackground from "../ResponsiveBackground";
import { doc, getDoc, setDoc, Firestore } from "firebase/firestore";
import type { User } from 'firebase/auth';

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

const PostChallenge = ({
  user,
  db,
  onComplete,
  onBack,
}: {
  user: User | null;
  db: Firestore | null;
  onComplete: () => void;
  onBack: () => void;
}) => {
  const [url, setUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const waterPostImage = PlaceHolderImages.find((p) => p.id === "water-post");
  
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
        if (!user || !db) return;
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().station4Url) {
                handleUrlChange(docSnap.data().station4Url);
            }
        } catch (error) {
            console.error("Error fetching station 4 URL:", error);
        }
    };
    fetchUrl();
  }, [user, db, handleUrlChange]);

  const handleSubmit = async () => {
    if (url.trim() && (url.startsWith("http://") || url.startsWith("https://"))) {
        if (user && db) {
            try {
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, { station4Url: url }, { merge: true });
                toast({ title: "URL Guardada", description: "Tu enlace ha sido guardado." });
                onComplete();
            } catch (error) {
                toast({ title: "Error", description: "No se pudo guardar la URL.", variant: "destructive" });
            }
        } else {
            toast({ title: "Error", description: "Debes iniciar sesión para guardar.", variant: "destructive" });
        }
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

export default function Station4({ user, db }: { user: User | null; db: Firestore | null; }) {
  const stationId = 4;
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage = "¡Bienvenido a TerrAzul! Aquí fluye la vida. El agua recorre montañas, ríos y mares, y depende de nosotros mantener su pureza. ¡Cuidemos cada gota y protejamos los territorios que le dan vida al planeta!";
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const terrazulBgImage = PlaceHolderImages.find((p) => p.id === "terrazul-background");
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
          user={user}
          db={db}
          onComplete={() => handleComplete("post")}
          onBack={() => setSelectedChallenge(null)}
        />
      );
    }
    return (
      <ResponsiveBackground>
        <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
          <h1 className="text-3xl md:text-5xl">TerrAzul</h1>
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
        </div>
      </ResponsiveBackground>
    );
  };

  return (
    <>
      <div className="relative flex-grow flex flex-col">{renderContent()}</div>
        <div className="absolute bottom-4 right-4 md:right-8 lg:right-12 z-20 flex items-end gap-0 md:gap-2 pointer-events-none">
          <AnimatePresence>
              {showYaraDialog && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.5 }}
                    className="w-64 md:w-80 mb-4"
                >
                    <Card className="p-3 shadow-lg bg-white/95 relative">
                        <TypewriterText text={yaraMessage} className="text-sm text-primary font-medium"/>
                        <div className="absolute bottom-[-10px] right-4 md:right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                    </Card>
                </motion.div>
              )}
          </AnimatePresence>
          
          {yaraCharImage && (
              <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.8 } }}
                  className="w-24 h-auto md:w-32 self-end"
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
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={stationId}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
