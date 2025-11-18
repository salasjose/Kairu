
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Store, Trash2 } from "lucide-react";
import PrizeDialog from "../PrizeDialog";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { useUser, useFirestore } from "@/firebase/hooks";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import TypewriterText from "../auth/TypewriterText";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import ArtDirectedBackground from "../ArtDirectedBackground";

type Business = {
  name: string;
  imageUrl: string;
};

const AddBusinessDialog = ({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (business: Business) => void;
}) => {
  const [name, setName] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "Falta el nombre", description: "Por favor, añade un nombre para el negocio.", variant: "destructive" });
      return;
    }
    if (!image) {
      toast({ title: "Falta la imagen", description: "Por favor, carga una imagen para el negocio.", variant: "destructive" });
      return;
    }
    onSave({ name, imageUrl: image });
    setName("");
    setImage(null);
  };
  
  const resetAndClose = () => {
    setName("");
    setImage(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
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
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          <Button variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
            <Camera className="mr-2" />
            {image ? "Cambiar Imagen" : "Cargar Imagen"}
          </Button>
          {image && (
             <div className="relative w-full h-32 rounded-md overflow-hidden border">
                <Image src={image} alt="Vista previa" fill style={{objectFit: "cover"}} />
             </div>
          )}
        </div>
        <DialogFooter>
            <DialogClose asChild>
                 <Button variant="ghost" onClick={resetAndClose}>Cancelar</Button>
            </DialogClose>
          <Button onClick={handleSave}>Guardar Negocio</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


export default function Station7() {
  const stationId = 7;
  const [businesses, setBusinesses] = useState<(Business | null)[]>(Array(4).fill(null));
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  
  const { unlockStation } = useStationProgress();
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage = "¡Te doy la bienvenida a VerdeLab! Este es el laboratorio donde los sueños sostenibles se convierten en proyectos reales. ¡Emprende con propósito, crea con el corazón y demuestra que cuidar también puede ser una gran idea!";
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
  

  const updateBusinessesInDb = useCallback(async (newBusinesses: (Business | null)[]) => {
     if (!user || !db) return;
     const userDocRef = doc(db, 'users', user.uid);
     try {
       await setDoc(userDocRef, { station7Businesses: newBusinesses.filter(Boolean) }, { merge: true });
     } catch (error) {
       console.error("Error saving businesses to Firestore:", error);
       toast({ title: "Error", description: "No se pudo guardar tu progreso en la nube.", variant: "destructive" });
     }
  }, [user, db]);

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
            console.error("Error fetching businesses from Firestore:", error);
        }
    };
    fetchBusinesses();
  }, [user, db]);


  const handleSaveBusiness = (business: Business) => {
    const newBusinesses = [...businesses];
    const firstEmptyIndex = newBusinesses.findIndex(b => b === null);
    if (firstEmptyIndex !== -1) {
      newBusinesses[firstEmptyIndex] = business;
      setBusinesses(newBusinesses);
      updateBusinessesInDb(newBusinesses);
    } else {
        toast({ title: "Galería llena", description: "Ya has añadido 4 negocios.", variant: "destructive" });
    }
    setIsDialogOpen(false);
  };
  
  const handleDeleteBusiness = (index: number) => {
      const newBusinesses = [...businesses];
      newBusinesses[index] = null;
      // compact the array so there are no gaps
      const compacted = newBusinesses.filter(Boolean);
      const finalState = Array(4).fill(null);
      compacted.forEach((biz, i) => finalState[i] = biz);
      
      setBusinesses(finalState);
      updateBusinessesInDb(finalState);
  }

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
    router.push("/");
  };
  
  const businessesCount = businesses.filter(b => b !== null).length;
  const isCompleteButtonDisabled = businessesCount < 4;

  return (
    <>
      <AddBusinessDialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        onSave={handleSaveBusiness} 
      />

      <ArtDirectedBackground
        desktopSrc="/backgrounds/VerdelabPc.png"
        tabletSrc="/backgrounds/VVerdelabTablet.png"
        mobileSrc="/backgrounds/Verdelab1075_X_1944.png"
      >
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">VerdeLAb</h1>
          </div>
          
          <Card className="w-full shadow-lg bg-card/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold">Reto: Negocios Verdes en Acción</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">Te invitamos a colocar 4 Negocios que reconozcas como sostenibles.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {businesses.map((business, index) => (
                  <Card key={index} className="aspect-square flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    {business ? (
                      <>
                        <Image src={business.imageUrl} alt={business.name} fill style={{objectFit: "cover"}} />
                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-end p-2 text-white">
                           <p className="font-bold text-sm text-center">{business.name}</p>
                        </div>
                        <Button 
                            variant="destructive" 
                            size="icon" 
                            className="absolute top-1 right-1 h-6 w-6 z-10"
                            onClick={() => handleDeleteBusiness(index)}
                        >
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" className="flex-col h-full w-full" onClick={() => setIsDialogOpen(true)}>
                        <Store className="h-10 w-10 text-muted-foreground" />
                        <span className="text-xs mt-1">Añadir Negocio</span>
                      </Button>
                    )}
                  </Card>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center gap-2 pt-4">
                <Button onClick={handleComplete} size="lg" disabled={isCompleteButtonDisabled}>
                  Completar Reto
                </Button>
                {isCompleteButtonDisabled && (
                    <p className="text-sm text-muted-foreground">
                        Faltan {4 - businessesCount} negocio(s) por añadir.
                    </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Yara Character and Dialog */}
        <div className="absolute bottom-4 right-4 z-20 flex items-end gap-4 pointer-events-none">
            <AnimatePresence>
                {showYaraDialog && yaraCharImage && (
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20, transition: { duration: 0.5 } }}
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
                          animate={{ opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.8 } }}
                          exit={{ opacity: 0, x: 50, transition: { duration: 0.5 } }}
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
