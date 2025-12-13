
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Camera, Store, Trash2, SwitchCamera, X, Video } from 'lucide-react';
import PrizeDialog from '../PrizeDialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser, useFirestore, useStorage } from '@/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterText from '../auth/TypewriterText';
import { useStationProgress } from '@/hooks/use-station-progress';
import { useRouter } from 'next/navigation';
import { usePrizeCart } from '@/hooks/use-prize-cart';
import ResponsiveBackground from '../ResponsiveBackground';

type Business = {
  name: string;
  imageUrl: string;
};

const CameraView = ({ onCapture, onCancel }: { onCapture: (url: string) => void; onCancel: () => void; }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  const toggleCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCameraPermission(false);
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const handleCapture = () => {
    if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            onCapture(canvas.toDataURL('image/jpeg'));
        }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg aspect-[4/3] bg-black rounded-lg overflow-hidden">
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        {hasCameraPermission === false && (
            <div className="absolute inset-0 flex items-center justify-center bg-black">
                <Alert variant="destructive" className="max-w-sm">
                  <Video className="h-4 w-4" />
                  <AlertTitle>Acceso a la Cámara Requerido</AlertTitle>
                  <AlertDescription>
                    Por favor, habilita los permisos de la cámara.
                  </AlertDescription>
                </Alert>
            </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <Button onClick={onCancel} variant="outline" size="icon" className="rounded-full h-16 w-16">
            <X className="h-8 w-8"/>
        </Button>
        <Button onClick={handleCapture} size="lg" disabled={!hasCameraPermission} className="rounded-full h-20 w-20">
          <Camera className="h-10 w-10" />
        </Button>
        <Button onClick={toggleCamera} variant="outline" size="icon" className="rounded-full h-16 w-16" disabled={!hasCameraPermission}>
            <SwitchCamera className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
};


const AddBusinessDialog = ({
  open,
  onClose,
  onSave,
  isLoading,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (business: Business) => void;
  isLoading: boolean;
}) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCapture = (dataUrl: string) => {
    setImage(dataUrl);
    setIsCameraOpen(false);
  };
  
  const resetDialog = () => {
    setName('');
    setImage(null);
  }

  const handleSave = () => {
    if (!name.trim()) {
      toast({
        title: 'Falta el nombre',
        description: 'Por favor, añade un nombre para el negocio.',
        variant: 'destructive',
      });
      return;
    }
    if (!image) {
      toast({
        title: 'Falta la imagen',
        description: 'Por favor, carga o toma una imagen para el negocio.',
        variant: 'destructive',
      });
      return;
    }
    onSave({ name, imageUrl: image });
    resetDialog();
  };

  const handleClose = () => {
    resetDialog();
    onClose();
  };
  
  const handleTakePhoto = () => {
    setIsCameraOpen(true);
  }


  return (
    <>
      {isCameraOpen && <CameraView onCapture={handleCapture} onCancel={() => setIsCameraOpen(false)} />}
      <Dialog open={open && !isCameraOpen} onOpenChange={(isOpen) => !isOpen && handleClose()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Negocio Verde</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Nombre del negocio"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-20"
                onClick={handleTakePhoto}
              >
                <Camera className="mr-2" />
                Tomar Foto
              </Button>
              <Button
                variant="outline"
                className="h-20"
                onClick={() => fileInputRef.current?.click()}
              >
                <Store className="mr-2" />
                Cargar Imagen
              </Button>
            </div>
            {image && (
              <div className="relative w-full h-32 rounded-md overflow-hidden border">
                <Image src={image} alt="Vista previa" fill style={{ objectFit: 'cover' }} />
              </div>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleSave} disabled={isLoading || !image || !name}>
              {isLoading ? 'Guardando...' : 'Guardar Negocio'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function Station7() {
  const stationId = 7;
  const [businesses, setBusinesses] = useState<(Business | null)[]>(
    Array(4).fill(null)
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { unlockStation } = useStationProgress();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  const { prizes } = usePrizeCart();

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage =
    '¡Te doy la bienvenida a VerdeLab! Este es el laboratorio donde los sueños sostenibles se convierten en proyectos reales. ¡Emprende con propósito, crea con el corazón y demuestra que cuidar también puede ser una gran idea!';
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const yaraCharImage = PlaceHolderImages.find((p) => p.id === 'char-yara-3');

  const scheduleYaraDialog = useCallback(() => {
    if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    yaraTimerRef.current = setTimeout(() => {
      setShowYaraDialog(true);
      const hideTimer = setTimeout(() => setShowYaraDialog(false), 15000);
    }, 1000);
  }, []);

  useEffect(() => {
    scheduleYaraDialog();
    return () => {
      if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    };
  }, [scheduleYaraDialog]);

  const updateBusinessesInDb = useCallback(
    async (newBusinesses: (Business | null)[]) => {
      if (!user || !db) return;
      const userDocRef = doc(db, 'users', user.uid);
      try {
        await setDoc(
          userDocRef,
          { station7Businesses: newBusinesses.filter(Boolean) },
          { merge: true }
        );
      } catch (error) {
        console.error('Error saving businesses to Firestore:', error);
        toast({
          title: 'Error',
          description: 'No se pudo guardar tu progreso en la nube.',
          variant: 'destructive',
        });
      }
    },
    [user, db]
  );

  useEffect(() => {
    const fetchBusinesses = async () => {
      if (!user || !db) return;
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().station7Businesses) {
          const savedBusinesses = docSnap.data().station7Businesses;
          const newBusinesses = Array(4).fill(null);
          savedBusinesses.forEach((biz: Business, index: number) => {
            if (index < 4) newBusinesses[index] = biz;
          });
          setBusinesses(newBusinesses);
        }
      } catch (error) {
        console.error('Error fetching businesses from Firestore:', error);
      }
    };
    fetchBusinesses();
  }, [user, db]);

  const handleSaveBusiness = async (business: Business) => {
    if (!storage || !user) {
      toast({
        title: 'Error',
        description: 'Servicio de almacenamiento no disponible.',
        variant: 'destructive',
      });
      return;
    }

    const firstEmptyIndex = businesses.findIndex((b) => b === null);
    if (firstEmptyIndex === -1) {
      toast({
        title: 'Galería llena',
        description: 'Ya has añadido 4 negocios.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    setIsDialogOpen(false);

    try {
      // 1. Upload image to Firebase Storage
      const storagePath = `users/${user.uid}/station7/${business.name.replace(/\s+/g, '_')}_${Date.now()}.jpg`;
      const storageRef = ref(storage, storagePath);
      
      // The business.imageUrl is a data URL from the dialog
      await uploadString(storageRef, business.imageUrl, 'data_url');
      
      // 2. Get the download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // 3. Create a new business object with the download URL
      const newBusinessWithUrl: Business = {
        name: business.name,
        imageUrl: downloadUrl,
      };
      
      // 4. Update local state and Firestore
      const newBusinesses = [...businesses];
      newBusinesses[firstEmptyIndex] = newBusinessWithUrl;
      setBusinesses(newBusinesses);
      await updateBusinessesInDb(newBusinesses);
      
      toast({
        title: '¡Negocio añadido!',
        description: `${business.name} se ha guardado correctamente.`,
      });

    } catch (error) {
      console.error('Error uploading image or saving business:', error);
      toast({
        title: 'Error al Guardar',
        description: 'No se pudo subir la imagen o guardar el negocio.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteBusiness = (index: number) => {
    const newBusinesses = [...businesses];
    newBusinesses[index] = null;
    const compacted = newBusinesses.filter(Boolean);
    const finalState = Array(4).fill(null);
    compacted.forEach((biz, i) => (finalState[i] = biz));

    setBusinesses(finalState);
    updateBusinessesInDb(finalState);
  };

  const handleComplete = () => {
    unlockStation(stationId + 1);
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: `¡Buen trabajo investigando negocios verdes!`,
    });
    setIsPrizeModalOpen(true);
  };

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push('/');
  };

  const businessesCount = businesses.filter((b) => b !== null).length;
  const areAllChallengesComplete = businessesCount >= 4;
  const hasClaimedPrize = prizes.some((p) => p.stationId === stationId);

  return (
    <>
      <AddBusinessDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveBusiness}
        isLoading={isSaving}
      />

      <ResponsiveBackground
        desktopSrc="/backgrounds/Verdelab1366x_768.png"
        tabletSrc="/backgrounds/Verdelab1024_X_768.png"
        mobileSrc="/backgrounds/Verdelab1075_X_1944.png"
      >
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">VerdeLAb</h1>
          </div>

          <Card className="w-full max-w-3xl shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold">
                Reto: Negocios Verdes en Acción
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                Te invitamos a colocar 4 Negocios que reconozcas como
                sostenibles.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {businesses.map((business, index) => (
                  <Card
                    key={index}
                    className="aspect-square flex flex-col items-center justify-center p-2 relative overflow-hidden"
                  >
                    {business ? (
                      <>
                        <Image
                          src={business.imageUrl}
                          alt={business.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-end p-2 text-white">
                          <p className="font-bold text-sm text-center">
                            {business.name}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 z-10"
                          onClick={() => handleDeleteBusiness(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        className="flex-col h-full w-full"
                        onClick={() => setIsDialogOpen(true)}
                      >
                        <Store className="h-10 w-10 text-muted-foreground" />
                        <span className="text-xs mt-1">Añadir Negocio</span>
                      </Button>
                    )}
                  </Card>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center gap-2 pt-4">
                <Button
                  onClick={handleComplete}
                  size="lg"
                  disabled={!areAllChallengesComplete || hasClaimedPrize}
                >
                  Completar Reto y Reclamar Insignia
                </Button>
                {areAllChallengesComplete && hasClaimedPrize ? (
                  <p className="text-sm text-muted-foreground bg-background/80 p-2 rounded-md">
                    Ya has reclamado la insignia de esta estación.
                  </p>
                ) : !areAllChallengesComplete && (
                  <p className="text-sm text-muted-foreground">
                    Faltan {4 - businessesCount} negocio(s) por añadir.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </ResponsiveBackground>

       {/* Yara Character and Dialog */}
      <div className="absolute bottom-4 right-4 sm:right-8 z-20 w-full max-w-xs sm:max-w-sm md:max-w-md pointer-events-none">
        <AnimatePresence>
          {showYaraDialog && yaraCharImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex items-end gap-2"
            >
              <div className="flex-grow mb-4">
                <Card className="p-3 shadow-lg bg-white/95 relative">
                  <TypewriterText
                    text={yaraMessage}
                    className="text-sm text-primary font-medium"
                  />
                  <div className="absolute bottom-[-10px] right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                </Card>
              </div>
              <motion.div
                key="yara"
                initial={{ opacity: 0, x: 50 }}
                animate={{
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.8, delay: 0.2 },
                }}
                exit={{
                  opacity: 0,
                  x: 50,
                  transition: { delay: 0.3, duration: 0.5 },
                }}
                className="w-24 h-auto md:w-32 shrink-0"
              >
                <Image
                  src={yaraCharImage.imageUrl}
                  alt={yaraCharImage.description}
                  width={150}
                  height={187}
                  className="h-auto w-full select-none"
                  priority
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={stationId}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
