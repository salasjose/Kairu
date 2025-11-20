'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore } from "@/firebase/hooks";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { usePrizeCart } from "@/hooks/use-prize-cart";
import { motion, useDragControls, PanInfo, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import CompletionDialog from "../CompletionDialog";
import type { Prize } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card } from "@/components/ui/card";
import TypewriterText from "../auth/TypewriterText";
import { Slider } from "@/components/ui/slider";
import { Trash2, Gift, X, Edit, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import ArtDirectedBackground from "../ArtDirectedBackground";

const DRAGGABLE_AREA_ID = "station-9-canvas";

type PlacedPrize = {
  id: string;
  imageUrl: string;
  name: string;
  x: number;
  y: number;
  scale: number;
  stationId: number;
};

const DraggablePrize = ({ 
  prize, 
  onDragEnd, 
  constraints 
}: { 
  prize: Prize, 
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void,
  constraints: React.RefObject<HTMLElement> 
}) => {
  const controls = useDragControls();
  
  return (
    <motion.div
        key={prize.id}
        drag
        dragMomentum={false}
        dragControls={controls}
        onDragEnd={onDragEnd}
        dragConstraints={constraints}
        className="w-full aspect-square bg-white/20 rounded-md p-1 cursor-grab active:cursor-grabbing"
    >
        <div className="relative w-full h-full" onPointerDown={(e) => controls.start(e, { snapToCursor: true })}>
            <Image src={prize.imageUrl} alt={prize.name} fill style={{objectFit: 'contain'}}/>
        </div>
    </motion.div>
  );
}

const ScenarioPicker = ({ onScenarioSelect }: { onScenarioSelect: (url: string) => void }) => {
    const scenarios = useMemo(() => [
        { name: "Terral", ...PlaceHolderImages.find(p => p.id === 'scenario-bosque-seco') },
        { name: "Civika", ...PlaceHolderImages.find(p => p.id === 'scenario-ciudad') },
        { name: "Mareva", ...PlaceHolderImages.find(p => p.id === 'scenario-mar-costero') },
        { name: "Manglia", ...PlaceHolderImages.find(p => p.id === 'scenario-manglares') },
    ].filter(s => s.imageUrl) as any[], []);

    return (
        <div className="w-full h-full bg-background/80 backdrop-blur-sm flex items-center justify-center p-8 text-center">
            <Card className="p-8">
                <h2 className="text-2xl font-bold text-primary mb-4">Elige tu Lienzo</h2>
                <p className="text-muted-foreground mb-6">
                    Parece que no tienes un lienzo asignado. Por favor, selecciona uno para continuar y crear tu estación.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {scenarios.map(scenario => (
                        <Card 
                            key={scenario.id} 
                            onClick={() => onScenarioSelect(scenario.imageUrl)}
                            className="p-2 cursor-pointer hover:border-primary hover:scale-105 transition-transform duration-300"
                        >
                            <Image src={scenario.imageUrl} alt={scenario.description} width={200} height={200} className="rounded-md aspect-square object-cover" />
                            <p className="font-bold mt-2 text-sm">{scenario.name}</p>
                        </Card>
                    ))}
                </div>
            </Card>
        </div>
    );
};


export default function Station9() {
  const [chosenScenario, setChosenScenario] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [placedPrizes, setPlacedPrizes] = useState<PlacedPrize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isYaraMessageVisible, setIsYaraMessageVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isStationLocked, setIsStationLocked] = useState(false);
  
  const { user } = useUser();
  const db = useFirestore();
  const { prizes: collectedPrizes } = usePrizeCart();
  const collectedPrizesFromStations1to8 = collectedPrizes.filter(p => p.stationId <= 8);

  const canvasRef = useRef<HTMLDivElement>(null);
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === 'char-yara-final');
  const dragControls = useDragControls();

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!user || !db) {
        setIsLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setChosenScenario(data.chosenScenario || null);
          setPlacedPrizes(data.placedPrizes?.map((p: any) => ({ ...p, scale: p.scale || 1 })) || []);
          const fullName = `${data.nombre || ''} ${data.apellido || ''}`.trim();
          setPlayerName(fullName || "Guardián");
          setIsStationLocked(data.station9Locked || false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlayerData();
  }, [user, db]);

  const scheduleYaraDialog = useCallback(() => {
    const showTimer = setTimeout(() => {
      setIsYaraMessageVisible(true);
    }, 1000); 

    const hideTimer = setTimeout(() => {
      setIsYaraMessageVisible(false);
    }, 1000 + 15000); 

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);
  
  useEffect(() => {
    if (isLoading || !chosenScenario) return; 
    const clearTimers = scheduleYaraDialog();
    return clearTimers;
  }, [isLoading, chosenScenario, scheduleYaraDialog]);

  const savePrizesToDb = useCallback(async (prizesToSave: PlacedPrize[]) => {
      if (!user || !db) return;
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { placedPrizes: prizesToSave }, { merge: true });
      } catch (error) {
        console.error("Failed to save prize position", error);
        toast({
            title: "Error al guardar",
            description: "No se pudo guardar la posición de la insignia.",
            variant: "destructive",
        });
      }
  }, [user, db]);


  const handlePrizeDrop = async (prizeId: string, info: any) => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = info.point.x - canvasRect.left;
    const y = info.point.y - canvasRect.top;

    const existingPrize = placedPrizes.find(p => p.id === prizeId);
    const prizeData = collectedPrizes.find(p => p.id === prizeId);
    if (!prizeData) return;
    
    const newPlacedPrize: PlacedPrize = { 
        ...prizeData, 
        x, 
        y, 
        scale: existingPrize?.scale || 1,
    };

    const newPlacedPrizes = [
      ...placedPrizes.filter(p => p.id !== prizeId),
      newPlacedPrize,
    ];
    
    setPlacedPrizes(newPlacedPrizes);
    savePrizesToDb(newPlacedPrizes);
  };
  
  const handleScaleChange = (prizeId: string, newScale: number[]) => {
    const newPlacedPrizes = placedPrizes.map(p => 
        p.id === prizeId ? { ...p, scale: newScale[0] } : p
    );
    setPlacedPrizes(newPlacedPrizes);
  };

  const handleScaleChangeCommit = (prizeId: string, newScale: number[]) => {
     const newPlacedPrizes = placedPrizes.map(p => 
        p.id === prizeId ? { ...p, scale: newScale[0] } : p
    );
    savePrizesToDb(newPlacedPrizes);
  };


  const handleDeletePrize = (prizeId: string) => {
    const prizeToRemove = placedPrizes.find(p => p.id === prizeId);
    if (!prizeToRemove) return;
    
    const newPlacedPrizes = placedPrizes.filter(p => p.id !== prizeId);
    setPlacedPrizes(newPlacedPrizes);
    savePrizesToDb(newPlacedPrizes);
    setSelectedPrizeId(null);
  };

  const handleConfirmStation = async () => {
    if (!user || !db) return;
    setIsStationLocked(true);
    try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { station9Locked: true }, { merge: true });
        toast({ title: "Estación Confirmada", description: "¡Tu diseño ha sido guardado!." });
    } catch(e) {
        console.error("Error confirming station", e);
        setIsStationLocked(false);
        toast({ title: "Error", description: "No se pudo confirmar la estación.", variant: "destructive" });
    }
  }

  const handleModifyStation = async () => {
    if (!user || !db) return;
    setIsStationLocked(false);
    try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { station9Locked: false }, { merge: true });
    } catch(e) {
        console.error("Error unlocking station", e);
        setIsStationLocked(true);
        toast({ title: "Error", description: "No se pudo desbloquear la estación.", variant: "destructive" });
    }
  }

  const handleCompleteChallenge = () => {
    setIsCompletionDialogOpen(true);
  }

  const handleScenarioSelect = async (scenarioUrl: string) => {
    if (!user || !db) {
        toast({ title: "Error", description: "No se puede guardar la selección. Intenta iniciar sesión de nuevo.", variant: "destructive" });
        return;
    }
    try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { chosenScenario: scenarioUrl }, { merge: true });
        setChosenScenario(scenarioUrl);
        toast({ title: "Lienzo guardado", description: "Tu estación ahora tiene un fondo." });
    } catch (error) {
        console.error("Failed to save chosen scenario:", error);
        toast({ title: "Error", description: "No se pudo guardar tu selección de lienzo.", variant: "destructive" });
    }
  };

  const unplacedPrizes = collectedPrizesFromStations1to8.filter(
    p => !placedPrizes.some(pp => pp.id === p.id)
  );
  
  const allPrizesPlaced = collectedPrizesFromStations1to8.length > 0 && 
                          unplacedPrizes.length === 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        Cargando tu estación personalizada...
      </div>
    );
  }

  const yaraMessage = `${playerName}, ¡Ya eres un Guardián de la Naturaleza! Ahora es tiempo de armar tu Estación. Moverás tus Insignias por todo tu lienzo; para ello, debes hacer doble clic y sostener tu insignia sin soltarla hasta el lugar donde la quieras tener.`;

  const getBackgroundSources = () => {
    if (!chosenScenario) return null;
    
    if (chosenScenario.includes('Bosque_Seco_Tropical')) {
        return { desktopSrc: "/backgrounds/Terral1366_X_768.png", tabletSrc: "/backgrounds/Terral1024_X_768.png", mobileSrc: "/backgrounds/Terral1075_X_1944.png" };
    }
    if (chosenScenario.includes('Ciudad_Sostenible')) {
        return { desktopSrc: "/backgrounds/Civika1366_X_768.png", tabletSrc: "/backgrounds/Civika1024_X_768.png", mobileSrc: "/backgrounds/Civika1075_X_1944.png" };
    }
    if (chosenScenario.includes('Mar_Costero')) {
        return { desktopSrc: "/backgrounds/Mareva1366_X_768.png", tabletSrc: "/backgrounds/Mareva1024_X_768.png", mobileSrc: "/backgrounds/Mareva1075_X_1944.png" };
    }
    if (chosenScenario.includes('Manglares')) {
        return { desktopSrc: "/backgrounds/Manglia1366_X_768.png", tabletSrc: "/backgrounds/Manglia1024_X_768.png", mobileSrc: "/backgrounds/Manglia1075_X_1944.png" };
    }
    return null;
  };

  const backgroundSources = getBackgroundSources();

  return (
    <>
      <div className="relative w-screen h-screen overflow-hidden bg-background" onClick={(e) => {
           if ((e.target as HTMLElement).closest('.placed-prize-wrapper')) return;
           setSelectedPrizeId(null);
      }}>
        
        {/* Background layer */}
        <div className="absolute inset-0 z-10">
          {backgroundSources ? (
            <ArtDirectedBackground {...backgroundSources} />
          ) : (
             <ScenarioPicker onScenarioSelect={handleScenarioSelect} />
          )}
        </div>
        
        {/* Canvas Area */}
        <div id={DRAGGABLE_AREA_ID} ref={canvasRef} className="absolute inset-0 z-20">
          {/* Placed Prizes */}
          {placedPrizes.map((prize) => {
            const isSelected = selectedPrizeId === prize.id;
            const isSpecialPrize = prize.imageUrl.includes('Molinos.png') || prize.imageUrl.includes('Ciudad.png');

            return (
                 <motion.div
                    key={prize.id}
                    drag
                    dragControls={dragControls}
                    dragMomentum={false}
                    onDragEnd={(event, info) => handlePrizeDrop(prize.id, info)}
                    dragConstraints={canvasRef}
                    dragListener={!isStationLocked}
                    className={cn(
                      "placed-prize-wrapper absolute",
                      isStationLocked ? "cursor-default" : "cursor-grab active:cursor-grabbing"
                    )}
                    style={{ 
                        x: prize.x, 
                        y: prize.y, 
                        width: `${80 * prize.scale}px`, 
                        height: `${80 * prize.scale}px`
                    }}
                    initial={{ x: prize.x, y: prize.y, scale: prize.scale }}
                    onClick={(e) => {
                      if (!isStationLocked) {
                        e.stopPropagation(); 
                        setSelectedPrizeId(prize.id);
                      }
                    }}
                    animate={{ 
                        scale: isSelected ? 1.1 : 1,
                        boxShadow: isSelected ? "0px 0px 15px rgba(255,255,100,0.8)" : "0px 0px 0px rgba(0,0,0,0)",
                    }}
                    transition={{ duration: 0.2 }}
                    >
                    <div className="w-full h-full relative" onPointerDown={(e) => {
                       if (!isStationLocked) {
                          e.stopPropagation();
                          dragControls.start(e, { snapToCursor: false });
                       }
                    }}>
                        <Image src={prize.imageUrl} alt={prize.name} fill style={{objectFit:'contain'}} />
                    </div>

                     {isSelected && !isStationLocked && (
                        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-40 bg-background/80 p-2 rounded-lg shadow-lg flex items-center gap-2" onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
                            <Slider
                                defaultValue={[prize.scale]}
                                min={0.5}
                                max={isSpecialPrize ? 7 : 2.5}
                                step={0.1}
                                onValueChange={(value) => handleScaleChange(prize.id, value)}
                                onValueCommit={(value) => handleScaleChangeCommit(prize.id, value)}
                            />
                             <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeletePrize(prize.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </motion.div>
            )
          })}
        </div>

        {/* Sidebar Toggle Button */}
        <Button 
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-4 right-4 z-40 bg-white/80"
        >
            <AnimatePresence initial={false}>
                {isSidebarOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                        <X />
                    </motion.div>
                ) : (
                    <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                        <Gift />
                    </motion.div>
                )}
            </AnimatePresence>
        </Button>


        {/* Sidebar with unplaced prizes */}
        <AnimatePresence>
            {isSidebarOpen && (
                 <motion.div 
                    className="absolute top-0 right-0 h-full w-24 md:w-32 bg-black/50 backdrop-blur-sm p-2 z-30 flex flex-col items-center"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                    <h3 className="text-white font-bold text-sm mt-12 mb-2 text-center">Insignias</h3>
                    <div className="flex-grow overflow-y-auto space-y-2 w-full">
                        {unplacedPrizes.map(prize => (
                            <DraggablePrize 
                            key={prize.id}
                            prize={prize} 
                            onDragEnd={(event, info) => handlePrizeDrop(prize.id, info)}
                            constraints={canvasRef}
                            />
                        ))}
                        {unplacedPrizes.length === 0 && (
                            <p className="text-white/70 text-xs text-center pt-4">¡Todas las insignias colocadas!</p>
                        )}
                    </div>
                    {allPrizesPlaced && (
                      isStationLocked ? (
                        <Button onClick={handleModifyStation} className="mt-4 w-full">
                            <Edit className="mr-2 h-4 w-4" />
                            Modificar
                        </Button>
                      ) : (
                        <Button onClick={handleConfirmStation} className="mt-4 w-full">
                            <Check className="mr-2 h-4 w-4" />
                            Confirmar
                        </Button>
                      )
                    )}
                    {isStationLocked && (
                         <Button onClick={handleCompleteChallenge} className="mt-2 w-full" variant="secondary">
                            Completar
                        </Button>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
        
        {/* Yara Character and Dialog */}
        <div className="absolute bottom-4 right-40 z-30 flex items-end gap-4 pointer-events-none">
          <AnimatePresence>
            {isYaraMessageVisible && yaraCharImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                className="flex items-end gap-4"
              >
                <div className="w-80 mb-4">
                  <Card className="p-3 shadow-lg bg-white/95 relative pointer-events-auto">
                    <TypewriterText text={yaraMessage} className="text-sm text-primary font-medium" />
                    <div className="absolute bottom-[-10px] right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                  </Card>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: 0.2 } }}
                  exit={{ opacity: 0, x: 50, transition: { duration: 0.5 } }}
                  className="w-24 h-auto md:w-32"
                >
                  <Image
                    src={yaraCharImage.imageUrl}
                    alt={yaraCharImage.description}
                    width={150}
                    height={187}
                    className="h-auto w-full select-none"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
      <CompletionDialog 
        open={isCompletionDialogOpen}
        onOpenChange={setIsCompletionDialogOpen}
      />
    </>
  );
}

    