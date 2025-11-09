
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Lock, Upload, Camera, X, Video } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import AddPhotoDialog from "./AddPhotoDialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";

const STORAGE_KEY_STATION2 = "kairu-station2-progress";

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
  const sustainablePracticeImage = PlaceHolderImages.find(p => p.id === "sustainable-practice");

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
    onCapture(sustainablePracticeImage?.imageUrl ?? `https://picsum.photos/seed/capture${Date.now()}/400/300`);
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
  const [imageUrl, setImageUrl] = useState<string | null>(photoUrl);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sustainablePracticeImage = PlaceHolderImages.find(
    (p) => p.id === "sustainable-practice"
  );

  const handlePhotoTaken = (url: string) => {
    setImageUrl(url);
    setIsCameraOpen(false);
    toast({
      title: `Foto del Día ${day} guardada`,
      description: "¡Has completado el reto de hoy!",
    });
    onComplete(url);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handlePhotoTaken(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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
                    <Image
                        src={sustainablePracticeImage?.imageUrl ?? "https://picsum.photos/seed/sustainability-day/400/300"}
                        alt={sustainablePracticeImage?.description ?? "Sustainable practice"}
                        fill
                        className="object-cover rounded-md opacity-20"
                        data-ai-hint={sustainablePracticeImage?.imageHint ?? "sustainable practice"}
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
  const [days, setDays] = useState<DayState[]>(initialDays);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage = "¡Llegamos a ImpacTrack! Aquí aprenderás que cada acción deja huella. Observa tu entorno, registra tus buenas prácticas y demuestra que tu impacto puede ser positivo. ¡Haz que tus pasos cuenten por el planeta!";
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const sostenibilidadBgImage = PlaceHolderImages.find(
    (p) => p.id === "sostenibilidad-background"
  );
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");

  const scheduleYaraDialog = useCallback(() => {
    if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    yaraTimerRef.current = setTimeout(() => {
      setShowYaraDialog(true);
      const hideTimer = setTimeout(() => setShowYaraDialog(false), 60000);
      const reappearTimer = setTimeout(scheduleYaraDialog, 60000 + 120000);
    }, 20000);
  }, []);

  useEffect(() => {
    scheduleYaraDialog();
    return () => {
      if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    };
  }, [scheduleYaraDialog]);


  const updateAndSaveChanges = useCallback((newDays: DayState[]) => {
    setDays(newDays);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY_STATION2, JSON.stringify(newDays));
    }
  }, []);

  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY_STATION2);
    if (savedProgress) {
      try {
        const parsedProgress = JSON.parse(savedProgress) as DayState[];
        if (Array.isArray(parsedProgress) && parsedProgress.length === 7) {
          setDays(parsedProgress);
        }
      } catch {
        // ignore parsing errors, use initial state
      }
    } else {
      localStorage.setItem(STORAGE_KEY_STATION2, JSON.stringify(initialDays));
    }
  }, []);

  const checkUnlocks = useCallback(() => {
    let changed = false;
    const now = Date.now();

    setDays((currentDays) => {
      const newDays = [...currentDays];
      let hasChanged = false;
      newDays.forEach((day, index) => {
        if (day.status === "locked" && day.unlockTime && now >= day.unlockTime) {
          newDays[index] = { ...newDays[index], status: "unlocked" };
          hasChanged = true;
        }
      });

      if (hasChanged) {
        if (typeof window !== "undefined") {
          localStorage.setItem(STORAGE_KEY_STATION2, JSON.stringify(newDays));
        }
      }
      return hasChanged ? newDays : currentDays;
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(checkUnlocks, 1000 * 60); // Check for unlocks every minute
    checkUnlocks();
    return () => clearInterval(interval);
  }, [checkUnlocks]);

  const handleDayComplete = (dayIndex: number, photoUrl: string) => {
    const newDays = [...days];
    newDays[dayIndex].status = "completed";
    newDays[dayIndex].photoUrl = photoUrl;

    const nextDayIndex = dayIndex + 1;
    if (nextDayIndex < days.length) {
      if (newDays[nextDayIndex].status === "locked") {
        newDays[nextDayIndex].unlockTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
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
  
  const handleSimulateComplete = () => {
    unlockStation(stationId + 1);
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: "Has simulado la finalización. ¡Escoge tu premio!",
    });
    setIsPrizeModalOpen(true);
  };

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
      <div className="w-full flex-grow flex flex-col items-center p-4 relative overflow-hidden">
        {sostenibilidadBgImage && (
          <Image
            src={sostenibilidadBgImage.imageUrl}
            alt={sostenibilidadBgImage.description}
            fill
            style={{ objectFit: "cover" }}
            className="z-0 opacity-90"
            data-ai-hint={sostenibilidadBgImage.imageHint}
          />
        )}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center text-center">
            <div className="bg-white/90 backdrop-blur-sm text-primary font-kalam py-3 px-10 rounded-lg shadow-lg -rotate-3 mb-8">
                <h1 className="text-4xl md:text-5xl">ImpacTrack</h1>
            </div>
            
            <div className="max-w-xl mx-auto bg-black/50 text-white p-4 rounded-xl mb-8">
                <p className="font-bold text-lg">YARA: "¡Llegamos a ImpacTrack! Aquí aprenderás que cada acción deja huella. Observa tu entorno, registra tus buenas prácticas y demuestra que tu impacto puede ser positivo. ¡Haz que tus pasos cuenten por el planeta!"</p>
            </div>

          <div className="flex flex-col items-center gap-4 md:gap-6 bg-background/70 backdrop-blur-sm p-6 rounded-xl">
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {days.slice(0, 4).map((_, index) => renderDayButton(index))}
            </div>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              {days.slice(4, 7).map((_, index) => renderDayButton(index + 4))}
            </div>
             <p className="text-sm text-muted-foreground mt-4">MECÁNICA: Cada vez que subas tu foto, pasadas 24 horas se activará el siguiente candado para continuar.</p>
             <Button onClick={handleSimulateComplete} className="mt-4">Simular Finalización</Button>
          </div>
          
        </div>
          {/* Yara Character and Dialog */}
          <div className="absolute bottom-4 right-4 z-20 flex items-end gap-4">
            <AnimatePresence>
                {showYaraDialog && (
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.5 }}
                      className="w-64 mb-4"
                  >
                      <Card className="p-3 shadow-lg bg-white/95 relative">
                          <TypewriterText text={yaraMessage} className="text-sm text-primary font-medium"/>
                          <div className="absolute bottom-[-10px] right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                      </Card>
                  </motion.div>
                )}
            </AnimatePresence>
            
            {yaraCharImage && (
                <motion.div
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.8 } }}
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
            )}
          </div>
      </div>
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={stationId}
        onClaim={handleClaimPrize}
      />
    </>
  );
}

    