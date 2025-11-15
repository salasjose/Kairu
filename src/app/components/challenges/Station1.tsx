
"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
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
import { useUser, useFirestore } from "@/firebase/hooks";
import ResponsiveBackground from "../ResponsiveBackground";
import { doc, getDoc, setDoc, arrayUnion } from "firebase/firestore";
import { handlePhotoUpload } from "@/app/actions";

// Types
type ChallengeType = 'flora' | 'fauna' | 'habitat';
type ChallengeKey = 'Fauna y Flora' | 'Cuidado Animal';

interface PhotoToAdd {
  type: ChallengeType;
  index: number;
}

interface ChallengeConfig {
  title: string;
  description: string;
  slots: number;
  dbField: string;
}

// Utility functions
const fileToDataUrl = (file: Blob | File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const validateImage = (dataUrl: string): boolean => {
  try {
    if (!dataUrl.startsWith('data:image/')) {
      return false;
    }
    
    // Validar tamaño máximo (10MB)
    const base64 = dataUrl.split(',')[1];
    if (!base64) return false;
    
    const sizeInBytes = 4 * Math.ceil(base64.length / 3) * 0.5624896334383812;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    
    return sizeInMB <= 10;
  } catch {
    return false;
  }
};

// Custom Hooks
const usePhotoManagement = (stationId: number, type: ChallengeType, slotCount: number) => {
  const { user } = useUser();
  const db = useFirestore();
  const [photos, setPhotos] = useState<(string | null)[]>(Array(slotCount).fill(null));
  const [isLoading, setIsLoading] = useState(true);

  const dbField = `station${stationId}${type.charAt(0).toUpperCase() + type.slice(1)}Photos`;

  const fetchPhotos = useCallback(async () => {
    if (!user || !db) {
      setIsLoading(false);
      return;
    }
    
    const userDocRef = doc(db, "users", user.uid);
    try {
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const savedPhotos = data[dbField] || [];
        const newPhotos = Array(slotCount).fill(null);
        savedPhotos.forEach((photo: string, index: number) => {
            if (index < slotCount) newPhotos[index] = photo;
        });
        setPhotos(newPhotos);
      }
    } catch (error) {
      console.error(`Error fetching ${type} photos from Firestore:`, error);
      toast({
        title: "Error al cargar",
        description: "No se pudieron cargar las fotos guardadas.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [user, db, dbField, slotCount, type]);


  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const updatePhotos = useCallback(async (type: ChallengeType, index: number, url: string) => {
    if (!user || !db) return;
    
    const newPhotos = [...photos];
    newPhotos[index] = url;

    // To be safe, filter out nulls before saving
    const photosToSave = newPhotos.filter(p => p !== null);

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { [dbField]: photosToSave }, { merge: true });
      // After successful save, update local state to match exactly what's in DB
      await fetchPhotos();
    } catch (error) {
      console.error(`Failed to save ${type} photos:`, error);
      throw error;
    }
  }, [user, db, dbField, type, photos, fetchPhotos]);


  const updateAllPhotosInDb = useCallback(async (newPhotos: (string | null)[]) => {
    if (!user || !db) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { [dbField]: newPhotos.filter(p => p !== null) }, { merge: true });
      await fetchPhotos();
    } catch (error) {
      console.error(`Failed to save ${type} photos:`, error);
      throw error;
    }
  }, [user, db, dbField, type, fetchPhotos]);

  return { photos, updatePhotos, updateAllPhotosInDb, isLoading, setPhotos };
};

const useCamera = () => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const openCamera = useCallback(() => setIsCameraOpen(true), []);
  const closeCamera = useCallback(() => setIsCameraOpen(false), []);

  return {
    isCameraOpen,
    hasCameraPermission,
    setHasCameraPermission,
    openCamera,
    closeCamera
  };
};

// Components
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
    let stream: MediaStream | null = null;

    const getCameraPermission = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
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
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
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
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = useCallback(() => {
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
  }, [onCapture]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative w-full max-w-lg aspect-[4/3] bg-black rounded-lg overflow-hidden">
        <video 
          ref={videoRef} 
          className="w-full h-full object-cover" 
          autoPlay 
          playsInline 
          muted 
        />
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
  isLoading = false,
}: {
  imageUrl: string | null;
  onAddPhoto: () => void;
  isLoading?: boolean;
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
          <Button
            variant="ghost"
            onClick={onAddPhoto}
            disabled={isLoading}
            className="flex flex-col h-auto items-center gap-1"
          >
            <Camera className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs">
              {isLoading ? "Cargando..." : "Añadir foto"}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
};

