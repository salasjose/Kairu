
"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { allPrizes, stations } from "@/lib/data";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { usePrizeCart } from "@/hooks/use-prize-cart";
import type { Prize } from "@/lib/data";


interface PrizeDialogProps {
  open: boolean;
  stationId: number;
  onClaim: () => void;
}

export default function PrizeDialog({ open, stationId, onClaim }: PrizeDialogProps) {
  const [selectedPrize, setSelectedPrize] = useState<Prize | null>(null);
  const { addPrize } = usePrizeCart();
  const station = stations.find(s => s.id === stationId);

  const handleClaim = async () => {
    if (selectedPrize === null) {
      toast({
        title: "Elige un premio",
        description: "Debes seleccionar una insignia para continuar.",
        variant: "destructive",
      });
      return;
    }
    
    await addPrize(selectedPrize);
    
    toast({
        title: `¡Felicidades!`,
        description: `Has ganado la insignia: ${selectedPrize?.name}.`
    });

    onClaim();
  }

  // Get the specific prizes for the current station (adjust index for 0-based array)
  const availablePrizes = allPrizes[stationId - 1] || [];

  return (
    <Dialog open={open}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-headline">¡{station?.title} Completada!</DialogTitle>
          <DialogDescription className="text-center">
            ¡Excelente trabajo! Como recompensa, elige una de las siguientes insignias.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-4 py-4">
          {availablePrizes.map((prize) => (
            <button
              key={prize.id}
              onClick={() => setSelectedPrize(prize)}
              className={cn(
                "flex flex-col items-center justify-start p-2 border-2 rounded-lg transition-all aspect-square",
                selectedPrize?.id === prize.id
                  ? "border-primary bg-primary/10 shadow-lg scale-105"
                  : "border-border hover:bg-accent"
              )}
            >
              <div className="relative w-full flex-grow mb-1">
                <Image 
                  src={prize.imageUrl} 
                  alt={prize.name} 
                  fill
                  style={{objectFit:"contain"}}
                  className={cn(
                    (prize.imageUrl.includes('Molinos.png') || prize.imageUrl.includes('Panal.png') || prize.imageUrl.includes('Ciudad.png')) && "scale-125"
                  )}
                />
              </div>
              <span className="text-xs text-center font-medium h-8 flex items-center">{prize.name}</span>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleClaim} className="w-full">
            Reclamar Insignia y Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
