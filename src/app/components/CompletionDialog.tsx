"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PartyPopper } from "lucide-react";

interface CompletionDialogProps {
  open: boolean;
  onReset: () => void;
}

export default function CompletionDialog({ open, onReset }: CompletionDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-2xl justify-center text-center">
            <PartyPopper className="h-8 w-8 text-yellow-500" />
            ¡Felicitaciones!
            <PartyPopper className="h-8 w-8 text-yellow-500" />
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg">
            Ahora eres un <span className="font-bold text-primary">Guardián de la Naturaleza</span>.
            <br />
            ¡Gracias por completar la aventura de Kairu!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onReset} className="w-full">
            Jugar de Nuevo
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
