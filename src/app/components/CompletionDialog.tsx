"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, Home, MapIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface CompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CompletionDialog({ open, onOpenChange }: CompletionDialogProps) {
  const router = useRouter();

  const handleGoToMap = () => {
    onOpenChange(false);
    router.push('/');
  };
  
  const handleGoToStation9 = () => {
    onOpenChange(false);
    router.push('/station/9');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl justify-center text-center">
            <PartyPopper className="h-8 w-8 text-yellow-500" />
            ¡Felicitaciones!
            <PartyPopper className="h-8 w-8 text-yellow-500" />
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row items-center justify-center text-center sm:text-left gap-4">
            <Image 
                src="/characters/YARA_LA_RANA.png"
                alt="Yara la rana feliz"
                width={120}
                height={150}
                className="w-24 sm:w-32 h-auto"
            />
            <DialogDescription className="text-lg">
                Ahora eres un <span className="font-bold text-primary">Guardián de la Naturaleza</span>.
                <br />
                ¡Gracias por completar la aventura de Kairu!
            </DialogDescription>
        </div>
        <DialogFooter className="sm:flex-row sm:justify-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={handleGoToMap} variant="outline" className="w-full sm:w-auto">
            <MapIcon className="mr-2 h-4 w-4" />
            Volver al Mapa
          </Button>
          <Button onClick={handleGoToStation9} className="w-full sm:w-auto">
            <Home className="mr-2 h-4 w-4" />
            Ir a mi Estación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
