"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore } from "@/firebase/hooks";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { usePrizeCart } from "@/hooks/use-prize-cart";
import { motion, useDragControls, PanInfo } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import CompletionDialog from "../CompletionDialog";
import type { Prize } from "@/lib/data";

const DRAGGABLE_AREA_ID = "station-9-canvas";

type PlacedPrize = {
  id: string;
  imageUrl: string;
  name: string;
  x: number;
  y: number;
  stationId: number;
};

// New component for the draggable prize item
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
        <div className="relative w-full h-full" onPointerDown={(e) => controls.start(e)}>
            <Image src={prize.imageUrl} alt={prize.name} fill style={{objectFit: 'contain'}}/>
        </div>
    </motion.div>
  );
}


export default function Station9() {
  const [chosenScenario, setChosenScenario] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [placedPrizes, setPlacedPrizes] = useState<PlacedPrize[]>([]);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  
  const { user } = useUser();
  const db = useFirestore();
  const { prizes: collectedPrizes } = usePrizeCart();
  const collectedPrizesFromStations1to8 = collectedPrizes.filter(p => p.stationId <= 8);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Fetch initial data (scenario and placed prizes)
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
          setPlacedPrizes(data.placedPrizes || []);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlayerData();
  }, [user, db]);

  const handlePrizeDrop = async (prizeId: string, info: any) => {
    if (!canvasRef.current || !user || !db) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const x = info.point.x - canvasRect.left;
    const y = info.point.y - canvasRect.top;

    const prizeData = collectedPrizes.find(p => p.id === prizeId);
    if (!prizeData) return;

    const newPlacedPrize: PlacedPrize = { ...prizeData, x, y };

    const newPlacedPrizes = [
      ...placedPrizes.filter(p => p.id !== prizeId),
      newPlacedPrize,
    ];
    
    setPlacedPrizes(newPlacedPrizes);

    // Save to Firestore
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { placedPrizes: newPlacedPrizes }, { merge: true });
    } catch (error) {
      console.error("Failed to save prize position", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la posición de la insignia.",
        variant: "destructive",
      });
    }
  };
  
  const handleCompleteChallenge = () => {
    setIsCompletionDialogOpen(true);
  }

  const unplacedPrizes = collectedPrizesFromStations1to8.filter(
    p => !placedPrizes.some(pp => pp.id === p.id)
  );
  
  const allPrizesPlaced = collectedPrizesFromStations1to8.length > 0 && 
                          collectedPrizesFromStations1to8.length === placedPrizes.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        Cargando tu estación personalizada...
      </div>
    );
  }

  return (
    <>
      <div className="relative w-screen h-screen overflow-hidden bg-background">
        {/* Canvas Area */}
        <div id={DRAGGABLE_AREA_ID} ref={canvasRef} className="absolute inset-0">
          {chosenScenario ? (
            <Image
              src={chosenScenario}
              alt="Lienzo de estación personalizada"
              fill
              style={{objectFit: 'cover'}}
              className="z-0"
              priority
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
                <p>No se encontró el lienzo. Por favor, vuelve a empezar.</p>
            </div>
          )}

          {/* Placed Prizes */}
          {placedPrizes.map((prize) => (
            <motion.div
              key={prize.id}
              drag
              dragMomentum={false}
              onDragEnd={(event, info) => handlePrizeDrop(prize.id, info)}
              dragConstraints={canvasRef}
              className="absolute w-16 h-16 md:w-20 md:h-20 cursor-grab active:cursor-grabbing z-20"
              style={{ x: prize.x, y: prize.y }}
              initial={{ x: prize.x, y: prize.y }}
            >
              <Image src={prize.imageUrl} alt={prize.name} fill style={{objectFit:'contain'}} />
            </motion.div>
          ))}
        </div>

        {/* Sidebar with unplaced prizes */}
        <div className="absolute top-0 right-0 h-full w-24 md:w-32 bg-black/50 backdrop-blur-sm p-2 z-30 flex flex-col items-center">
            <h3 className="text-white font-bold text-sm mb-2 text-center">Insignias</h3>
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
                    <p className="text-white/70 text-xs text-center pt-4">No tienes más insignias por colocar.</p>
                )}
            </div>
             {allPrizesPlaced && (
                <Button onClick={handleCompleteChallenge} className="mt-4 w-full">
                    Completar Aventura
                </Button>
            )}
        </div>
      </div>
      <CompletionDialog 
        open={isCompletionDialogOpen}
        onOpenChange={setIsCompletionDialogOpen}
      />
    </>
  );
}