const MemoizedPhotoSlot = React.memo(PhotoSlot);

// Photo Challenge Component
const PhotoChallenge = ({
  onBack,
  onStationComplete,
}: {
  onBack: () => void;
  onStationComplete: () => void;
}) => {
  const { user } = useUser();
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const [photoToAdd, setPhotoToAdd] = useState<PhotoToAdd | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { photos: floraPhotos, updatePhotos: updateFloraPhotos, isLoading: floraLoading } = 
    usePhotoManagement(1, 'flora', 4);
  const { photos: faunaPhotos, updatePhotos: updateFaunaPhotos, isLoading: faunaLoading } = 
    usePhotoManagement(1, 'fauna', 4);

  const { isCameraOpen, openCamera, closeCamera } = useCamera();

  const handleCapture = useCallback(async (dataUrl: string) => {
    if (!user) {
      toast({ variant: "destructive", title: "Sesión requerida", description: "Debes iniciar sesión para guardar tus fotos." });
      return;
    }
    if (!photoToAdd) return;

    closeCamera();
    setIsUploading(true);

    try {
      if (!validateImage(dataUrl)) throw new Error('La imagen no es válida o es demasiado grande (máximo 10MB)');
      
      const { type, index } = photoToAdd;
      const downloadUrl = await handlePhotoUpload(dataUrl, `users/${user.uid}/station1/${type}/${index}_${Date.now()}.jpg`);
      
      if (type === 'flora') {
        await updateFloraPhotos(type, index, downloadUrl);
      } else {
        await updateFaunaPhotos(type, index, downloadUrl);
      }

      toast({ title: "¡Foto subida!", description: "Tu foto se ha guardado correctamente." });
    } catch (error) {
      console.error("Error en el proceso de subida:", error);
      toast({ title: "Error al subir", description: error instanceof Error ? error.message : "No se pudo subir la imagen. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setPhotoToAdd(null);
      setIsUploading(false);
    }
  }, [user, photoToAdd, closeCamera, updateFloraPhotos, updateFaunaPhotos]);


  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        await handleCapture(dataUrl);
      } catch (error) {
        console.error("Error processing file:", error);
        toast({ title: "Error al procesar archivo", description: "No se pudo procesar la imagen seleccionada.", variant: "destructive" });
      } finally {
        if (event.target) event.target.value = "";
      }
    }
  }, [handleCapture]);

  const handleUploadClick = useCallback(() => {
    setIsAddPhotoDialogOpen(false);
    fileInputRef.current?.click();
  }, []);

  const handleTakeNewPhotoClick = useCallback(() => {
    setIsAddPhotoDialogOpen(false);
    openCamera();
  }, [openCamera]);

  const handleAddPhotoClick = useCallback((type: "flora" | "fauna", index: number) => {
    setPhotoToAdd({ type, index });
    setIsAddPhotoDialogOpen(true);
  }, []);

  const areAllPhotosUploaded = useMemo(() =>
    floraPhotos.every((p) => p !== null) && faunaPhotos.every((p) => p !== null),
    [floraPhotos, faunaPhotos]
  );

  const onChallengeCompleteClick = useCallback(() => {
    if (areAllPhotosUploaded) {
      onStationComplete();
    } else {
      toast({
        title: "Reto Incompleto",
        description: "Debes subir las 8 fotos (4 de flora y 4 de fauna) para completar el reto.",
        variant: "destructive",
      });
    }
  }, [areAllPhotosUploaded, onStationComplete]);

  const floraSlots = useMemo(() => 
    floraPhotos.map((photo, index) => (
      <MemoizedPhotoSlot
        key={`flora-${index}`}
        imageUrl={photo}
        onAddPhoto={() => handleAddPhotoClick("flora", index)}
        isLoading={floraLoading || isUploading}
      />
    )), [floraPhotos, handleAddPhotoClick, floraLoading, isUploading]
  );

  const faunaSlots = useMemo(() => 
    faunaPhotos.map((photo, index) => (
      <MemoizedPhotoSlot
        key={`fauna-${index}`}
        imageUrl={photo}
        onAddPhoto={() => handleAddPhotoClick("fauna", index)}
        isLoading={faunaLoading || isUploading}
      />
    )), [faunaPhotos, handleAddPhotoClick, faunaLoading, isUploading]
  );

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
        <CameraView onCapture={handleCapture} onCancel={closeCamera} />
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
        description="Identifica las especies nativas de fauna y flora de tu región y carga tus fotos en cada espacio."
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
                {floraSlots}
              </div>
            </section>

            <section>
              <h3 className="text-2xl font-bold font-headline text-primary mb-4">Fauna Local</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {faunaSlots}
              </div>
            </section>
          </div>
          <div className="mt-8 text-center">
            <Button 
              size="lg" 
              onClick={onChallengeCompleteClick} 
              disabled={!areAllPhotosUploaded || floraLoading || faunaLoading || isUploading}
            >
              {isUploading ? "Subiendo..." : "Completar Reto"}
            </Button>
          </div>
        </div>
      </ChallengeContainer>
    </>
  );
};

