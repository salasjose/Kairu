"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, CheckCircle, Video, X } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";
import { useUser, useFirestore, useStorage } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { usePrizeCart } from "@/hooks/use-prize-cart";
import ResponsiveBackground from "../ResponsiveBackground";

const yaraCharacterImage = PlaceHolderImages.find((p) => p.id === "char-yara-magnifying-glass");

const challenges = {
  "Fauna y Flora": {
    title: "Fauna y Flora",
    description:
      "Identifica las especies nativas de fauna y flora de tu región y carga tus fotos en cada espacio.",
  },
  "Cuidado Animal": {
    title: "Cuidado Animal",
    description:
      "¡Tienes una gran misión! Crea e instala un bebedero o comedero para animales y compártenos cómo te quedó.",
  },
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const CameraView = ({
  onCapture,
  onCancel,
}: {
  onCapture: (dataUrl: string) => void;
  onCancel: () => void;
}) => {
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
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        onCapture(canvas.toDataURL("image/jpeg", 0.9));
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
          <X className="h-6 w-6 mr-2" />
          Cancelar
        </Button>
        <Button
          onClick={handleCapture}
          size="lg"
          disabled={!hasCameraPermission}
          className="rounded-full"
        >
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
          <Image src={imageUrl} alt="Uploaded content" fill className="object-cover rounded-lg" />
          <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
        </>
      ) : (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={onAddPhoto}
            className="flex flex-col h-auto items-center gap-1"
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs">Añadir foto</span>
          </Button>
        </div>
      )}
    </div>
  );
};

const PhotoChallenge = ({
  onBack,
  onStationComplete,
}: {
  onBack: () => void;
  onStationComplete: () => void;
}) => {
  const { user } = useUser();
  const db = useFirestore();
  const storage = useStorage();

  const [floraPhotos, setFloraPhotos] = useState<(string | null)[]>(Array(4).fill(null));
  const [faunaPhotos, setFaunaPhotos] = useState<(string | null)[]>(Array(4).fill(null));

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const [photoToAdd, setPhotoToAdd] = useState<{ type: "flora" | "fauna"; index: number } | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePhotos = useCallback(
    async (type: "flora" | "fauna", index: number, url: string) => {
      if (!user || !db) return;

      const currentPhotos = type === "flora" ? floraPhotos : faunaPhotos;
      const newPhotos = [...currentPhotos];
      newPhotos[index] = url;

      if (type === "flora") {
        setFloraPhotos(newPhotos);
      } else {
        setFaunaPhotos(newPhotos);
      }

      const dbField = type === "flora" ? "station1FloraPhotos" : "station1FaunaPhotos";
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(
          userDocRef,
          {
            [dbField]: newPhotos,
          },
          { merge: true }
        );
      } catch (error) {
        console.error(`Failed to save ${type} photos to Firestore:`, error);
        toast({
          title: "Error al guardar",
          description: "No se pudo guardar la galería en la nube.",
          variant: "destructive",
        });
      }
    },
    [user, db, floraPhotos, faunaPhotos]
  );

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!user || !db) return;
      const userDocRef = doc(db, "users", user.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFloraPhotos(data.station1FloraPhotos || Array(4).fill(null));
          setFaunaPhotos(data.station1FaunaPhotos || Array(4).fill(null));
        }
      } catch (error) {
        console.error("Error fetching photos from Firestore:", error);
      }
    };
    fetchPhotos();
  }, [user, db]);

  const handleCapture = async (dataUrl: string) => {
    setIsAddPhotoDialogOpen(false);
    setIsCameraOpen(false);

    if (!user || !storage) {
      toast({
        variant: "destructive",
        title: "Servicio no disponible",
        description: "Debes iniciar sesión y el servicio de almacenamiento debe estar activo.",
      });
      return;
    }

    if (!photoToAdd) return;


    try {
      const { type, index } = photoToAdd;
      const storagePath = `users/${user.uid}/station1/${type}/${index}_${Date.now()}.jpg`;
      const storageRef = ref(storage, storagePath);

      await uploadString(storageRef, dataUrl, "data_url");
      const downloadUrl = await getDownloadURL(storageRef);
      await updatePhotos(type, index, downloadUrl);

      toast({
        title: "¡Foto subida!",
        description: "Tu foto se ha guardado correctamente.",
      });
    } catch (error) {
      console.error("Error en el proceso de subida:", error);
      toast({
        title: "Error al subir",
        description: `No se pudo subir la imagen: ${
          error instanceof Error ? error.message : "Error desconocido"
        }.`,
        variant: "destructive",
      });
    } finally {
      setPhotoToAdd(null);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsAddPhotoDialogOpen(false);
    const file = event.target.files?.[0];
    if (file) {
      const dataUrl = await fileToDataUrl(file);
      await handleCapture(dataUrl);
      if(fileInputRef.current) fileInputRef.current.value = ""; // Reset input
    }
  };


  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTakeNewPhotoClick = () => {
    setIsCameraOpen(true);
  };

  const handleAddPhotoClick = (type: "flora" | "fauna", index: number) => {
    setPhotoToAdd({ type, index });
    setIsAddPhotoDialogOpen(true);
  };

  const areAllPhotosUploaded =
    floraPhotos.every((p) => p !== null) && faunaPhotos.every((p) => p !== null);

  const onChallengeCompleteClick = () => {
    if (areAllPhotosUploaded) {
      onStationComplete();
    } else {
      toast({
        title: "Reto Incompleto",
        description: "Debes subir las 8 fotos (4 de flora y 4 de fauna) para completar el reto.",
        variant: "destructive",
      });
    }
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
        <CameraView onCapture={handleCapture} onCancel={() => setIsCameraOpen(false)} />
      )}
      <AddPhotoDialog
        open={isAddPhotoDialogOpen}
        onClose={() => setIsAddPhotoDialogOpen(false)}
        onTakePhoto={handleTakeNewPhotoClick}
        onUpload={handleUploadClick}
      />
      <div className="flex-grow flex items-center justify-center p-4">
        <ChallengeContainer
          stationId={1}
          title="Estación Bionexus"
          description={challenges["Fauna y Flora"].description}
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
                    <PhotoSlot
                      key={`flora-${index}`}
                      imageUrl={photo}
                      onAddPhoto={() => handleAddPhotoClick("flora", index)}
                    />
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-2xl font-bold font-headline text-primary mb-4">Fauna Local</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {faunaPhotos.map((photo, index) => (
                    <PhotoSlot
                      key={`fauna-${index}`}
                      imageUrl={photo}
                      onAddPhoto={() => handleAddPhotoClick("fauna", index)}
                    />
                  ))}
                </div>
              </section>
            </div>
            <div className="mt-8 text-center">
              <Button size="lg" onClick={onChallengeCompleteClick} disabled={!areAllPhotosUploaded}>
                Completar Reto
              </Button>
            </div>
          </div>
        </ChallengeContainer>
      </div>
    </>
  );
};

