
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, CheckCircle, Upload, Video, X } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import ChallengeContainer from "../ChallengeContainer";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AddPhotoDialog from "./AddPhotoDialog";
import { useChallengeProgress } from "@/hooks/use-challenge-progress";
import { useStationProgress } from "@/hooks/use-station-progress";
import PrizeDialog from "../PrizeDialog";
import { useRouter } from "next/navigation";


const faunaImage = PlaceHolderImages.find((p) => p.id === "fauna-capybara");
const habitatImage = PlaceHolderImages.find((p) => p.id === "habitat-build-1");
const biodiversidadBgImage = PlaceHolderImages.find((p) => p.id === "biodiversidad-background");

const challenges = {
  "Reto 1": {
    title: "Reto 1: Fauna y Flora",
    description: "Identifica las especies nativas de fauna y flora de tu región y carga tus fotos en cada espacio.",
  },
  "Reto 2": {
    title: "Reto 2: Cuidado Animal",
    description: "¡Tienes una gran misión! Crea e instala un bebedero o comedero para animales y compártenos cómo te quedó.",
    image: habitatImage?.imageUrl ?? "https://picsum.photos/seed/habitat/400/300",
    imageHint: habitatImage?.imageHint ?? "wildlife habitat",
  },
};

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
    // In a real app, you'd capture a frame from the video.
    // Here we'll just return a placeholder.
    onCapture(habitatImage?.imageUrl ?? `https://picsum.photos/seed/capture${Date.now()}/200`);
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


const PhotoSlot = ({
  imageUrl,
  onAddPhoto,
}: {
  imageUrl: string | null;
  onAddPhoto: () => void;
}) => {
  return (
    <div className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center relative bg-card/50">
      {imageUrl ? (
        <>
          <Image
            src={imageUrl}
            alt="Uploaded content"
            fill
            className="object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
        </>
      ) : (
        <div className="text-center">
          <Button variant="ghost" onClick={onAddPhoto} className="flex flex-col h-auto items-center gap-1">
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs">Añadir foto</span>
          </Button>
        </div>
      )}
    </div>
  );
};


