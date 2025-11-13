
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { doc, setDoc, getDoc, Firestore } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";
import type { User } from 'firebase/auth';

export default function Station6({ user, db }: { user: User | null; db: Firestore | null; }) {
  const stationId = 6;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage = "¡Estamos en ReGira! Aquí aprenderás que todo en la naturaleza gira y se renueva. Cada recurso tiene una segunda oportunidad. ¡Es momento de cerrar el ciclo y darle nueva vida a lo que parecía terminar!";
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const circularEconomyImage = PlaceHolderImages.find((p) => p.id === "circular-economy-product");
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
        toast({
            title: "Error",
            description: "No se pudo cargar el video guardado.",
            variant: "destructive",
        });
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
          toast({
            title: "Video Guardado",
            description: "Tu video ha sido guardado en tu perfil.",
          });
        } catch (error) {
           console.error("Error saving video to Firestore", error);
           toast({
             title: "Error al Guardar",
             description: "No se pudo guardar el video. Inténtalo de nuevo.",
             variant: "destructive"
           });
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

  const handleComplete = () => {
    if (!videoUrl) {
      toast({
        title: "Reto Incompleto",
        description: "Debes cargar un video para completar el reto.",
        variant: "destructive",
      });
      return;
    }
    unlockStation(stationId + 1);
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: `Has aprendido sobre economía circular.`,
    });
    setIsPrizeModalOpen(true);
  };
  
  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };


  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="video/*"
      />
      <div className="w-full min-h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
         {regiraBgImage && (
            <Image
                src={regiraBgImage.imageUrl}
                alt={regiraBgImage.description}
                fill
                style={{objectFit: 'cover'}}
                className="z-0"
                data-ai-hint={regiraBgImage.imageHint}
            />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">ReGira</h1>
          </div>
            
            <Card className="w-full shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">Reto: Negocios Exitosos</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                     
                    <div className="bg-black rounded-lg border-4 border-white shadow-md mx-auto mb-6 w-full max-w-sm h-auto aspect-video flex items-center justify-center">
                      {isLoading ? (
                        <p className="text-white">Cargando video...</p>
                      ) : videoUrl ? (
                        <video src={videoUrl} controls className="w-full h-full rounded-md" />
                      ) : (
                         circularEconomyImage && (
                          <Image
                              src={circularEconomyImage.imageUrl}
                              alt={circularEconomyImage.description}
                              width={400}
                              height={225}
                              className="object-cover w-full h-full opacity-50"
                              data-ai-hint={circularEconomyImage.imageHint}
                          />
                       )
                      )}
                    </div>
                     
                     <div className="flex justify-center gap-4">
                        <Button onClick={() => fileInputRef.current?.click()} variant="outline" size="lg">
                            <Upload className="mr-2"/>
                            Cargar Video
                        </Button>
                        <Button onClick={handleComplete} size="lg" disabled={!videoUrl}>
                            Completar Reto
                        </Button>
                     </div>
                </CardContent>
            </Card>

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
