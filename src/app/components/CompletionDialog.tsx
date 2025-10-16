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
            Congratulations!
            <PartyPopper className="h-8 w-8 text-yellow-500" />
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-lg">
            You are now a <span className="font-bold text-primary">Guardian of Nature</span>.
            <br />
            Thank you for completing the EcoQuest!
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={onReset} className="w-full">
            Play Again
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
