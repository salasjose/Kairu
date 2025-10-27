"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ChallengeContainerProps {
  stationId: number;
  title: string;
  description: string;
  children: React.ReactNode;
  onChallengeComplete: () => boolean;
  onStationComplete: () => void;
}

export default function ChallengeContainer({
  stationId,
  title,
  description,
  children,
  onChallengeComplete,
  onStationComplete,
}: ChallengeContainerProps) {
  
  const handleComplete = () => {
    if (onChallengeComplete()) {
      onStationComplete();
    } else {
        toast({
            title: "Reto Incompleto",
            description: "Por favor, completa el reto para poder continuar.",
            variant: "destructive",
        });
    }
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
            Completar Reto
          </Button>
        </div>
      </div>
    </>
  );
}