// Habitat Challenge Component
const HabitatChallenge = ({
  onBack,
  onStationComplete,
}: {
  onBack: () => void;
  onStationComplete: () => void;
}) => {
  const { user } = useUser();
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const [photoToAddIndex, setPhotoToAddIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { photos: habitatPhotos, setPhotos: setHabitatPhotos, updateAllPhotosInDb } = 
    usePhotoManagement(1, 'habitat', 4);

  const { isCameraOpen, openCamera, closeCamera } = useCamera();

  const handleCapture = useCallback(async (dataUrl: string) => {
    if (!user) {
      toast({ variant: "destructive", title: "Sesión requerida", description: "Debes iniciar sesión para guardar tus fotos." });
      return;
    }
    if (photoToAddIndex === null) return;

    closeCamera();
    setIsUploading(true);

    try {
      if (!validateImage(dataUrl)) throw new Error('La imagen no es válida o es demasiado grande (máximo 10MB)');
      
      const downloadUrl = await handlePhotoUpload(dataUrl, `users/${user.uid}/station1/habitat/${photoToAddIndex}_${Date.now()}.jpg`);
      
      const newPhotos = [...habitatPhotos];
      newPhotos[photoToAddIndex] = downloadUrl;
      setHabitatPhotos(newPhotos);
      await updateAllPhotosInDb(newPhotos);

      toast({ title: "¡Foto subida!", description: "Tu foto se ha guardado correctamente." });
    } catch (error) {
      console.error("Error en el proceso de subida:", error);
      toast({ title: "Error al subir", description: error instanceof Error ? error.message : "No se pudo subir la imagen. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setPhotoToAddIndex(null);
      setIsUploading(false);
    }
  }, [user, photoToAddIndex, closeCamera, habitatPhotos, setHabitatPhotos, updateAllPhotosInDb]);

  const handleAddPhotoClick = useCallback((index: number) => {
    setPhotoToAddIndex(index);
    setIsAddPhotoDialogOpen(true);
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await fileToDataUrl(file);
        await handleCapture(dataUrl);
      } catch (error) {
        console.error("Error processing file:", error);
        toast({ title: "Error al procesar archivo", description: "No se pudo procesar la imagen seleccionada.", variant: "destructive" });
      } finally {
        if(event.target) event.target.value = "";
      }
    }
  }, [handleCapture]);

  const handleUploadClick = useCallback(() => {
    setIsAddPhotoDialogOpen(false);
    fileInputRef.current?.click();
  }, []);

  const handleTakeNewPhotoClick = useCallback(() => {
    setIsAddPhotoDialogOpen(false);
    openCamera();
  }, [openCamera]);

  const areAllPhotosUploaded = useMemo(() => 
    habitatPhotos.every((p) => p !== null),
    [habitatPhotos]
  );

  const onChallengeCompleteClick = useCallback(() => {
    if (areAllPhotosUploaded) {
      onStationComplete();
    } else {
      toast({
        title: "Reto Incompleto",
        description: "Debes subir las 4 fotos para completar el reto.",
        variant: "destructive",
      });
    }
  }, [areAllPhotosUploaded, onStationComplete]);

  const habitatSlots = useMemo(() => 
    habitatPhotos.map((photo, index) => (
      <MemoizedPhotoSlot
        key={`habitat-${index}`}
        imageUrl={photo}
        onAddPhoto={() => handleAddPhotoClick(index)}
        isLoading={isUploading}
      />
    )), [habitatPhotos, handleAddPhotoClick, isUploading]
  );

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
        <CameraView onCapture={handleCapture} onCancel={closeCamera} />
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
        description="¡Tienes una gran misión! Crea e instala un bebedero o comedero para animales y compártenos cómo te quedó."
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
              {habitatSlots}
            </div>
          </section>
          <div className="mt-8 text-center">
            <Button 
              size="lg" 
              onClick={onChallengeCompleteClick} 
              disabled={!areAllPhotosUploaded || isUploading}
            >
              {isUploading ? "Subiendo..." : "Completar Reto"}
            </Button>
          </div>
        </div>
      </ChallengeContainer>
    </>
  );
};

