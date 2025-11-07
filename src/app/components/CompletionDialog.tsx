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

interface CompletionDialogProps {
  open: boolean;
  onGoToStation9: () => void;
}

export default function CompletionDialog({ open, onGoToStation9 }: CompletionDialogProps) {
  const router = useRouter();

  const handleGoToMap = () => {
    router.push('/');
  };

  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl justify-center text-center">
            <PartyPopper className="h-8 w-8 text-yellow-500" />
            ¡Felicitaciones!
            <PartyPopper className="h-8 w-8 text-yellow-500" />
          </DialogTitle>
          <DialogDescription className="text-center text-lg">
            Ahora eres un <span className="font-bold text-primary">Guardián de la Naturaleza</span>.
            <br />
            ¡Gracias por completar la aventura de Kairu!
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:flex-row sm:justify-center space-y-2 sm:space-y-0 sm:space-x-2">
          <Button onClick={handleGoToMap} variant="outline" className="w-full sm:w-auto">
            <MapIcon className="mr-2 h-4 w-4" />
            Volver al Mapa
          </Button>
          <Button onClick={onGoToStation9} className="w-full sm:w-auto">
            <Home className="mr-2 h-4 w-4" />
            Ir a mi Estación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
