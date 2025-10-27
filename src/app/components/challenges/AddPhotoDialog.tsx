"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";

interface AddPhotoDialogProps {
  open: boolean;
  onClose: () => void;
  onTakePhoto: () => void;
  onUpload: () => void;
}

export default function AddPhotoDialog({
  open,
  onClose,
  onTakePhoto,
  onUpload,
}: AddPhotoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-headline">Añadir Foto</DialogTitle>
          <DialogDescription className="text-center">
            ¿Cómo quieres añadir tu foto?
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={onTakePhoto}
          >
            <Camera className="h-8 w-8" />
            <span>Tomar Foto</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={onUpload}
          >
            <Upload className="h-8 w-8" />
            <span>Cargar desde Galería</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
