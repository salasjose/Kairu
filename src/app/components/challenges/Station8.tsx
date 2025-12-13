
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import dynamic from 'next/dynamic';
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Camera, Lightbulb, Link as LinkIcon, CheckCircle, X, SwitchCamera, Video } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";
import { useUser, useFirestore, useStorage } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { usePrizeCart } from "@/hooks/use-prize-cart";
import ResponsiveBackground from "../ResponsiveBackground";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AddPhotoDialog from "./AddPhotoDialog";

const challenges = {
  learn: {
    title: "Aprende",
    description: "Energías que mueven el mundo: Descubre cómo la naturaleza nos enseña a producir energía sin agotarla. Pega el enlace de un video y guárdalo.",
    icon: Lightbulb,
    imageId: "sustainable-design-video"
  },
};

type ChallengeId = keyof typeof challenges;

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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


const ChallengeScreen = ({ challengeId, onBack, onComplete, isCompleted }: { challengeId: ChallengeId, onBack: () => void, onComplete: () => void, isCompleted: boolean }) => {
    const challenge = challenges[challengeId];
    const imageInfo = PlaceHolderImages.find(p => p.id === challenge.imageId);
    const { user } = useUser();
    const db = useFirestore();
    const storage = useStorage();

    const [url, setUrl] = useState("");
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const videoUrl = useMemo(() => {
        if (url.includes("youtube.com/watch?v=")) {
            const videoId = url.split("v=")[1].split("&")[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        if (url.includes("youtu.be/")) {
            const videoId = url.split("youtu.be/")[1].split("?")[0];
            return `https://www.youtube.com/embed/${videoId}`;
        }
        return null;
    }, [url]);

    useEffect(() => {
        const fetchUrl = async () => {
            if (!user || !db) {
                setIsLoading(false);
                return;
            }
            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists() && docSnap.data().station8Url) {
                    const savedUrl = docSnap.data().station8Url;
                    setUrl(savedUrl);
                    if (!savedUrl.includes('youtube') && !savedUrl.includes('youtu.be')) {
                        setImageUrl(savedUrl);
                    }
                }
            } catch (error) {
                console.error("Error fetching URL from Firestore:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUrl();
    }, [user, db]);

    const handleSaveAndComplete = async () => {
        if (isCompleted) return;

        if (!url.trim()) {
            toast({ title: "URL o foto requerida", description: "Por favor, añade una foto o ingresa una URL válida.", variant: "destructive" });
            return;
        }
        if (user && db) {
            try {
                const docRef = doc(db, 'users', user.uid);
                await setDoc(docRef, { station8Url: url }, { merge: true });
                toast({ title: "¡Guardado!", description: "Tu progreso ha sido guardado." });
                onComplete();
            } catch (error) {
                console.error("Error saving URL to Firestore:", error);
                toast({ title: "Error al Guardar", description: "No se pudo guardar tu progreso.", variant: "destructive" });
            }
        } else {
            toast({ title: "Usuario no encontrado", description: "Debes iniciar sesión para guardar tu progreso.", variant: "destructive" });
        }
    };
    
    const handlePhotoUpload = async (dataUrl: string) => {
        if (!user || !storage) {
            toast({ title: "Error de autenticación", description: "Debes iniciar sesión para subir una foto.", variant: "destructive" });
            return;
        }
        
        try {
            const storagePath = `users/${user.uid}/station8/${Date.now()}.jpg`;
            const storageRef = ref(storage, storagePath);
            await uploadString(storageRef, dataUrl, "data_url");
            const downloadUrl = await getDownloadURL(storageRef);

            setImageUrl(downloadUrl);
            setUrl(downloadUrl); // Also set the main URL to the image URL
            
            toast({ title: "¡Foto subida!", description: "Tu foto se ha guardado correctamente." });

        } catch(error) {
            console.error("Error al subir foto:", error);
            toast({ title: "Error al subir", description: "No se pudo subir la foto.", variant: "destructive" });
        }
    };

    const handleCapture = async (dataUrl: string) => {
        setIsCameraOpen(false);
        await handlePhotoUpload(dataUrl);
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const dataUrl = await fileToDataUrl(file);
            await handlePhotoUpload(dataUrl);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleUploadClick = () => {
        setIsAddPhotoDialogOpen(false);
        fileInputRef.current?.click();
    };

    const handleTakePhotoClick = () => {
        setIsAddPhotoDialogOpen(false);
        setIsCameraOpen(true);
    };

    const mediaContent = () => {
        if (isLoading) return <p className="text-white">Cargando...</p>;
        if (videoUrl) return <iframe src={videoUrl} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="rounded-lg w-full h-full"></iframe>;
        if (imageUrl) return <Image src={imageUrl} alt="Imagen subida" fill className="rounded-lg object-cover" />;
        if (imageInfo) return <Image src={imageInfo.imageUrl} alt={imageInfo.description} width={400} height={300} className="rounded-lg object-cover w-full h-full opacity-50" data-ai-hint={imageInfo.imageHint} />;
        return null;
    };


    return (
        <>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            {isCameraOpen && <CameraView onCapture={handleCapture} onCancel={() => setIsCameraOpen(false)} />}
            <AddPhotoDialog open={isAddPhotoDialogOpen} onClose={() => setIsAddPhotoDialogOpen(false)} onTakePhoto={handleTakePhotoClick} onUpload={handleUploadClick} />
            <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center flex-grow">
                <div className="w-full">
                    <Button variant="ghost" onClick={onBack} className="mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                    <Card className="w-full shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-center">{challenge.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <div className="mx-auto mb-6 w-full max-w-sm h-auto aspect-video bg-black rounded-lg border-4 border-white shadow-md flex items-center justify-center relative">
                                {mediaContent()}
                            </div>
                            <p className="text-muted-foreground">{challenge.description}</p>
                            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                                <Input
                                    type="url"
                                    placeholder="O pega un enlace de video aquí"
                                    value={url}
                                    onChange={(e) => {
                                        setUrl(e.target.value);
                                        setImageUrl(null);
                                    }}
                                    disabled={isLoading || isCompleted}
                                />
                                <Button variant="outline" onClick={() => setIsAddPhotoDialogOpen(true)} disabled={isLoading || isCompleted}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Añadir Foto
                                </Button>
                            </div>
                            {isCompleted ? (
                                <Button size="lg" disabled>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Reto Completado
                                </Button>
                            ) : (
                                <Button onClick={handleSaveAndComplete} size="lg">Guardar y Completar</Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
};


export default function Station8() {
  const stationId = 8;
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const { prizes } = usePrizeCart();
  const router = useRouter();
  
  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage = "¡Has llegado a Vitalia! La energía del sol, del viento y del agua nos impulsa hacia un futuro más limpio. Recarga tu energía, comparte tu luz y sigue construyendo un planeta lleno de vida. ¡Tu fuerza también renueva el mundo!";
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === 'char-yara');

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


  const handleComplete = (challengeId: ChallengeId) => {
    if (!hasClaimedPrize) {
        unlockStation(stationId + 1);
        toast({
            title: `¡Estación ${stationId} Completada!`,
            description: `¡Reto '${challenges[challengeId].title}' superado!`,
        });
        setIsPrizeModalOpen(true);
    }
    setSelectedChallenge(null);
  };
  
  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };
  
  const hasClaimedPrize = prizes.some(p => p.stationId === stationId);
  const isChallengeCompleted = hasClaimedPrize;

  const renderContent = () => {
    if (selectedChallenge) {
      return <ChallengeScreen 
                  challengeId={selectedChallenge} 
                  onBack={() => setSelectedChallenge(null)} 
                  onComplete={() => handleComplete(selectedChallenge)}
                  isCompleted={isChallengeCompleted}
              />
    }

    return (
      <ResponsiveBackground
        desktopSrc="/backgrounds/Vitalia1366_X_768.png"
        tabletSrc="/backgrounds/Vitalia1024_X_768.png"
        mobileSrc="/backgrounds/Vitalia1075_X_1944.png"
      >
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
            <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">Vitalia</h1>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            {(Object.keys(challenges) as ChallengeId[]).map((key) => {
                const challenge = challenges[key];
                const Icon = challenge.icon;
                return (
                <button
                    key={key}
                    onClick={() => setSelectedChallenge(key)}
                    className="transition-transform duration-300 hover:scale-105 group"
                >
                    <Card className="w-60 md:w-64 h-auto bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors relative">
                        {isChallengeCompleted && (
                        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5 shadow-lg z-10">
                            <CheckCircle className="text-white h-5 w-5" />
                        </div>
                    )}
                    <CardContent className="flex flex-col items-center justify-center text-center p-4 h-full">
                        <Icon className="w-12 h-12 md:w-16 md:h-16 text-primary mb-3" />
                        <h2 className="font-bold font-headline text-xl md:text-2xl text-primary">
                        {challenge.title}
                        </h2>
                    </CardContent>
                    </Card>
                </button>
                );
            })}
            </div>
            {isChallengeCompleted && (
            <p className="text-sm text-muted-foreground bg-background/80 p-2 rounded-md">
                Ya has completado esta estación.
            </p>
            )}
        </div>
      </ResponsiveBackground>
    );
  }

  return (
    <>
      {renderContent()}
         {/* Yara Character and Dialog */}
      {!selectedChallenge && (
        <div className="absolute bottom-4 right-4 sm:right-8 z-20 w-full max-w-xs sm:max-w-sm md:max-w-md pointer-events-none">
            <AnimatePresence>
                {showYaraDialog && yaraCharImage && !selectedChallenge && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex items-end gap-2"
                  >
                    <div className="flex-grow mb-4">
                      <Card className="p-3 shadow-lg bg-white/95 relative">
                          <TypewriterText text={yaraMessage} className="text-sm text-primary font-medium" delay={1} />
                          <div className="absolute bottom-[-10px] left-8 w-0 h-0 border-r-[10px] border-r-transparent border-t-[10px] border-t-white/95 border-l-[10px] border-l-transparent"></div>
                      </Card>
                    </div>
                     <motion.div
                        key="yara"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0, transition: { duration: 0.8, delay: 0.2 } }}
                        exit={{ opacity: 0, x: 50, transition: { delay: 0.3, duration: 0.5 } }}
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
      )}
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={stationId}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
