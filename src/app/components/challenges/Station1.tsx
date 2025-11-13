"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, CheckCircle, Upload, Video, X, Trash2 } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import ChallengeContainer from "../ChallengeContainer";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AddPhotoDialog from "./AddPhotoDialog";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import PrizeDialog from "../PrizeDialog";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";
import { useUser, useFirestore, useStorage } from "@/firebase/hooks";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadString, getDownloadURL, deleteObject } from "firebase/storage";
import ResponsiveBackground from "../ResponsiveBackground";
import { useChallengeProgress } from "@/hooks/use-challenge-progress";

const resizeImage = (dataUrl: string, maxWidth: number): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        img.onload = () => {
            let { width, height } = img;
            if (width > maxWidth) {
                const ratio = maxWidth / width;
                width = maxWidth;
                height = height * ratio;
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('No se pudo obtener el contexto del lienzo'));
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = () => reject(new Error('Error al cargar la imagen para redimensionar.'));
        img.src = dataUrl;
    });
};

const uploadImageAndGetUrl = async (
  userId: string,
  imageDataUrl: string,
  folder: string,
  index: number
): Promise<string> => {
  const storage = getStorage();
  const imageRef = storageRef(
    storage,
    `users/${userId}/station1/${folder}/${index}_${Date.now()}.jpg`
  );

  await uploadString(imageRef, imageDataUrl, "data_url");
  const downloadUrl = await getDownloadURL(imageRef);
  return downloadUrl;
};


const faunaImage = PlaceHolderImages.find((p) => p.id === "fauna-capybara");
const habitatImage = PlaceHolderImages.find((p) => p.id === "habitat-build-1");
const yaraCharacterImage = PlaceHolderImages.find((p) => p.id === 'char-yara');

const challenges = {
  "Fauna y Flora": {
    title: "Fauna y Flora",
    description: "Identifica las especies nativas de fauna y flora de tu región y carga tus fotos en cada espacio.",
  },
  "Cuidado Animal": {
    title: "Cuidado Animal",
    description: "¡Tienes una gran misión! Crea e instala un bebedero o comedero para animales y compártenos cómo te quedó.",
    image: habitatImage?.imageUrl ?? "https://picsum.photos/seed/habitat/400/300",
    imageHint: habitatImage?.imageHint ?? "wildlife habitat",
  },
};

const CameraView = ({ onCapture, onCancel }: { onCapture: (url: string) => void; onCancel: () => void; }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const getCameraPermission = async () => {
      try {
        const constraints = { 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        };
        
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        setHasCameraPermission(true);
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error al acceder a la cámara:", error);
        setHasCameraPermission(false);
        toast({
          variant: "destructive",
          title: "Acceso denegado",
          description: "Por favor, habilite los permisos de la cámara."
        });
      }
    };

    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    if (isCapturing) return;
    
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast({
        title: "Cámara no lista",
        description: "Espera un momento a que el video se active.",
        variant: "destructive"
      });
      return;
    }

    setIsCapturing(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('No se pudo obtener el contexto del canvas');
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const fullSizeDataUrl = canvas.toDataURL('image/jpeg', 0.9);

      const resizedDataUrl = await resizeImage(fullSizeDataUrl, 1024);
      onCapture(resizedDataUrl);
      
    } catch (error) {
      console.error("Error al capturar la imagen:", error);
      toast({
        title: "Error",
        description: "No se pudo procesar la imagen.",
        variant: "destructive"
      });
    } finally {
      setIsCapturing(false);
    }
  };

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
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <Alert variant="destructive" className="max-w-sm">
              <Video className="h-4 w-4" />
              <AlertTitle>Acceso a la cámara requerido</AlertTitle>
              <AlertDescription>
                Permite el acceso a la cámara para usar esta función.
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-4">
        <Button 
          onClick={onCancel} 
          variant="outline" 
          size="lg" 
          className="rounded-full"
        >
          <X className="h-6 w-6 mr-2" />
          Cancelar
        </Button>
        <Button 
          onClick={handleCapture} 
          size="lg" 
          disabled={!hasCameraPermission || isCapturing}
          className="rounded-full"
        >
          <Camera className="h-6 w-6 mr-2" />
          {isCapturing ? "Capturando..." : "Tomar Foto"}
        </Button>
      </div>
    </div>
  );
};

