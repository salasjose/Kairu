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
import { PartyPopper } from "lucide-react";

interface CompletionDialogProps {
  open: boolean;
  onReset: () => void;
}

export default function CompletionDialog({ open, onReset }: CompletionDialogProps) {
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
        <DialogFooter>
          <Button onClick={onReset} className="w-full">
            Jugar de Nuevo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