// Main Station Component
const challenges = {
  "Fauna y Flora": {
    title: "Fauna y Flora",
    description: "Identifica las especies nativas de fauna y flora de tu región y carga tus fotos en cada espacio.",
  },
  "Cuidado Animal": {
    title: "Cuidado Animal",
    description: "¡Tienes una gran misión! Crea e instala un bebedero o comedero para animales y compártenos cómo te quedó.",
  },
} as const;

export default function Station1() {
  const stationId = 1;
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeKey | null>(null);
  const { completedChallenges, completeChallenge } = useChallengeProgress();
  const { unlockStation } = useStationProgress();
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

  const handleChallengeSelection = useCallback((challenge: ChallengeKey) => {
    setSelectedChallenge(challenge);
  }, []);

  const handleChallengeComplete = useCallback((challengeName: ChallengeKey) => {
    const imageInfo = PlaceHolderImages.find((p) =>
      challengeName === "Fauna y Flora" ? p.id === "fauna-capybara" : p.id === "habitat-build-1"
    );
    completeChallenge(stationId, challengeName, imageInfo?.imageUrl);

    const stationChallenges = Object.keys(challenges) as ChallengeKey[];
    const currentCompletedForStation = Object.keys(completedChallenges[stationId] || {});
    const allChallengesDone = stationChallenges.every(
      (ch) => currentCompletedForStation.includes(ch) || ch === challengeName
    );

    setSelectedChallenge(null);

    if (allChallengesDone) {
      setIsPrizeModalOpen(true);
    } else {
      toast({
        title: `¡Reto '${challengeName}' Completado!`,
        description: "¡Bien hecho! Completa el otro reto para ganar tu insignia.",
      });
    }
  }, [completeChallenge, completedChallenges, stationId]);

  const handleClaimPrize = useCallback(() => {
    setIsPrizeModalOpen(false);
    unlockStation(stationId + 1);
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: "¡Has completado todos los retos! Regresando al mapa...",
    });
    router.push("/");
  }, [stationId, unlockStation, router]);

  const yaraCharacterImage = useMemo(() => 
    PlaceHolderImages.find((p) => p.id === "char-yara"),
    []
  );

  if (selectedChallenge === "Fauna y Flora") {
    return (
      <PhotoChallenge
        onBack={() => setSelectedChallenge(null)}
        onStationComplete={() => handleChallengeComplete("Fauna y Flora")}
      />
    );
  }

  if (selectedChallenge === "Cuidado Animal") {
    return (
      <HabitatChallenge
        onBack={() => setSelectedChallenge(null)}
        onStationComplete={() => handleChallengeComplete("Cuidado Animal")}
      />
    );
  }

  const stationCompletedChallenges = completedChallenges[stationId] || {};

  const challengeCards = useMemo(() => 
    (Object.keys(challenges) as ChallengeKey[]).map((reto, index) => {
      const challengeProgress = stationCompletedChallenges[reto];
      const isCompleted = !!challengeProgress;
      const imageUrl = challengeProgress?.imageUrl;

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
    }), [stationCompletedChallenges, handleChallengeSelection]
  );

  return (
    <>
      <ResponsiveBackground>
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-white/90 backdrop-blur-sm text-primary font-kalam py-3 px-10 rounded-lg shadow-lg -rotate-3 mb-8">
            <h1 className="text-4xl md:text-5xl">Bionexus</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            {challengeCards}
          </div>
        </div>
      </ResponsiveBackground>

      {/* Yara Character and Dialog */}
      <div className="absolute bottom-4 right-4 md:right-8 lg:right-12 z-20 flex items-end gap-0 md:gap-2 pointer-events-none">
        <AnimatePresence>
          {showYaraDialog && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5 }}
              className="w-64 md:w-80 mb-4"
            >
              <Card className="p-3 shadow-lg bg-white/95 relative">
                <TypewriterText
                  text={yaraMessage}
                  className="text-sm text-primary font-medium"
                />
                <div className="absolute bottom-[-10px] right-4 md:right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent" />
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {yaraCharacterImage && (
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.8 } }}
            className="w-24 h-auto md:w-32 self-end"
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
        )}
      </div>

      <PrizeDialog open={isPrizeModalOpen} stationId={stationId} onClaim={handleClaimPrize} />
    </>
  );
}
