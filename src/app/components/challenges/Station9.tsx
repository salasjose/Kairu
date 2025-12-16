"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useFirestore, useMemoFirebase } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { usePrizeCart } from "@/hooks/use-prize-cart";
import { Prize } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Trash2, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import ResponsiveBackground from "../ResponsiveBackground";
import { cn } from "@/lib/utils";

type PlacedPrize = Prize & {
  x: number;
  y: number;
  scale: number;
};

const SCENARIO_BACKGROUNDS = {
  "/backgrounds/Bosque_Seco_Tropical.png": {
    desktopSrc: "/backgrounds/Terral1366_X_768.png",
    tabletSrc: "/backgrounds/Terral1024_X_768.png",
    mobileSrc: "/backgrounds/Terral1075_X_1944.png",
  },
  "/backgrounds/Ciudad_Sostenible.png": {
    desktopSrc: "/backgrounds/Civika1366_X_768.png",
    tabletSrc: "/backgrounds/Civika1024_X_768.png",
    mobileSrc: "/backgrounds/Civika1075_X_1944.png",
  },
  "/backgrounds/Mar_Costero.png": {
    desktopSrc: "/backgrounds/Mareva1366_X_768.png",
    tabletSrc: "/backgrounds/Mareva1024_X_768.png",
    mobileSrc: "/backgrounds/Mareva1075_X_1944.png",
  },
  "/backgrounds/Manglares.png": {
    desktopSrc: "/backgrounds/Manglia1366_X_768.png",
    tabletSrc: "/backgrounds/Manglia1024_X_768.png",
    mobileSrc: "/backgrounds/Manglia1075_X_1944.png",
  },
};

export default function Station9() {
  const { user } = useUser();
  const db = useFirestore();
  const { prizes: collectedPrizes = [] } = usePrizeCart() ?? {};
  const [placedPrizes, setPlacedPrizes] = useState<PlacedPrize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isFinalized, setIsFinalized] = useState(false);
  const [backgroundProps, setBackgroundProps] = useState({
    desktopSrc: "/backgrounds/MapaPc.png",
    tabletSrc: "/backgrounds/MapaTablet.png",
    mobileSrc: "/backgrounds/MapaTelefono.png",
  });
  
  const canvasRef = useRef<HTMLDivElement>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, 'users', user.uid);
  }, [user, db]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (userDocRef) {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPlacedPrizes(data.placedPrizes || []);
          setIsFinalized(data.station9Finalized || false);
          
          const scenarioKey = Object.keys(SCENARIO_BACKGROUNDS).find(key => data.chosenScenario?.includes(key));
          if (scenarioKey) {
            setBackgroundProps(SCENARIO_BACKGROUNDS[scenarioKey as keyof typeof SCENARIO_BACKGROUNDS]);
          }
        }
      }
    };
    fetchUserData();
  }, [userDocRef]);

  const savePlacedPrizes = useCallback(async (prizesToSave: PlacedPrize[]) => {
    if (!userDocRef) return;
    await setDoc(userDocRef, { placedPrizes: prizesToSave }, { merge: true });
  }, [userDocRef]);

  const handleDrop = (prize: Prize, offset: { x: number; y: number }) => {
    if (isFinalized) return;
    const newPrize: PlacedPrize = { ...prize, x: offset.x, y: offset.y, scale: 1 };
    const newPlacedPrizes = [...placedPrizes, newPrize];
    setPlacedPrizes(newPlacedPrizes);
    savePlacedPrizes(newPlacedPrizes);
  };

  const handleDragEnd = (prizeId: string, info: any) => {
    if (isFinalized) return;
    const newPlacedPrizes = placedPrizes.map((p) => {
      if (p.id === prizeId) {
        const canvasRect = canvasRef.current?.getBoundingClientRect();
        if (!canvasRect) return p;

        const prizeWidth = 100 * p.scale; 
        const prizeHeight = 100 * p.scale; 

        const clampedX = Math.max(0, Math.min(info.point.x - canvasRect.left - prizeWidth / 2, canvasRect.width - prizeWidth));
        const clampedY = Math.max(0, Math.min(info.point.y - canvasRect.top - prizeHeight / 2, canvasRect.height - prizeHeight));
        
        return { ...p, x: clampedX, y: clampedY };
      }
      return p;
    });
    setPlacedPrizes(newPlacedPrizes);
    savePlacedPrizes(newPlacedPrizes);
  };

  const handleScaleChange = (prizeId: string, newScale: number[]) => {
    if (isFinalized) return;
    const newPlacedPrizes = placedPrizes.map((p) =>
      p.id === prizeId ? { ...p, scale: newScale[0] } : p
    );
    setPlacedPrizes(newPlacedPrizes);
    savePlacedPrizes(newPlacedPrizes);
  };
  
  const handleRemovePrize = (prizeId: string) => {
      if (isFinalized) return;
      const newPlacedPrizes = placedPrizes.filter((p) => p.id !== prizeId);
      setPlacedPrizes(newPlacedPrizes);
      savePlacedPrizes(newPlacedPrizes);
  };

  const handleFinalize = async () => {
    if (!userDocRef) return;
    await setDoc(userDocRef, { station9Finalized: true }, { merge: true });
    setIsFinalized(true);
    toast({
        title: "¡Lienzo Guardado!",
        description: "Tu estación personalizada ha sido guardada. ¡Felicidades, Guardián de la Naturaleza!",
    });
  };

  const selectedPrize = selectedPrizeId ? placedPrizes.find(p => p.id === selectedPrizeId) : null;

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, x: "-100%" }}
            animate={{ width: "250px", x: 0 }}
            exit={{ width: 0, x: "-100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }}
            className="flex-shrink-0 h-full overflow-y-auto bg-card border-r"
          >
            <SidebarContent
              collectedPrizes={collectedPrizes}
              placedPrizes={placedPrizes}
              onDrop={handleDrop}
              isFinalized={isFinalized}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-grow flex flex-col relative">
        <Button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute top-4 left-4 z-20"
          size="sm"
        >
          {isSidebarOpen ? "Ocultar Insignias" : "Mostrar Insignias"}
        </Button>
        <ResponsiveBackground {...backgroundProps}>
            <div
                ref={canvasRef}
                className="w-full h-full relative"
                onClick={() => setSelectedPrizeId(null)}
            >
                {placedPrizes.map((prize) => (
                    <PlacedPrize
                        key={prize.id}
                        prize={prize}
                        onDragEnd={handleDragEnd}
                        onScaleChange={handleScaleChange}
                        onRemove={handleRemovePrize}
                        isSelected={prize.id === selectedPrizeId}
                        onSelect={() => !isFinalized && setSelectedPrizeId(prize.id)}
                        isFinalized={isFinalized}
                    />
                ))}
            </div>
        </ResponsiveBackground>
        {!isFinalized && (
            <div className="absolute bottom-4 right-4 z-20">
                <Button onClick={handleFinalize} size="lg">
                    <CheckCircle className="mr-2" />
                    Finalizar y Guardar Lienzo
                </Button>
            </div>
        )}
      </div>
    </div>
  );
}