const HabitatChallenge = ({
  onBack,
  onStationComplete,
}: {
  onBack: () => void;
  onStationComplete: () => void;
}) => {
  const { user } = useUser();
  const db = useFirestore();
  const storage = useStorage();

  const [habitatPhotos, setHabitatPhotos] = useState<(string | null)[]>(Array(4).fill(null));
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const [photoToAddIndex, setPhotoToAddIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!user || !db) return;
      const userDocRef = doc(db, "users", user.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().station1HabitatPhotos) {
          setHabitatPhotos(docSnap.data().station1HabitatPhotos);
        }
      } catch (error) {
        console.error("Error fetching habitat photos from Firestore:", error);
      }
    };
    fetchPhotos();
  }, [user, db]);

  const updatePhotosInDb = async (newPhotos: (string | null)[]) => {
    if (!user || !db) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          station1HabitatPhotos: newPhotos,
        },
        { merge: true }
      );
    } catch (error) {
      console.error("Failed to save habitat photos to Firestore:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la imagen en la nube.",
        variant: "destructive",
      });
    }
  };

  const handleCapture = async (dataUrl: string) => {
    setIsAddPhotoDialogOpen(false);
    setIsCameraOpen(false);

    if (!user || !storage) {
       toast({
        variant: "destructive",
        title: "Servicio no disponible",
        description: "Debes iniciar sesión y el servicio de almacenamiento debe estar activo.",
      });
      return;
    }

    if (photoToAddIndex === null) return;


    try {
      const storagePath = `users/${user.uid}/station1/habitat/${photoToAddIndex}_${Date.now()}.jpg`;
      const storageRef = ref(storage, storagePath);
      await uploadString(storageRef, dataUrl, "data_url");
      const downloadUrl = await getDownloadURL(storageRef);

      const newPhotos = [...habitatPhotos];
      newPhotos[photoToAddIndex] = downloadUrl;
      setHabitatPhotos(newPhotos);
      await updatePhotosInDb(newPhotos);

      toast({
        title: "¡Foto subida!",
        description: "Tu foto se ha guardado correctamente.",
      });
    } catch (error) {
      console.error("Error en el proceso de subida:", error);
      toast({
        title: "Error al subir",
        description: `No se pudo subir la imagen: ${
          error instanceof Error ? error.message : "Error desconocido"
        }.`,
        variant: "destructive",
      });
    } finally {
      setPhotoToAddIndex(null);
    }
  };

  const handleAddPhotoClick = (index: number) => {
    setPhotoToAddIndex(index);
    setIsAddPhotoDialogOpen(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsAddPhotoDialogOpen(false);
    const file = event.target.files?.[0];
    if (file) {
      const dataUrl = await fileToDataUrl(file);
      await handleCapture(dataUrl);
      if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleTakeNewPhotoClick = () => {
    setIsCameraOpen(true);
  };

  const areAllPhotosUploaded = habitatPhotos.every((p) => p !== null);

  const onChallengeCompleteClick = () => {
    if (areAllPhotosUploaded) {
      onStationComplete();
    } else {
      toast({
        title: "Reto Incompleto",
        description: "Debes subir las 4 fotos para completar el reto.",
        variant: "destructive",
      });
    }
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
        <CameraView onCapture={handleCapture} onCancel={() => setIsCameraOpen(false)} />
      )}
      <AddPhotoDialog
        open={isAddPhotoDialogOpen}
        onClose={() => setIsAddPhotoDialogOpen(false)}
        onTakePhoto={handleTakeNewPhotoClick}
        onUpload={handleUploadClick}
      />
      <div className="flex-grow flex items-center justify-center p-4">
        <ChallengeContainer
          stationId={1}
          title="Estación Bionexus"
          description={challenges["Cuidado Animal"].description}
        >
          <div className="w-full max-w-4xl mx-auto">
            <Button variant="ghost" onClick={onBack} className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a los retos
            </Button>

            <section>
              <h3 className="text-2xl font-bold font-headline text-primary mb-4">
                Tu Bebedero/Comedero
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {habitatPhotos.map((photo, index) => (
                  <PhotoSlot
                    key={`habitat-${index}`}
                    imageUrl={photo}
                    onAddPhoto={() => handleAddPhotoClick(index)}
                  />
                ))}
              </div>
            </section>
            <div className="mt-8 text-center">
              <Button size="lg" onClick={onChallengeCompleteClick} disabled={!areAllPhotosUploaded}>
                Completar Reto
              </Button>
            </div>
          </div>
        </ChallengeContainer>
      </div>
    </>
  );
};