const PhotoChallenge = ({ onBack, onStationComplete }: { onBack: () => void, onStationComplete: (imageUrl: string | null) => void }) => {
  const [floraPhotos, setFloraPhotos] = useState<(string | null)[]>(Array(4).fill(null));
  const [faunaPhotos, setFaunaPhotos] = useState<(string | null)[]>(Array(4).fill(null));
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const [photoToAdd, setPhotoToAdd] = useState<{type: "flora" | "fauna", index: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhotoClick = (type: "flora" | "fauna", index: number) => {
    setPhotoToAdd({ type, index });
    setIsAddPhotoDialogOpen(true);
  };

  const handleCapture = (imageUrl: string) => {
    if (photoToAdd) {
        const { type, index } = photoToAdd;
        if (type === "flora") {
            const newPhotos = [...floraPhotos];
            newPhotos[index] = imageUrl;
            setFloraPhotos(newPhotos);
        } else {
            const newPhotos = [...faunaPhotos];
            newPhotos[index] = imageUrl;
            setFaunaPhotos(newPhotos);
        }
    }
    setIsCameraOpen(false);
    setPhotoToAdd(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && photoToAdd) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleCapture(e.target?.result as string);
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


  const checkCompletion = () => {
    const hasFlora = floraPhotos.some(p => p !== null);
    const hasFauna = faunaPhotos.some(p => p !== null);
    if(hasFlora && hasFauna) {
      const firstFlora = floraPhotos.find(p => p !== null);
      onStationComplete(firstFlora ?? null);
      return true;
    }
    toast({
      title: "Casi listo",
      description: "Debes subir al menos una foto de flora y una de fauna para completar el reto.",
      variant: "destructive"
    })
    return false;
  }

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
            onCapture={handleCapture}
            onCancel={() => setIsCameraOpen(false)}
        />
     )}
     <AddPhotoDialog
        open={isAddPhotoDialogOpen}
        onClose={() => setIsAddPhotoDialogOpen(false)}
        onTakePhoto={handleTakeNewPhotoClick}
        onUpload={handleUploadClick}
      />
     <ChallengeContainer
      stationId={1}
      title="Estación Bionexus"
      description={challenges["Reto 1"].description}
      onChallengeComplete={checkCompletion}
      onStationComplete={() => {}}
    >
        <div className="w-full max-w-4xl mx-auto">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a los retos
            </Button>

            <div className="space-y-8">
                <section>
                    <h3 className="text-2xl font-bold font-headline text-primary mb-4">Flora Local</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {floraPhotos.map((photo, index) => (
                            <PhotoSlot key={`flora-${index}`} imageUrl={photo} onAddPhoto={() => handleAddPhotoClick("flora", index)} />
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-2xl font-bold font-headline text-primary mb-4">Fauna Local</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {faunaPhotos.map((photo, index) => (
                            <PhotoSlot key={`fauna-${index}`} imageUrl={photo} onAddPhoto={() => handleAddPhotoClick("fauna", index)} />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    </ChallengeContainer>
   </>
  );
};

const HabitatChallenge = ({ onBack, onStationComplete }: { onBack: () => void, onStationComplete: (imageUrl: string | null) => void }) => {
  const [habitatPhotos, setHabitatPhotos] = useState<(string | null)[]>(Array(4).fill(null));
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const [photoToAddIndex, setPhotoToAddIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddPhotoClick = (index: number) => {
    setPhotoToAddIndex(index);
    setIsAddPhotoDialogOpen(true);
  };

  const handleCapture = (imageUrl: string) => {
    if (photoToAddIndex !== null) {
      const newPhotos = [...habitatPhotos];
      newPhotos[photoToAddIndex] = imageUrl;
      setHabitatPhotos(newPhotos);
    }
    setIsCameraOpen(false);
    setPhotoToAddIndex(null);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && photoToAddIndex !== null) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleCapture(e.target?.result as string);
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

  const checkCompletion = () => {
    const firstPhoto = habitatPhotos.find(p => p !== null);
    if (firstPhoto) {
      onStationComplete(firstPhoto);
      return true;
    }
    toast({
      title: "Casi listo",
      description: "Debes subir al menos una foto de tu comedero/bebedero para completar el reto.",
      variant: "destructive"
    });
    return false;
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
          onCapture={handleCapture}
          onCancel={() => setIsCameraOpen(false)}
        />
      )}
       <AddPhotoDialog
        open={isAddPhotoDialogOpen}
        onClose={() => setIsAddPhotoDialogOpen(false)}
        onTakePhoto={handleTakeNewPhotoClick}
        onUpload={handleUploadClick}
      />
      <ChallengeContainer
        stationId={1}
        title="Estación Bionexus"
        description={challenges["Reto 2"].description}
        onChallengeComplete={checkCompletion}
        onStationComplete={() => {}}
      >
        <div className="w-full max-w-4xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a los retos
          </Button>

          <section>
            <h3 className="text-2xl font-bold font-headline text-primary mb-4">Tu Bebedero/Comedero</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {habitatPhotos.map((photo, index) => (
                <PhotoSlot key={`habitat-${index}`} imageUrl={photo} onAddPhoto={() => handleAddPhotoClick(index)} />
              ))}
            </div>
          </section>
        </div>
      </ChallengeContainer>
    </>
  );
};


export default function Station1() {
  const stationId = 1;
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const { completedChallenges, completeChallenge } = useChallengeProgress();
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const stationChallenges = Object.keys(challenges);
  
  const handleChallengeSelection = (challenge: string) => {
    setSelectedChallenge(challenge);
  }

  const handleStationComplete = (challengeName: string, imageUrl: string | null) => {
    completeChallenge(stationId, challengeName, imageUrl);
    setSelectedChallenge(null); // Go back to challenge selection

    const currentCompleted = Object.keys(completedChallenges[stationId] || {});
    const allChallengesDone = stationChallenges.every(ch => [...currentCompleted, challengeName].includes(ch));
    
    if (allChallengesDone) {
        unlockStation(stationId + 1);
        toast({
            title: `¡Estación ${stationId} Completada!`,
            description: "¡Has completado todos los retos! Escoge tu premio.",
        });
        setIsPrizeModalOpen(true);
    } else {
        toast({
            title: `¡Reto '${challengeName}' Completado!`,
            description: "¡Bien hecho! Vuelve cuando quieras para completar los demás.",
        });
    }
  };
  
  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };
  
  if (selectedChallenge === "Reto 1") {
    return <PhotoChallenge onBack={() => setSelectedChallenge(null)} onStationComplete={(imageUrl) => handleStationComplete("Reto 1", imageUrl)} />;
  }

  if (selectedChallenge === "Reto 2") {
    return <HabitatChallenge onBack={() => setSelectedChallenge(null)} onStationComplete={(imageUrl) => handleStationComplete("Reto 2", imageUrl)} />;
  }

  const stationCompletedChallenges = completedChallenges[stationId] || {};

  return (
    <>
    <div className="w-full min-h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {biodiversidadBgImage && (
          <Image
            src={biodiversidadBgImage.imageUrl}
            alt={biodiversidadBgImage.description}
            fill
            style={{objectFit: 'cover'}}
            className="z-0 opacity-80"
            data-ai-hint={biodiversidadBgImage.imageHint}
          />
      )}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
        <div className="bg-white/90 backdrop-blur-sm text-primary font-kalam py-3 px-10 rounded-lg shadow-lg -rotate-3 mb-8">
          <h1 className="text-4xl md:text-5xl">Bionexus</h1>
        </div>
        
        <div className="max-w-xl mx-auto bg-black/50 text-white p-4 rounded-xl mb-8">
            <p className="font-bold text-lg">YARA: "¡Bienvenido a Bionexus! Aquí comienza nuestra gran aventura. Prepárate para descubrir los secretos que conectan toda la vida del planeta. Cada especie, cada árbol, cada gota… todos formamos parte de la misma red. ¡Vamos a explorarla juntos!"</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12 mb-8">
          {(stationChallenges as (keyof typeof challenges)[]).map((reto, index) => {
            const challengeProgress = stationCompletedChallenges[reto];
            const isCompleted = !!challengeProgress;
            const imageUrl = challengeProgress?.imageUrl;

            return (
            <button
              key={reto}
              onClick={() => handleChallengeSelection(reto)}
              className={cn(
                "relative transition-transform duration-300 hover:scale-105",
                index === 0 ? "md:-rotate-6" : "md:rotate-6"
              )}
            >
              <div className="absolute inset-0 bg-white shadow-2xl rounded-lg transform -rotate-1"></div>
              <Card className="relative w-60 h-64 md:w-64 md:h-72 rounded-lg shadow-2xl flex flex-col items-center justify-center p-4 border-4 border-gray-200 overflow-hidden">
                 {isCompleted && imageUrl && (
                  <>
                    <Image
                      src={imageUrl}
                      alt={`Completado: ${challenges[reto].title}`}
                      fill
                      className="object-cover z-0"
                    />
                    <div className="absolute inset-0 bg-black/40 z-10"></div>
                  </>
                )}
                <div className="relative z-20 text-center">
                    <CardHeader>
                        <CardTitle className={cn(
                            "font-kalam text-3xl md:text-4xl text-primary-600",
                            isCompleted && imageUrl && "text-white"
                        )}>
                            {challenges[reto].title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className={cn(isCompleted && imageUrl && "text-gray-200")}>
                        <p>{challenges[reto].description}</p>
                    </CardContent>
                </div>
                 {isCompleted && (
                    <div className="absolute top-2 right-2 z-30 bg-green-500 rounded-full p-2 shadow-lg">
                        <CheckCircle className="text-white h-5 w-5" />
                    </div>
                )}
              </Card>
            </button>
          )})}
        </div>

        <div className="mt-4 max-w-md mx-auto">
          <p className="bg-background/80 p-4 rounded-md text-center">
            Selecciona uno de los retos para completar la estación. ¡Debes completarlos todos para avanzar!
          </p>
        </div>
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