const SidebarContent = ({ collectedPrizes, placedPrizes, onDrop, isFinalized }: { collectedPrizes: Prize[], placedPrizes: PlacedPrize[], onDrop: (prize: Prize, offset: {x:number, y:number}) => void, isFinalized: boolean }) => {
  const safeCollectedPrizes = Array.isArray(collectedPrizes) ? collectedPrizes : [];
  const remainingPrizes = safeCollectedPrizes.filter(
    (p) => !placedPrizes.some((pp) => pp.id === p.id)
  );

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Tus Insignias</h2>
      {isFinalized && (
         <p className="text-sm text-muted-foreground mb-4">Tu lienzo está finalizado. No puedes añadir más insignias.</p>
      )}
      <div className="grid grid-cols-2 gap-4">
        {remainingPrizes.map((prize) => (
          <motion.div
            key={prize.id}
            drag={!isFinalized}
            dragSnapToOrigin={true}
            onDragEnd={(_event, info) => onDrop(prize, info.offset)}
            className={cn("cursor-grab", isFinalized && "cursor-not-allowed opacity-50")}
          >
            <Card className="p-2 aspect-square flex flex-col items-center justify-center text-center">
              <Image src={prize.imageUrl} alt={prize.name} width={60} height={60} className="object-contain" />
              <p className="text-xs mt-1">{prize.name}</p>
            </Card>
          </motion.div>
        ))}
        {remainingPrizes.length === 0 && !isFinalized && (
            <p className="col-span-2 text-sm text-muted-foreground">Ya has colocado todas tus insignias. ¡Buen trabajo!</p>
        )}
      </div>
    </div>
  );
};


const PlacedPrize = ({ prize, onDragEnd, onScaleChange, onRemove, isSelected, onSelect, isFinalized }: { prize: PlacedPrize, onDragEnd: (id: string, info: any) => void, onScaleChange: (id: string, scale: number[]) => void, onRemove: (id: string) => void, isSelected: boolean, onSelect: () => void, isFinalized: boolean }) => {
    
    return (
        <motion.div
            drag={!isFinalized}
            dragMomentum={false}
            onDragEnd={(event, info) => onDragEnd(prize.id, info)}
            initial={{ x: prize.x, y: prize.y, scale: prize.scale }}
            animate={{ x: prize.x, y: prize.y, scale: prize.scale }}
            transition={{ type: "spring", stiffness: 500, damping: 50 }}
            className="absolute w-[100px] h-[100px] cursor-grab active:cursor-grabbing focus:outline-none"
            style={{
                outline: isSelected ? '2px dashed hsl(var(--primary))' : 'none',
                outlineOffset: '4px'
            }}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
        >
            <Image
                src={prize.imageUrl}
                alt={prize.name}
                layout="fill"
                className="object-contain pointer-events-none"
            />
            <AnimatePresence>
                {isSelected && !isFinalized && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 bg-card p-2 rounded-lg shadow-lg border"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="text-xs font-bold text-center mb-2">{prize.name}</p>
                        <Slider
                            defaultValue={[prize.scale]}
                            min={0.5}
                            max={2.5}
                            step={0.1}
                            onValueChange={(value) => onScaleChange(prize.id, value)}
                        />
                        <Button
                            variant="destructive"
                            size="icon"
                            className="absolute -top-3 -right-3 h-7 w-7"
                            onClick={() => onRemove(prize.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
