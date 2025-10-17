"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { allPrizes } from "@/lib/data";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { usePrizeCart } from "@/hooks/use-prize-cart.tsx";


interface PrizeDialogProps {
  open: boolean;
  stationId: number;
  onClaim: () => void;
}

export default function PrizeDialog({ open, stationId, onClaim }: PrizeDialogProps) {
  const [selectedPrize, setSelectedPrize] = useState<number | null>(null);
  const { addPrize } = usePrizeCart();

  const handleClaim = () => {
    if (selectedPrize === null) {
      toast({
        title: "Elige un premio",
        description: "Debes seleccionar una insignia para continuar.",
        variant: "destructive",
      });
      return;
    }
    const prize = allPrizes.find(p => p.id === selectedPrize);
    addPrize(selectedPrize);
    toast({
        title: `¡Felicidades!`,
        description: `Has ganado la insignia: ${prize?.name}.`
    });
    onClaim();
  }

  // We filter prizes for this modal, maybe show different ones per station later?
  const availablePrizes = allPrizes;

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-headline">¡Estación {stationId} Completada!</DialogTitle>
          <DialogDescription className="text-center">
            ¡Excelente trabajo! Como recompensa, elige una de las siguientes insignias.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-4 py-4">
          {availablePrizes.map((prize) => {
            const Icon = prize.icon;
            return (
              <button
                key={prize.id}
                onClick={() => setSelectedPrize(prize.id)}
                className={cn(
                  "flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all",
                  selectedPrize === prize.id
                    ? "border-primary bg-primary/10 shadow-lg scale-105"
                    : "border-border hover:bg-accent"
                )}
              >
                <Icon className="h-8 w-8 mb-2 text-primary" />
                <span className="text-xs text-center font-medium">{prize.name}</span>
              </button>
            )
          })}
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
