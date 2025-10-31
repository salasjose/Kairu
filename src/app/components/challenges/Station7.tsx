"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";


export default function Station7() {
  const [listContent, setListContent] = useState("");
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const greenBusinessImage = PlaceHolderImages.find((p) => p.id === "green-business");

  const handleComplete = () => {
    if(listContent.trim().length < 10) {
        toast({
            title: "Reto incompleto",
            description: "Por favor, escribe una lista de al menos un negocio sostenible que conozcas.",
            variant: "destructive",
        })
        return;
    }
    unlockStation(8);
    toast({
      title: "¡Estación VerdeLAb Completada!",
      description: `¡Buen trabajo investigando negocios verdes!`,
    });
    setIsPrizeModalOpen(true);
  };

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };


  return (
    <>
      <div className="w-full min-h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-teal-200 to-green-200 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">VerdeLAb</h1>
          </div>
            <div className="max-w-xl mx-auto bg-black/50 text-white p-4 rounded-xl mb-8">
              <p className="font-bold text-lg">YARA: "¡Te doy la bienvenida a VerdeLab! Este es el laboratorio donde los sueños sostenibles se convierten en proyectos reales. ¡Emprende con propósito, crea con el corazón y demuestra que cuidar también puede ser una gran idea!"</p>
            </div>
          
           <Card className="w-full shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-bold">Reto: Negocios Verdes en Acción</CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">Crea una lista de los negocios sostenibles de tu entorno.</p>
                     {greenBusinessImage && (
                        <Image
                            src={greenBusinessImage.imageUrl}
                            alt={greenBusinessImage.description}
                            width={400}
                            height={300}
                            className="rounded-lg border-4 border-white shadow-md mx-auto mb-6 w-full max-w-sm h-auto"
                            data-ai-hint={greenBusinessImage.imageHint}
                        />
                     )}
                     <Textarea 
                        placeholder="1. Nombre del negocio - ¿Qué lo hace sostenible?&#10;2. ... "
                        value={listContent}
                        onChange={(e) => setListContent(e.target.value)}
                        className="max-w-lg mx-auto"
                        rows={5}
                     />
                     <Button onClick={handleComplete} size="lg">Completar y Continuar</Button>
                </CardContent>
            </Card>

        </div>
      </div>
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={7}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