export default function Station1() {
  const stationId = 1;
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const { completedChallenges, completeChallenge } = useChallengeProgress();
  const { unlockStation } = useStationProgress();
  const { prizes } = usePrizeCart();
  const router = useRouter();

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const [yaraMessage] = useState(
    "¡Bienvenido a Bionexus! Aquí comienza nuestra gran aventura. Prepárate para descubrir los secretos que conectan toda la vida del planeta. Cada especie, cada árbol, cada gota todos formamos parte de la misma red. ¡Vamos a explorarla juntos! Para ellos debe seleccionar uno de los retos para completar la estación. ¡Debes completarlos todos para avanzar!"
  );
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const scheduleYaraDialog = useCallback(() => {
    if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    yaraTimerRef.current = setTimeout(() => {
      setShowYaraDialog(true);
      setTimeout(() => setShowYaraDialog(false), 20000);
    }, 1000);
  }, []);

  useEffect(() => {
    scheduleYaraDialog();
    return () => {
      if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    };
  }, [scheduleYaraDialog]);

  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);

  const handleChallengeSelection = (challenge: string) => {
    setSelectedChallenge(challenge);
  };

  const handleChallengeComplete = (challengeName: string) => {
    completeChallenge(stationId, challengeName, null);
    setSelectedChallenge(null);
    toast({
      title: `¡Reto '${challengeName}' Completado!`,
      description: "¡Bien hecho! Vuelve al menú de la estación.",
    });
  };

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    unlockStation(stationId + 1);
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: "¡Has completado todos los retos! Regresando al mapa...",
    });
    router.push("/");
  };

  if (selectedChallenge === "Fauna y Flora") {
    return <PhotoChallenge
          onBack={() => setSelectedChallenge(null)}
          onStationComplete={() => handleChallengeComplete("Fauna y Flora")}
        />;
  }

  if (selectedChallenge === "Cuidado Animal") {
     return <HabitatChallenge
          onBack={() => setSelectedChallenge(null)}
          onStationComplete={() => handleChallengeComplete("Cuidado Animal")}
        />;
  }

  const stationCompletedChallenges = completedChallenges[stationId] || {};
  const areAllChallengesComplete = Object.keys(challenges).every(
    (ch) => stationCompletedChallenges[ch]?.completed
  );
  const hasClaimedPrize = prizes.some(p => p.stationId === stationId);

  return (
    <>
      <ResponsiveBackground
        desktopSrc="/backgrounds/Bionexus1366_X_768.png"
        tabletSrc="/backgrounds/Bionexus1024_X_768.png"
        mobileSrc="/backgrounds/Bionexus1075_X_1944.png"
      >
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-white/90 backdrop-blur-sm text-primary font-kalam py-3 px-10 rounded-lg shadow-lg -rotate-3 mb-8">
            <h1 className="text-4xl md:text-5xl">Bionexus</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            {(Object.keys(challenges) as (keyof typeof challenges)[]).map((reto, index) => {
              const challengeProgress = stationCompletedChallenges[reto];
              const isCompleted = !!challengeProgress;
              const imageUrl = null; // No background image for completed challenges

              return (
                <button
                  key={reto}
                  onClick={() => handleChallengeSelection(reto)}
                  className={cn(
                    "relative w-full transition-transform duration-300 hover:scale-105",
                    index === 0 ? "md:-rotate-6" : "md:rotate-6"
                  )}
                >
                  <div className="absolute inset-0 bg-white shadow-2xl rounded-2xl transform -rotate-1" />
                  <Card
                    className="relative
                            w-[88vw] max-w-[420px] h-64
                            md:w-80 md:h-80
                            lg:w-96 lg:h-96
                            rounded-2xl shadow-2xl
                            flex flex-col items-center justify-center
                            p-6 border-4 border-gray-200 overflow-hidden"
                  >
                    {isCompleted && imageUrl && (
                      <>
                        <Image
                          src={imageUrl}
                          alt={`Completado: ${challenges[reto].title}`}
                          fill
                          className="object-cover z-0"
                        />
                        <div className="absolute inset-0 bg-black/40 z-10" />
                      </>
                    )}
                    <div className="relative z-20 text-center">
                      <CardHeader>
                        <CardTitle
                          className={cn(
                            "font-kalam text-4xl md:text-5xl",
                            isCompleted && imageUrl ? "text-white" : "text-primary"
                          )}
                        >
                          {challenges[reto].title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent
                        className={cn(
                          "text-base md:text-lg",
                          isCompleted && imageUrl && "text-gray-200"
                        )}
                      >
                        <p>{challenges[reto].description}</p>
                      </CardContent>
                    </div>
                    {isCompleted && (
                      <div className="absolute top-3 right-3 z-30 bg-green-500 rounded-full p-2.5 shadow-lg">
                        <CheckCircle className="text-white h-6 w-6" />
                      </div>
                    )}
                  </Card>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <Button
              onClick={() => setIsPrizeModalOpen(true)}
              disabled={!areAllChallengesComplete || hasClaimedPrize}
              size="lg"
            >
              Completar Estación y Reclamar Insignia
            </Button>
            {areAllChallengesComplete && hasClaimedPrize ? (
               <p className="text-sm text-muted-foreground bg-background/80 p-2 rounded-md">
                Ya has reclamado la insignia de esta estación.
              </p>
            ) : !areAllChallengesComplete && (
              <p className="text-sm text-muted-foreground bg-background/80 p-2 rounded-md">
                Completa ambos retos para activar este botón.
              </p>
            )}
          </div>

        </div>
      </ResponsiveBackground>

      {/* Yara Character and Dialog */}
      <div className="absolute bottom-4 right-4 sm:right-8 lg:right-12 z-20 w-full max-w-xs sm:max-w-sm md:max-w-md pointer-events-none">
        <AnimatePresence>
          {showYaraDialog && yaraCharacterImage && (
            <motion.div 
                className="flex items-end gap-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20, transition: {duration: 0.5 } }}
                transition={{ duration: 0.5 }}
            >
              <div className="flex-grow mb-4">
                <Card className="p-3 shadow-lg bg-white/95 relative">
                  <TypewriterText
                    text={yaraMessage}
                    className="text-sm text-primary font-medium"
                  />
                  <div className="absolute bottom-[-10px] right-4 md:right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                </Card>
              </div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.8 } }}
                 exit={{ opacity: 0, x: 50, transition: { duration: 0.5 } }}
                className="w-24 h-auto md:w-32 self-end shrink-0"
              >
                <Image
                  src={yaraCharacterImage.imageUrl}
                  alt={yaraCharacterImage.description}
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

      <PrizeDialog open={isPrizeModalOpen} stationId={stationId} onClaim={handleClaimPrize} />
    </>
  );
}
