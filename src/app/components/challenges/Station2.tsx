
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Lock, Camera, X, Video } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import AddPhotoDialog from "./AddPhotoDialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";
import { useUser, useFirestore, useStorage } from "@/firebase/hooks";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import ArtDirectedBackground from "../ArtDirectedBackground";

type DayStatus = "locked" | "unlocked" | "completed";

interface DayState {
  status: DayStatus;
  unlockTime: number | null;
  photoUrl?: string | null;
}

const initialDays: DayState[] = Array(7)
  .fill(null)
  .map((_, i) => ({
    status: i === 0 ? "unlocked" : "locked",
    unlockTime: i === 0 ? Date.now() : null,
    photoUrl: null,
  }));

const CameraView = ({ onCapture, onCancel }: { onCapture: (url: string) => void; onCancel: () => void; }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("Camera API is not supported by this browser.");
        setHasCameraPermission(false);
        toast({
            variant: "destructive",
            title: "Cámara no Soportada",
            description: "Tu navegador no es compatible con la API de la cámara.",
        });
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Acceso a la Cámara Denegado",
          description: "Por favor, habilita los permisos de la cámara en tu navegador.",
        });
      }
    };

    getCameraPermission();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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
                    Por favor, permite el acceso a la cámara para usar esta función.
                    Es posible que necesites cambiar los permisos en la configuración de tu navegador.
                  </AlertDescription>
                </Alert>
            </div>
        )}
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <Button onClick={onCancel} variant="outline" size="lg" className="rounded-full">
            <X className="h-6 w-6 mr-2"/>
            Cancelar
        </Button>
        <Button onClick={handleCapture} size="lg" disabled={!hasCameraPermission} className="rounded-full">
          <Camera className="h-6 w-6 mr-2" />
          Tomar Foto
        </Button>
      </div>
    </div>
  );
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


