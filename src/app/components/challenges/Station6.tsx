
"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useFirestore } from "@/firebase/hooks";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function Station6() {
  const stationId = 6;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useUser();
  const db = useFirestore();
  const [isLoading, setIsLoading] = useState(true);

  const circularEconomyImage = PlaceHolderImages.find((p) => p.id === "circular-economy-product");
  const regiraBgImage = PlaceHolderImages.find(p => p.id === 'regira-background');

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
  
  const handleSimulateComplete = () => {
    unlockStation(stationId + 1);
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: "Has simulado la finalización. ¡Escoge tu premio!",
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
            <div className="max-w-xl mx-auto bg-black/50 text-white p-4 rounded-xl mb-8">
              <p className="font-bold text-lg">YARA: "¡Estamos en ReGira! Aquí aprenderás que todo en la naturaleza gira y se renueva. Cada recurso tiene una segunda oportunidad. ¡Es momento de cerrar el ciclo y darle nueva vida a lo que parecía terminar!"</p>
            </div>
            
            <Card className="w-full shadow-lg bg-card/80 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">Reto: Negocios Exitosos</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4">Descubre cómo emprendimientos aplican la Economía Circular para transformar residuos en oportunidades. Graba y carga un video explicando tu hallazgo.</p>
                     
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
                      <Button onClick={handleSimulateComplete} className="mt-4">Simular Finalización</Button>
                </CardContent>
            </Card>

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
