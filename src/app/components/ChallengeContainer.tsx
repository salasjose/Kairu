"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import PrizeDialog from "./PrizeDialog";
import { stations } from "@/lib/data";

interface ChallengeContainerProps {
  stationId: number;
  title: string;
  description: string;
  children: React.ReactNode;
  onChallengeComplete: () => boolean;
}

export default function ChallengeContainer({
  stationId,
  title,
  description,
  children,
  onChallengeComplete,
}: ChallengeContainerProps) {
  const { unlockStation } = useStationProgress();
  const router = useRouter();
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const station = stations.find(s => s.id === stationId);

  const handleComplete = () => {
    if (onChallengeComplete()) {
      unlockStation(stationId + 1);
      toast({
        title: `¡${station?.title} Completada!`,
        description: "¡Has ganado un premio!",
      });
      setIsPrizeModalOpen(true);
    } else {
        toast({
            title: "Reto Incompleto",
            description: "Por favor, completa el reto para poder continuar.",
            variant: "destructive",
        });
    }
  };

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };

  return (
    <>
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6">
        <div className="mb-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary">{title}</h2>
          <p className="text-muted-foreground mt-2 text-lg">{description}</p>
        </div>

        <div className="bg-card p-6 md:p-8 rounded-xl shadow-md border">
          {children}
        </div>

        <div className="mt-8 text-center">
          <Button size="lg" onClick={handleComplete}>
            Completar Reto y Reclamar Premio
          </Button>
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
