"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Station6() {
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const circularEconomyImage = PlaceHolderImages.find((p) => p.id === "circular-economy-product");
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");

  const handleComplete = () => {
    unlockStation(7);
    toast({
      title: "¡Estación ReGira Completada!",
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
                    <p className="text-muted-foreground mb-4">Descubre cómo emprendimientos aplican la Economía Circular para transformar residuos en oportunidades.</p>
                     {circularEconomyImage && (
                        <Image
                            src={circularEconomyImage.imageUrl}
                            alt={circularEconomyImage.description}
                            width={400}
                            height={300}
                            className="rounded-lg border-4 border-white shadow-md mx-auto mb-6 w-full max-w-sm h-auto"
                            data-ai-hint={circularEconomyImage.imageHint}
                        />
                     )}
                     <p className="text-muted-foreground mb-4">Próximamente: Videos de estrategias de comercialización y promoción.</p>
                     <Button onClick={handleComplete} size="lg">Completar y Continuar</Button>
                </CardContent>
            </Card>

        </div>
      </div>
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={6}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