const PhotoSlot = ({
  imageUrl,
  onAddPhoto,
  onDelete,
}: {
  imageUrl: string | null;
  onAddPhoto: () => void;
  onDelete: () => void;
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
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Button variant="destructive" size="icon" onClick={onDelete}>
                <Trash2 className="h-4 w-4"/>
            </Button>
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


const PhotoChallenge = ({ onBack, onStationComplete }: { onBack: () => void, onStationComplete: () => void }) => {
  const { user } = useUser();
  const db = useFirestore();
  const storage = useStorage();

  const [floraPhotos, setFloraPhotos] = useState<(string | null)[]>(Array(4).fill(null));
  const [faunaPhotos, setFaunaPhotos] = useState<(string | null)[]>(Array(4).fill(null));

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const [photoToAdd, setPhotoToAdd] = useState<{type: "flora" | "fauna", index: number} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPhotos = async () => {
        if (!user || !db) return;
        const userDocRef = doc(db, 'users', user.uid);
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

  const updatePhotos = useCallback(
    async (type: "flora" | "fauna", index: number, imageDataUrl: string) => {
      if (!user || !db) {
        toast({
          title: "Sesión requerida",
          description: "Debes iniciar sesión para guardar tus fotos.",
          variant: "destructive",
        });
        return;
      }
  
      try {
        const folder = type === "flora" ? "flora" : "fauna";
        const downloadUrl = await uploadImageAndGetUrl(
          user.uid,
          imageDataUrl,
          folder,
          index
        );
  
        const isFlora = type === "flora";
        const currentArray = isFlora ? floraPhotos : faunaPhotos;
        const newPhotos = [...currentArray];
        newPhotos[index] = downloadUrl;
  
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(
          userDocRef,
          {
            [isFlora ? "station1FloraPhotos" : "station1FaunaPhotos"]: newPhotos,
          },
          { merge: true }
        );
  
        if (isFlora) {
          setFloraPhotos(newPhotos);
        } else {
          setFaunaPhotos(newPhotos);
        }
      } catch (error) {
        console.error(`Failed to save ${type} photos to Firestore:`, error);
        toast({
          title: "Error al guardar",
          description: "No se pudo guardar la imagen en la nube.",
          variant: "destructive",
        });
      }
    },
    [user, db, floraPhotos, faunaPhotos]
  );


  const handleCapture = async (imageDataUrl: string) => {
    if (photoToAdd) {
      const { type, index } = photoToAdd;
      await updatePhotos(type, index, imageDataUrl);
    }
    setIsCameraOpen(false);
    setPhotoToAdd(null);
  };


  const handleAddPhotoClick = (type: "flora" | "fauna", index: number) => {
    setPhotoToAdd({ type, index });
    setIsAddPhotoDialogOpen(true);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleCapture(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleUploadClick = () => {
    setIsAddPhotoDialogOpen(false);
    fileInputRef.current?.click();
  };

  const handleTakeNewPhotoClick = () => {
    setIsAddPhotoDialogOpen(false);
    setIsCameraOpen(true);
  };
  
  const deletePhoto = useCallback(async (type: "flora" | "fauna", index: number) => {
    if (!user || !db || !storage) return;

    const photosToDeleteFrom = type === 'flora' ? floraPhotos : faunaPhotos;
    const photoUrlToDelete = photosToDeleteFrom[index];
    if (!photoUrlToDelete) return;
    
    try {
        const imageRef = storageRef(storage, photoUrlToDelete);
        await deleteObject(imageRef);
    } catch (error) {
        console.error("Failed to delete from Storage:", error);
    }

    const newPhotos = [...photosToDeleteFrom];
    newPhotos[index] = null;
    
    if (type === 'flora') {
        setFloraPhotos(newPhotos);
    } else {
        setFaunaPhotos(newPhotos);
    }

    const dbField = type === 'flora' ? 'station1FloraPhotos' : 'station1FaunaPhotos';
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { [dbField]: newPhotos }, { merge: true });
    } catch (error) {
        console.error(`Failed to update ${dbField} in Firestore:`, error);
    }

  }, [user, db, storage, floraPhotos, faunaPhotos]);


  const areAllPhotosUploaded = floraPhotos.every(p => p !== null) && faunaPhotos.every(p => p !== null);

  const onChallengeComplete = () => {
    if (areAllPhotosUploaded) {
      onStationComplete();
    } else {
      toast({
        title: "Reto Incompleto",
        description: "Debes subir las 8 fotos (4 de flora y 4 de fauna) para completar el reto.",
        variant: "destructive"
      })
    }
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
                            <PhotoSlot key={`flora-${index}`} imageUrl={photo} onAddPhoto={() => handleAddPhotoClick("flora", index)} onDelete={() => deletePhoto("flora", index)}/>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-2xl font-bold font-headline text-primary mb-4">Fauna Local</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {faunaPhotos.map((photo, index) => (
                            <PhotoSlot key={`fauna-${index}`} imageUrl={photo} onAddPhoto={() => handleAddPhotoClick("fauna", index)} onDelete={() => deletePhoto("fauna", index)} />
                        ))}
                    </div>
                </section>
            </div>
             <div className="mt-8 text-center">
                <Button size="lg" onClick={onChallengeComplete} disabled={!areAllPhotosUploaded}>
                    Completar Reto
                </Button>
            </div>
        </div>
    </ChallengeContainer>
   </>
  );
};

