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
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject, FirebaseStorage } from "firebase/storage";
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
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Error al cargar la imagen para redimensionar.'));
    img.src = dataUrl;
  });
};

const uploadDataUrlAsBlob = async (storage: FirebaseStorage, dataUrl: string, userId: string, path: string): Promise<string> => {
  const storagePathRef = storageRef(storage, `${userId}/${path}_${Date.now()}.jpeg`);
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const snapshot = await uploadBytes(storagePathRef, blob, { contentType: 'image/jpeg' });
  const downloadUrl = await getDownloadURL(snapshot.ref);
  return downloadUrl;
};


type PhotoData = {
  url: string;
  storagePath: string;
  uploadedAt: string;
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

  useEffect(() => {
    let stream: MediaStream | null = null;
    const getCameraPermission = async () => {
      try {
        const constraints = { 
          video: { 
            facingMode: 'environment',
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

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      toast({
        title: "Cámara no lista",
        description: "Espera un momento a que el video se active.",
        variant: "destructive"
      });
      return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        onCapture(canvas.toDataURL('image/jpeg'));
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
  const storage = useStorage()();

  const [photos, setPhotos] = useState<{flora: (PhotoData | null)[], fauna: (PhotoData | null)[]}>({ flora: Array(4).fill(null), fauna: Array(4).fill(null) });

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
                const floraPhotos = data.station1FloraPhotos ? data.station1FloraPhotos.map((p: any) => p || null) : Array(4).fill(null);
                const faunaPhotos = data.station1FaunaPhotos ? data.station1FaunaPhotos.map((p: any) => p || null) : Array(4).fill(null);
                setPhotos({ flora: floraPhotos, fauna: faunaPhotos });
            }
        } catch (error) {
            console.error("Error fetching photos from Firestore:", error);
        }
    };
    fetchPhotos();
  }, [user, db]);

  const updatePhotosInFirestore = useCallback(async (type: "flora" | "fauna", photosForType: (PhotoData | null)[]) => {
    if (!user || !db) return;
    const dbField = type === "flora" ? 'station1FloraPhotos' : 'station1FaunaPhotos';
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { [dbField]: photosForType }, { merge: true });
    } catch (error) {
      console.error(`Failed to save ${type} photos to Firestore:`, error);
      toast({ title: "Error al guardar", description: `No se pudo guardar ${type} en la nube.`, variant: "destructive" });
    }
  }, [user, db]);

  const handleProcessPhoto = async (dataUrl: string) => {
    if (!photoToAdd || !user || !storage) return;
    const { type, index } = photoToAdd;

    try {
        const resizedUrl = await resizeImage(dataUrl, 1024);
        toast({ title: "Subiendo imagen..." });
        
        const storagePath = `station1/photos/${type}/${type}_${index}`;
        const downloadUrl = await uploadDataUrlAsBlob(storage, resizedUrl, user.uid, storagePath);

        const newPhotoData: PhotoData = {
          url: downloadUrl,
          storagePath: storagePath,
          uploadedAt: new Date().toISOString(),
        };

        setPhotos(prev => {
            const newPhotosForType = [...prev[type]];
            newPhotosForType[index] = newPhotoData;
            updatePhotosInFirestore(type, newPhotosForType); 
            toast({ title: "¡Foto guardada!", description: "Tu imagen se ha subido correctamente." });
            return { ...prev, [type]: newPhotosForType };
        });
        
    } catch (e) {
      console.error("Error al procesar la foto:", e);
      toast({ title: "Error al subir", description: "No se pudo procesar ni guardar la imagen.", variant: "destructive" });
    } finally {
      setPhotoToAdd(null);
      setIsCameraOpen(false);
      setIsAddPhotoDialogOpen(false);
    }
  };


  const handleAddPhotoClick = (type: "flora" | "fauna", index: number) => {
    setPhotoToAdd({ type, index });
    setIsAddPhotoDialogOpen(true);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) {
            await handleProcessPhoto(dataUrl);
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
  
  const deletePhoto = useCallback(async (type: "flora" | "fauna", index: number) => {
    if (!user || !storage) return;

    const photoToDelete = photos[type][index];
    if (!photoToDelete) return;
    
    const newPhotosForType = [...photos[type]];
    newPhotosForType[index] = null;
    setPhotos(prev => ({ ...prev, [type]: newPhotosForType }));

    try {
        if(photoToDelete.storagePath) {
            const imageRef = storageRef(storage, photoToDelete.storagePath);
            await deleteObject(imageRef);
        }
    } catch (error) {
        console.error("Failed to delete from Storage:", error);
    }
    
    updatePhotosInFirestore(type, newPhotosForType);
  }, [user, photos, storage, updatePhotosInFirestore]);


  const areAllPhotosUploaded = photos.flora.every(p => p !== null) && photos.fauna.every(p => p !== null);

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
            onCapture={handleProcessPhoto}
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
                        {photos.flora.map((photo, index) => (
                            <PhotoSlot key={`flora-${index}`} imageUrl={photo?.url ?? null} onAddPhoto={() => handleAddPhotoClick("flora", index)} onDelete={() => deletePhoto("flora", index)}/>
                        ))}
                    </div>
                </section>

                <section>
                    <h3 className="text-2xl font-bold font-headline text-primary mb-4">Fauna Local</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {photos.fauna.map((photo, index) => (
                            <PhotoSlot key={`fauna-${index}`} imageUrl={photo?.url ?? null} onAddPhoto={() => handleAddPhotoClick("fauna", index)} onDelete={() => deletePhoto("fauna", index)} />
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
  const storage = useStorage()();
  
  const [habitatPhotos, setHabitatPhotos] = useState<(PhotoData | null)[]>(Array(4).fill(null));
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isAddPhotoDialogOpen, setIsAddPhotoDialogOpen] = useState(false);
  const [photoToAddIndex, setPhotoToAddIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePhotosInDb = useCallback(async (newPhotos: (PhotoData | null)[]) => {
    if (!user || !db) return;
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { station1HabitatPhotos: newPhotos }, { merge: true });
    } catch (error) {
        console.error("Failed to save habitat photos URLs to Firestore:", error);
        toast({ title: "Error al guardar URL", description: "No se pudo guardar la URL de la imagen en la nube.", variant: "destructive" });
    }
  }, [user, db]);

  useEffect(() => {
    const fetchPhotos = async () => {
        if (!user || !db) return;
        const userDocRef = doc(db, 'users', user.uid);
        try {
            const docSnap = await getDoc(userDocRef);
            if (docSnap.exists() && docSnap.data().station1HabitatPhotos) {
                const loadedPhotos = docSnap.data().station1HabitatPhotos.map((p: any) => p || null);
                setHabitatPhotos(loadedPhotos);
            }
        } catch (error) {
            console.error("Error fetching habitat photos from Firestore:", error);
        }
    };
    fetchPhotos();
  }, [user, db]);

  const handleProcessPhoto = async (dataUrl: string) => {
    if (photoToAddIndex === null || !user || !storage) return;
    
    try {
        const resizedUrl = await resizeImage(dataUrl, 1024);
        toast({ title: "Subiendo imagen..." });
        
        const storagePath = `station1/habitat/photos/habitat_${photoToAddIndex}`;
        const downloadUrl = await uploadDataUrlAsBlob(storage, resizedUrl, user.uid, storagePath);

        const newPhotoData: PhotoData = {
          url: downloadUrl,
          storagePath: storagePath,
          uploadedAt: new Date().toISOString(),
        };

        const newPhotos = [...habitatPhotos];
        newPhotos[photoToAddIndex] = newPhotoData;
        
        setHabitatPhotos(newPhotos);
        toast({ title: "¡Foto guardada!", description: "Tu imagen se ha subido correctamente." });
        await updatePhotosInDb(newPhotos);

    } catch(e) {
        console.error("Error al procesar la foto:", e);
        toast({ title: "Error al subir", description: "No se pudo procesar ni guardar la imagen.", variant: "destructive" });
    } finally {
        setPhotoToAddIndex(null);
        setIsCameraOpen(false);
        setIsAddPhotoDialogOpen(false);
    }
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
            await handleProcessPhoto(dataUrl);
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
    const photoToDelete = habitatPhotos[index];
    if (!photoToDelete) return;
    
    const newPhotos = [...habitatPhotos];
    newPhotos[index] = null;
    setHabitatPhotos(newPhotos);
    
    try {
        if (photoToDelete.storagePath) {
            const imageRef = storageRef(storage, photoToDelete.storagePath);
            await deleteObject(imageRef);
        }
    } catch(e) {
        console.error("Failed to delete photo from storage", e);
    }
    
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
          onCapture={handleProcessPhoto}
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
                <PhotoSlot key={`habitat-${index}`} imageUrl={photo?.url ?? null} onAddPhoto={() => handleAddPhotoClick(index)} onDelete={() => deletePhoto(index)} />
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
    