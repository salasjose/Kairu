
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

const STORAGE_KEY_STATION6 = "kairu-station6-video";

export default function Station6() {
  const stationId = 6;
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const circularEconomyImage = PlaceHolderImages.find((p) => p.id === "circular-economy-product");

  useEffect(() => {
    const savedVideo = localStorage.getItem(STORAGE_KEY_STATION6);
    if (savedVideo) {
      setVideoUrl(savedVideo);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        try {
          localStorage.setItem(STORAGE_KEY_STATION6, dataUrl);
          setVideoUrl(dataUrl);
          toast({
            title: "Video Cargado",
            description: "Tu video ha sido guardado para esta sesión.",
          });
        } catch (error) {
          console.error("Error saving video to localStorage", error);
          setVideoUrl(URL.createObjectURL(file));
          toast({
            title: "Video Cargado (Temporalmente)",
            description: "El video es muy grande para guardarlo, se perderá si sales de la página.",
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
      <div className="w-full min-h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-200 to-purple-200 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">ReGira</h1>
          </div>
            <div className="max-w-xl mx-auto bg-black/50 text-white p-4 rounded-xl mb-8">
              <p className="font-bold text-lg">YARA: "¡Estamos en ReGira! Aquí aprenderás que todo en la naturaleza gira y se renueva. Cada recurso tiene una segunda oportunidad. ¡Es momento de cerrar el ciclo y darle nueva vida a lo que parecía terminar!"</p>
            </div>
            
            <Card className="w-full shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">Reto: Negocios Exitosos</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4">Descubre cómo emprendimientos aplican la Economía Circular para transformar residuos en oportunidades. Graba y carga un video explicando tu hallazgo.</p>
                     
                    <div className="bg-black rounded-lg border-4 border-white shadow-md mx-auto mb-6 w-full max-w-sm h-auto aspect-video flex items-center justify-center">
                      {videoUrl ? (
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
      </div>
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={stationId}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