const HabitatChallenge = ({ onBack, onStationComplete }: { onBack: () => void, onStationComplete: () => void }) => {
  const { user } = useUser();
  const db = useFirestore();
  const storage = useStorage();
  
  const [habitatPhotos, setHabitatPhotos] = useState<(string | null)[]>(Array(4).fill(null));
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const [photoToAddIndex, setPhotoToAddIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePhotosInDb = async (newPhotos: (string | null)[]) => {
    if (!user || !db) return;
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { station1HabitatPhotos: newPhotos }, { merge: true });
    } catch (error) {
        console.error("Failed to save habitat photos URLs to Firestore:", error);
        toast({ title: "Error al guardar URL", description: "No se pudo guardar la URL de la imagen en la nube.", variant: "destructive" });
    }
  };

  useEffect(() => {
    const fetchPhotos = async () => {
        if (!user || !db) return;
        const userDocRef = doc(db, 'users', user.uid);
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

  const handleCapture = async (imageDataUrl: string) => {
    if (!user || !db) {
      toast({
        title: "Sesión requerida",
        description: "Debes iniciar sesión para guardar tus fotos.",
        variant: "destructive",
      });
      return;
    }
  
    if (photoToAddIndex !== null) {
      try {
        const downloadUrl = await uploadImageAndGetUrl(
          user.uid,
          imageDataUrl,
          "habitat",
          photoToAddIndex
        );
  
        const newPhotos = [...habitatPhotos];
        newPhotos[photoToAddIndex] = downloadUrl;
        setHabitatPhotos(newPhotos);
        await updatePhotosInDb(newPhotos);
      } catch (error) {
        console.error("Failed to save habitat photos:", error);
        toast({
          title: "Error al guardar",
          description: "No se pudo guardar la imagen en la nube.",
          variant: "destructive",
        });
      }
    }
  
    setIsCameraOpen(false);
    setPhotoToAddIndex(null);
  };


  const handleAddPhotoClick = (index: number) => {
    setPhotoToAddIndex(index);
    setIsAddPhotoDialogOpen(true);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if(dataUrl) {
            await handleCapture(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  };

  const handleUploadClick = () => {
    setIsAddPhotoDialogOpen(false);
    fileInputRef.current?.click();
  };

  const handleTakeNewPhotoClick = () => {
    setIsAddPhotoDialogOpen(false);
    setIsCameraOpen(true);
  };
  
  const deletePhoto = useCallback(async (index: number) => {
    if (!user || !storage) return;
    const photoUrlToDelete = habitatPhotos[index];
    if (!photoUrlToDelete) return;
    
    try {
        const imageRef = storageRef(storage, photoUrlToDelete);
        await deleteObject(imageRef);
    } catch(e) {
        console.error("Failed to delete photo from storage", e);
    }
    
    const newPhotos = [...habitatPhotos];
    newPhotos[index] = null;
    setHabitatPhotos(newPhotos);
    updatePhotosInDb(newPhotos);
  }, [user, habitatPhotos, storage, updatePhotosInDb]);


  const areAllPhotosUploaded = habitatPhotos.every(p => p !== null);

  const onChallengeComplete = () => {
    if (areAllPhotosUploaded) {
      onStationComplete();
    } else {
      toast({
        title: "Reto Incompleto",
        description: "Debes subir las 4 fotos para completar el reto.",
        variant: "destructive"
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
        description={challenges["Cuidado Animal"].description}
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
                <PhotoSlot key={`habitat-${index}`} imageUrl={photo ?? null} onAddPhoto={() => handleAddPhotoClick(index)} onDelete={() => deletePhoto(index)} />
              ))}
            </div>
          </section>
        </div>
         <div className="mt-8 text-center">
            <Button size="lg" onClick={onChallengeComplete} disabled={!areAllPhotosUploaded}>
                Completar Reto
            </Button>
        </div>
      </ChallengeContainer>
    </>
  );
};


export default function Station1() {
  const stationId = 1;
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const { unlockStation } = useStationProgress();
  const router = useRouter();
  
  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage = "¡Bienvenido a Bionexus! Aquí comienza nuestra gran aventura. Prepárate para descubrir los secretos que conectan toda la vida del planeta. Cada especie, cada árbol, cada gota todos formamos parte de la misma red. ¡Vamos a explorarla juntos! Para ellos debe seleccionar uno de los retos para completar la estación. ¡Debes completarlos todos para avanzar!";
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { completedChallenges, completeChallenge } = useChallengeProgress();

  const scheduleYaraDialog = useCallback(() => {
    if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    yaraTimerRef.current = setTimeout(() => {
      setShowYaraDialog(true);
      const hideTimer = setTimeout(() => setShowYaraDialog(false), 20000); 
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
  }

  const handleChallengeComplete = (challengeName: string) => {
    const imageInfo = PlaceHolderImages.find((p) => p.id === (challengeName === "Fauna y Flora" ? "fauna-capybara" : "habitat-build-1"));
    completeChallenge(stationId, challengeName, imageInfo?.imageUrl);
  
    const stationChallenges = Object.keys(challenges);
    const currentCompletedForStation = Object.keys(completedChallenges[stationId] || {});
    const allChallengesDone = stationChallenges.every(ch => 
      currentCompletedForStation.includes(ch) || ch === challengeName
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
    return <PhotoChallenge onBack={() => setSelectedChallenge(null)} onStationComplete={() => handleChallengeComplete("Fauna y Flora")} />;
  }

  if (selectedChallenge === "Cuidado Animal") {
    return <HabitatChallenge onBack={() => setSelectedChallenge(null)} onStationComplete={() => handleChallengeComplete("Cuidado Animal")} />;
  }

  const stationCompletedChallenges = completedChallenges[stationId] || {};

  return (
    <>
      <ResponsiveBackground>
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-white/90 backdrop-blur-sm text-primary font-kalam py-3 px-10 rounded-lg shadow-lg -rotate-3 mb-8">
            <h1 className="text-4xl md:text-5xl">Bionexus</h1>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            {(Object.keys(challenges) as (keyof typeof challenges)[]).map((reto, index) => {
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
                <div className="absolute inset-0 bg-white shadow-2xl rounded-2xl transform -rotate-1"></div>
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
                      <div className="absolute inset-0 bg-black/40 z-10"></div>
                    </>
                  )}
                  <div className="relative z-20 text-center">
                      <CardHeader>
                          <CardTitle className={cn(
                              "font-kalam text-4xl md:text-5xl",
                              isCompleted && imageUrl ? "text-white" : "text-primary"
                          )}>
                              {challenges[reto].title}
                          </CardTitle>
                      </CardHeader>
                      <CardContent className={cn("text-base md:text-lg", isCompleted && imageUrl && "text-gray-200")}>
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
            )})}
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
                      <TypewriterText text={yaraMessage} className="text-sm text-primary font-medium"/>
                       {/* Speech bubble arrow */}
                      <div className="absolute bottom-[-10px] right-4 md:right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
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

    <PrizeDialog 
        open={isPrizeModalOpen} 
        stationId={stationId} 
        onClaim={handleClaimPrize} 
      />
    </>
  );
}
    