const PhotoUploadChallenge = ({
  day,
  photoUrl,
  onComplete,
  onBack,
}: {
  day: number;
  photoUrl: string | null;
  onComplete: (photoUrl: string) => void;
  onBack: () => void;
}) => {
  const { user } = useUser();
  const storage = useStorage();
  
  const [imageUrl, setImageUrl] = useState<string | null>(photoUrl);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sustainablePracticeImage = PlaceHolderImages.find(
    (p) => p.id === "sustainable-practice"
  );

  const handlePhotoTaken = async (dataUrl: string) => {
    setIsAddPhotoDialogOpen(false);
    setIsCameraOpen(false);

    if (!user || !storage) {
        toast({ title: "Error", description: "Debes iniciar sesión para subir una imagen.", variant: "destructive" });
        return;
    }

    try {
        const storagePath = `users/${user.uid}/station2/day_${day}_${Date.now()}.jpg`;
        const storageRef = ref(storage, storagePath);
        
        await uploadString(storageRef, dataUrl, "data_url");
        const downloadUrl = await getDownloadURL(storageRef);

        setImageUrl(downloadUrl);
        toast({
            title: `Foto del Día ${day} subida`,
            description: "¡Has completado el reto de hoy!",
        });
        onComplete(downloadUrl);

    } catch (error) {
        console.error("Error uploading photo:", error);
        toast({ title: "Error al Subir", description: "No se pudo subir la foto. Inténtalo de nuevo.", variant: "destructive" });
    }
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const dataUrl = await fileToDataUrl(file);
      await handlePhotoTaken(dataUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    setIsAddPhotoDialogOpen(false);
    fileInputRef.current?.click();
  };

  const handleTakeNewPhotoClick = () => {
    setIsAddPhotoDialogOpen(false);
    setIsCameraOpen(true);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />
      {isCameraOpen && (
        <CameraView 
            onCapture={handlePhotoTaken}
            onCancel={() => setIsCameraOpen(false)}
        />
     )}
     <AddPhotoDialog
        open={isAddPhotoDialogOpen}
        onClose={() => setIsAddPhotoDialogOpen(false)}
        onTakePhoto={handleTakeNewPhotoClick}
        onUpload={handleUploadClick}
      />

      <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center h-full">
        <Button variant="ghost" onClick={onBack} className="mb-4 self-start">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a los retos
        </Button>
        <Card className="text-center w-full">
          <CardContent className="p-6">
            <h3 className="font-bold text-2xl text-primary font-headline mb-4">
              Reto del Día {day}
            </h3>
            
            <div className="aspect-video w-full max-w-sm mx-auto mb-4 rounded-lg bg-card border-2 border-dashed flex items-center justify-center relative">
                {imageUrl ? (
                    <>
                        <Image
                            src={imageUrl}
                            alt={`Reto del día ${day}`}
                            fill
                            className="object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                           <CheckCircle className="h-12 w-12 text-white" />
                        </div>
                    </>
                ) : (
                    sustainablePracticeImage?.imageUrl && <Image
                        src={sustainablePracticeImage.imageUrl}
                        alt={sustainablePracticeImage.imageHint}
                        fill
                        className="object-cover rounded-md opacity-20"
                        data-ai-hint={sustainablePracticeImage.imageHint}
                    />
                )}
            </div>

            <p className="text-muted-foreground mb-6">
              Durante una semana, cada día registrarás tus prácticas sostenibles (Separar residuos, usar productos reutilizables, hacer compost, salir en bicicleta, reutilizar el papel, entre otras).
            </p>
            
            {!imageUrl && (
              <Button onClick={() => setIsAddPhotoDialogOpen(true)} size="lg">
                <Camera className="mr-2" />
                Registrar Práctica
              </Button>
            )}
             <p className="text-xs text-muted-foreground mt-4">RECORDATORIO: “Tus acciones del presente beneficiarán a las generaciones del futuro.”</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default function Station2() {
  const stationId = 2;
  const { user } = useUser();
  const db = useFirestore();

  const [days, setDays] = useState<DayState[]>(initialDays);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage = "¡Llegamos a ImpacTrack! Aquí aprenderás que cada acción deja huella. Observa tu entorno, registra tus buenas prácticas y demuestra que tu impacto puede ser positivo. ¡Haz que tus pasos cuenten por el planeta!";
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");

  useEffect(() => {
    setIsClient(true);
  }, []);

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


  const updateAndSaveChanges = useCallback(async (newDays: DayState[]) => {
    setDays(newDays);
    if (user && db) {
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { station2Days: newDays }, { merge: true });
        } catch (error) {
            console.error("Failed to save station 2 progress to Firestore", error);
            toast({ title: "Error", description: "No se pudo guardar tu progreso en la nube.", variant: "destructive" });
        }
    }
  }, [user, db]);

  useEffect(() => {
    const fetchProgress = async () => {
        if (!isClient || !user || !db) return;
        
        let loadedDays: DayState[];
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().station2Days) {
                loadedDays = docSnap.data().station2Days;
            } else {
                loadedDays = initialDays;
                await setDoc(userDocRef, { station2Days: initialDays }, { merge: true });
            }

            const now = Date.now();
            const updatedDays = loadedDays.map(day => {
                if (day.status === "locked" && day.unlockTime && now >= day.unlockTime) {
                    return { ...day, status: "unlocked" };
                }
                return day;
            });

            setDays(updatedDays);
            if (JSON.stringify(updatedDays) !== JSON.stringify(loadedDays)) {
                await setDoc(userDocRef, { station2Days: updatedDays }, { merge: true });
            }

        } catch (error) {
            console.error("Error fetching/updating station 2 progress", error);
            setDays(initialDays);
        }
    }
    fetchProgress();
  }, [user, db, isClient]);


  useEffect(() => {
    if (!isClient) return;

    const interval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      const newDays = days.map(day => {
          if (day.status === "locked" && day.unlockTime && now >= day.unlockTime) {
              changed = true;
              return { ...day, status: "unlocked" };
          }
          return day;
      });
      
      if(changed) {
          updateAndSaveChanges(newDays);
      }
    }, 1000 * 30); // Check for unlocks every 30 seconds

    return () => clearInterval(interval);
  }, [isClient, days, updateAndSaveChanges]);

  const handleDayComplete = (dayIndex: number, photoUrl: string) => {
    const newDays = [...days];
    newDays[dayIndex].status = "completed";
    newDays[dayIndex].photoUrl = photoUrl;

    const nextDayIndex = dayIndex + 1;
    if (nextDayIndex < days.length) {
      if (newDays[nextDayIndex].status === "locked") {
        newDays[nextDayIndex].unlockTime = Date.now() + 2 * 60 * 1000; // 2 minutes from now
      }
    }

    updateAndSaveChanges(newDays);
    setSelectedDay(null);

    const allCompleted = newDays.every((d) => d.status === "completed");
    if (allCompleted) {
      unlockStation(stationId + 1);
      toast({
        title: `¡Estación ${stationId} Completada!`,
        description: "¡Fantástico! Sigue con esos hábitos sostenibles.",
      });
      setIsPrizeModalOpen(true);
    }
  };

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };

  if (!isClient) {
     return (
       <div className="w-full flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden">
          Cargando estación...
       </div>
     );
  }

  if (selectedDay !== null) {
    const dayIndex = selectedDay - 1;
    const dayData = days[dayIndex];
    return (
      <PhotoUploadChallenge
        day={selectedDay}
        photoUrl={dayData.photoUrl ?? null}
        onComplete={(photoUrl) => handleDayComplete(dayIndex, photoUrl)}
        onBack={() => setSelectedDay(null)}
      />
    );
  }

  const renderDayButton = (dayIndex: number) => {
    const day = days[dayIndex];
    return (
      <button
        key={dayIndex}
        disabled={day.status === "locked"}
        onClick={() => setSelectedDay(dayIndex + 1)}
        className="transition-transform duration-300 disabled:cursor-not-allowed group hover:scale-105"
      >
        <div
          className={cn(
            "relative w-24 h-20 md:w-32 md:h-24 bg-primary/80 rounded-lg shadow-lg flex items-center justify-center border-4 border-white/80 group-hover:scale-105 group-disabled:scale-100 group-disabled:bg-primary/40 transition-transform",
            "transform -rotate-3"
          )}
        >
          {day.status === "locked" && (
            <Lock className="w-8 h-8 md:w-10 md:h-10 text-white/70" />
          )}
          {day.status === "unlocked" && (
            <span className="font-kalam text-4xl md:text-5xl text-white">
              {dayIndex + 1}
            </span>
          )}
          {day.status === "completed" && (
            <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-green-300" />
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      <ArtDirectedBackground
          desktopSrc="/backgrounds/Impactrack1366_X_768.png"
          tabletSrc="/backgrounds/Impactrack1024_X_768.png"
          mobileSrc="/backgrounds/Impactrack1075_X_1944.png"
        >
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center">
            <div className="bg-white/90 backdrop-blur-sm text-primary font-kalam py-3 px-10 rounded-lg shadow-lg -rotate-3 mb-8">
                <h1 className="text-4xl md:text-5xl">ImpacTrack</h1>
            </div>
            
          <div className="flex flex-col items-center gap-4 md:gap-6 bg-background/70 backdrop-blur-sm p-6 rounded-xl">
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {days.slice(0, 4).map((_, index) => renderDayButton(index))}
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {days.slice(4, 7).map((_, index) => renderDayButton(index + 4))}
            </div>
             <p className="text-sm text-muted-foreground mt-4">MECÁNICA: Cada vez que subas tu foto, pasadas 2 minutos se activará el siguiente candado para continuar.</p>
          </div>
          
        </div>
          {/* Yara Character and Dialog */}
          <div className="absolute bottom-4 right-4 z-20 flex items-end gap-4 pointer-events-none">
          <AnimatePresence>
            {showYaraDialog && yaraCharImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                className="flex items-end gap-4"
              >
                <div className="w-64 mb-4">
                  <Card className="p-3 shadow-lg bg-white/95 relative">
                    <TypewriterText text={yaraMessage} className="text-sm text-primary font-medium"/>
                    <div className="absolute bottom-[-10px] right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                  </Card>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
                  exit={{ opacity: 0, x: 50 }}
                  className="w-24 h-auto md:w-32"
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
      </ArtDirectedBackground>
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={stationId}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
