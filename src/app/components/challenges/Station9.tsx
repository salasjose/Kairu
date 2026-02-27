"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useUser, useFirestore } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { usePrizeCart } from "@/hooks/use-prize-cart";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import CompletionDialog from "../CompletionDialog";
import type { Prize } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card } from "@/components/ui/card";
import TypewriterText from "../auth/TypewriterText";
import { Slider } from "@/components/ui/slider";
import { Trash2, Gift, X, Check, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { useIsMobile } from "@/hooks/use-mobile";
import ResponsiveBackground from "../ResponsiveBackground";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------

type PlacedPrize = {
  id: string;
  imageUrl: string;
  name: string;
  x: number; // % ancho
  y: number; // % alto
  scale: number;
  stationId: number;
};

// ------------------------------------------------------------------
// Utils
// ------------------------------------------------------------------

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const isSpecialPrize = (imageUrl: string) =>
  imageUrl.includes("Molinos.png") || imageUrl.includes("Ciudad.png") || imageUrl.includes("Panal.png");

// ------------------------------------------------------------------
// Componente: DraggablePrize (insignia en sidebar)
// ------------------------------------------------------------------

function DraggablePrize({
  prize,
  onDragEnd,
}: {
  prize: Prize;
  onDragEnd: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => void;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            key={prize.id}
            drag
            dragMomentum={false}
            onDragEnd={onDragEnd}
            className="w-full h-full aspect-square bg-white/20 rounded-md p-1 cursor-grab active:cursor-grabbing"
            style={{ touchAction: "none" }}
          >
            <div className="relative w-full h-full">
              <Image
                src={prize.imageUrl}
                alt={prize.name}
                fill
                style={{ objectFit: "contain" }}
              />
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{prize.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ------------------------------------------------------------------
// Componente: ScenarioPicker (selección de lienzo)
// ------------------------------------------------------------------

function ScenarioPicker({
  onScenarioSelect,
}: {
  onScenarioSelect: (scenarioImageUrl: string) => void;
}) {
  const scenarios = useMemo(() => {
    return [
      {
        name: "Terral",
        imageUrl: "/backgrounds/Bosque_Seco_Tropical.png",
      },
      {
        name: "Civika",
        imageUrl: "/backgrounds/Ciudad_Sostenible.png",
      },
      {
        name: "Mareva",
        imageUrl: "/backgrounds/Mar_Costero.png",
      },
      {
        name: "Manglia",
        imageUrl: "/backgrounds/Manglares.png",
      },
    ];
  }, []);

  return (
    <div className="w-full h-full bg-background/80 backdrop-blur-sm flex items-center justify-center p-8 text-center">
      <Card className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold text-primary mb-4">Elige tu Lienzo</h2>
        <p className="text-muted-foreground mb-6">
          Por favor, selecciona un lienzo para crear tu estación personalizada.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {scenarios.map((scenario) => (
            <Card
              key={scenario.imageUrl}
              onClick={() => onScenarioSelect(scenario.imageUrl)}
              className="p-2 cursor-pointer hover:border-primary hover:scale-105 transition-transform duration-300"
            >
              <div className="relative aspect-square w-full mb-2">
                <Image
                  src={scenario.imageUrl}
                  alt={scenario.name}
                  fill
                  className="rounded-md object-cover"
                />
              </div>
              <p className="font-bold text-sm">{scenario.name}</p>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------
// Componente principal: Station9
// ------------------------------------------------------------------

export default function Station9() {
  const [chosenScenario, setChosenScenario] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [placedPrizes, setPlacedPrizes] = useState<PlacedPrize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);
  const [resizePrizeId, setResizePrizeId] = useState<string | null>(null);

  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isYaraMessageVisible, setIsYaraMessageVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isStationConfirmed, setIsStationConfirmed] = useState(false);
  const [isStationFinalized, setIsStationFinalized] = useState(false);

  const { user } = useUser();
  const db = useFirestore();
  const { prizes: collectedPrizes } = usePrizeCart();

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara-final");
  const yaraTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  // ------------------------------------------------------------------
  // Fondos según lienzo escogido y dispositivo
  // ------------------------------------------------------------------

  const scenarioBackgrounds = useMemo(() => {
    if (!chosenScenario) return null;

    if (chosenScenario.includes("Bosque_Seco_Tropical")) {
      return {
        desktopSrc: "/backgrounds/Terral1366_X_768.png",
        tabletSrc: "/backgrounds/Terral1024_X_768.png",
        mobileSrc: "/backgrounds/Terral1075_X_1944.png",
      };
    }
    if (chosenScenario.includes("Ciudad_Sostenible")) {
      return {
        desktopSrc: "/backgrounds/Civika1366_X_768.png",
        tabletSrc: "/backgrounds/Civika1024_X_768.png",
        mobileSrc: "/backgrounds/Civika1075_X_1944.png",
      };
    }
    if (chosenScenario.includes("Mar_Costero")) {
      return {
        desktopSrc: "/backgrounds/Mareva1366_X_768.png",
        tabletSrc: "/backgrounds/Mareva1024_X_768.png",
        mobileSrc: "/backgrounds/Mareva1075_X_1944.png",
      };
    }
    if (chosenScenario.includes("Manglares")) {
      return {
        desktopSrc: "/backgrounds/Manglia1366_X_768.png",
        tabletSrc: "/backgrounds/Manglia1024_X_768.png",
        mobileSrc: "/backgrounds/Manglia1075_X_1944.png",
      };
    }
    return null;
  }, [chosenScenario]);

  // ------------------------------------------------------------------
  // Carga de datos
  // ------------------------------------------------------------------

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!user || !db) {
        setIsLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          setChosenScenario(data.chosenScenario || null);
          setPlacedPrizes(data.placedPrizes || []);
          setPlayerName(data.nombre || data.usuario || "Guardián");
          setIsStationConfirmed(data.station9Confirmed || false);
          setIsStationFinalized(data.station9Finalized || false);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlayerData();
  }, [user, db]);

  // ------------------------------------------------------------------
  // Yara
  // ------------------------------------------------------------------

  const scheduleYaraDialog = useCallback(() => {
    if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    if (!chosenScenario) return;

    const showTimer = setTimeout(() => {
      setIsYaraMessageVisible(true);
      const hideTimer = setTimeout(() => setIsYaraMessageVisible(false), 25000);
      yaraTimerRef.current = hideTimer;
    }, 1000);

    yaraTimerRef.current = showTimer;
  }, [chosenScenario]);

  useEffect(() => {
    if (!isLoading) scheduleYaraDialog();
    return () => {
      if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    };
  }, [isLoading, scheduleYaraDialog]);

  // ------------------------------------------------------------------
  // Guardado
  // ------------------------------------------------------------------

  const savePrizesToDb = useCallback(
    async (prizesToSave: PlacedPrize[]) => {
      if (!user || !db) return;
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { placedPrizes: prizesToSave }, { merge: true });
      } catch (error) {
        console.error("Failed to save prize position", error);
      }
    },
    [user, db]
  );

  // ------------------------------------------------------------------
  // Arrastre desde Sidebar
  // ------------------------------------------------------------------

  const handlePrizeDrop = async (prizeId: string, info: PanInfo) => {
    if (isStationConfirmed || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    let x = ((info.point.x - canvasRect.left) / canvasRect.width) * 100;
    let y = ((info.point.y - canvasRect.top) / canvasRect.height) * 100;

    if (x < 0 || x > 100 || y < 0 || y > 100) return;

    x = clamp(x, 5, 95);
    y = clamp(y, 5, 95);

    const prizeData = collectedPrizes.find((p) => p.id === prizeId);
    if (!prizeData) return;

    const newPlacedPrize: PlacedPrize = {
      id: prizeData.id,
      imageUrl: prizeData.imageUrl,
      name: prizeData.name,
      x,
      y,
      scale: 1,
      stationId: prizeData.stationId,
    };

    const newPlacedPrizes = [
      ...placedPrizes.filter((p) => p.id !== prizeId),
      newPlacedPrize,
    ];

    setPlacedPrizes(newPlacedPrizes);
    await savePrizesToDb(newPlacedPrizes);
  };

  // ------------------------------------------------------------------
  // Escala
  // ------------------------------------------------------------------

  const handleScaleChange = (prizeId: string, newScale: number[]) => {
    if (isStationConfirmed) return;
    const prize = placedPrizes.find((p) => p.id === prizeId);
    if (!prize) return;

    const scale = clamp(newScale[0], 0.5, isSpecialPrize(prize.imageUrl) ? 7 : 5);
    const updated = placedPrizes.map((p) => (p.id === prizeId ? { ...p, scale } : p));
    setPlacedPrizes(updated);
  };

  const handleScaleChangeCommit = async (prizeId: string, newScale: number[]) => {
    if (isStationConfirmed) return;
    const prize = placedPrizes.find((p) => p.id === prizeId);
    if (!prize) return;

    const scale = clamp(newScale[0], 0.5, isSpecialPrize(prize.imageUrl) ? 7 : 5);
    const updated = placedPrizes.map((p) => (p.id === prizeId ? { ...p, scale } : p));
    setPlacedPrizes(updated);
    await savePrizesToDb(updated);
  };

  // ------------------------------------------------------------------
  // Eliminar
  // ------------------------------------------------------------------

  const handleDeletePrize = async (prizeId: string) => {
    if (isStationConfirmed) return;
    const updated = placedPrizes.filter((p) => p.id !== prizeId);
    setPlacedPrizes(updated);
    await savePrizesToDb(updated);
    setResizePrizeId(null);
    setSelectedPrizeId(null);
  };

  // ------------------------------------------------------------------
  // Acciones Estación
  // ------------------------------------------------------------------

  const handleSaveStation = async () => {
    if (!user || !db) return;
    if (collectedPrizes.length === 0) {
      toast({ title: "Sin insignias", description: "No has ganado insignias aún.", variant: "destructive" });
      return;
    }
    const unplaced = collectedPrizes.filter((p) => !placedPrizes.some((pp) => pp.id === p.id));
    if (unplaced.length > 0) {
      toast({ title: "Insignias incompletas", description: `Te faltan ${unplaced.length} insignia(s) por colocar.`, variant: "destructive" });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { station9Confirmed: true }, { merge: true });
      setIsStationConfirmed(true);
      setSelectedPrizeId(null);
      setResizePrizeId(null);
      toast({ title: "Estación confirmada", description: "Insignias bloqueadas. Puedes descargar la foto." });
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnlockStation = async () => {
    if (!user || !db || isStationFinalized) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { station9Confirmed: false }, { merge: true });
      setIsStationConfirmed(false);
      toast({ title: "Modo edición", description: "Ahora puedes mover y escalar tus insignias." });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadImage = async () => {
    if (!canvasRef.current || !isStationConfirmed) return;
    try {
      setSelectedPrizeId(null);
      setResizePrizeId(null);
      await new Promise((r) => setTimeout(r, 300));

      const capture = await html2canvas(canvasRef.current, { useCORS: true, backgroundColor: null });
      
      if (isMobile && navigator.canShare && navigator.canShare({ files: [new File([], '')] })) {
        capture.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], "mi-estacion-kairu.png", { type: "image/png" });
            try {
              await navigator.share({ files: [file], title: "Mi Estación Kairu" });
              finalizeDownload();
            } catch (e) {}
          }
        });
      } else {
        const link = document.createElement("a");
        link.href = capture.toDataURL("image/png");
        link.download = "mi-estacion-kairu.png";
        link.click();
        finalizeDownload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const finalizeDownload = async () => {
    if (!user || !db) return;
    await setDoc(doc(db, "users", user.uid), { station9Finalized: true }, { merge: true });
    setIsStationFinalized(true);
    setTimeout(() => setIsCompletionDialogOpen(true), 1000);
  };

  // ------------------------------------------------------------------
  // Auxiliares para Sidebar
  // ------------------------------------------------------------------

  const unplacedPrizes = useMemo(
    () => collectedPrizes.filter((p) => !placedPrizes.some((pp) => pp.id === p.id)),
    [collectedPrizes, placedPrizes]
  );

  const allPrizesPlaced = collectedPrizes.length > 0 && unplacedPrizes.length === 0;

  const SidebarContent = () => (
    <>
      <div className="flex-grow w-full overflow-x-auto md:overflow-y-auto">
        <div className="flex flex-row md:flex-col gap-2 p-1">
          {unplacedPrizes.map((prize) => (
            <div key={prize.id} className="w-20 h-20 md:w-full aspect-square shrink-0">
              <DraggablePrize prize={prize} onDragEnd={(e, info) => handlePrizeDrop(prize.id, info)} />
            </div>
          ))}
        </div>
      </div>
      <div className="w-full mt-auto flex flex-row md:flex-col gap-2 p-1">
        {!isStationConfirmed && allPrizesPlaced && (
          <Button onClick={handleSaveStation} className="flex-1 text-xs" size="sm">Confirmar</Button>
        )}
        {isStationConfirmed && !isStationFinalized && (
          <Button onClick={handleUnlockStation} className="flex-1 text-xs" variant="outline" size="sm">Modificar</Button>
        )}
        <Button onClick={handleDownloadImage} disabled={!isStationConfirmed} className="flex-1 text-xs" size="sm">Descargar</Button>
      </div>
    </>
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  if (isLoading) return <div className="flex items-center justify-center h-screen">Cargando estación...</div>;
  if (!chosenScenario) return <ScenarioPicker onScenarioSelect={async (url) => {
    if (user && db) {
      await setDoc(doc(db, "users", user.uid), { chosenScenario: url }, { merge: true });
      setChosenScenario(url);
    }
  }} />;

  const yaraMessageFinal = `${playerName}, ¡Ya eres un Guardián! Mueve tus insignias por el lienzo arrastrándolas. Haz doble clic en ellas para ajustar su tamaño. ¡Crea tu estación ideal!`;

  return (
    <div className="relative w-screen h-screen bg-background overflow-hidden" onClick={() => { setSelectedPrizeId(null); setResizePrizeId(null); }}>
      <div ref={canvasRef} className="absolute inset-0 z-10">
        {scenarioBackgrounds && (
          <ResponsiveBackground desktopSrc={scenarioBackgrounds.desktopSrc} tabletSrc={scenarioBackgrounds.tabletSrc} mobileSrc={scenarioBackgrounds.mobileSrc} />
        )}
        <div className="absolute inset-0 z-10">
          {placedPrizes.map((prize) => {
            const isResizing = resizePrizeId === prize.id;
            return (
              <motion.div
                key={prize.id}
                drag={!isStationConfirmed && !isResizing}
                dragMomentum={false}
                dragElastic={0}
                onDragStart={() => { setSelectedPrizeId(prize.id); setResizePrizeId(null); }}
                onDragEnd={async (e, info) => {
                  if (isStationConfirmed || !canvasRef.current) return;
                  const rect = canvasRef.current.getBoundingClientRect();
                  
                  // Calcular nueva posición absoluta en píxeles y convertir a %
                  const currentXPx = (prize.x / 100) * rect.width;
                  const currentYPx = (prize.y / 100) * rect.height;
                  
                  let newX = ((currentXPx + info.offset.x) / rect.width) * 100;
                  let newY = ((currentYPx + info.offset.y) / rect.height) * 100;
                  
                  newX = clamp(newX, 5, 95); 
                  newY = clamp(newY, 5, 95);
                  
                  const updated = placedPrizes.map((p) => p.id === prize.id ? { ...p, x: newX, y: newY } : p);
                  setPlacedPrizes(updated);
                  await savePrizesToDb(updated);
                }}
                className="placed-prize-wrapper absolute"
                style={{
                  left: `${prize.x}%`, top: `${prize.y}%`,
                  width: `calc(min(8vw, 8vh) * ${prize.scale || 1})`,
                  height: `calc(min(8vw, 8vh) * ${prize.scale || 1})`,
                  transform: "translate(-50%, -50%)", touchAction: "none",
                  cursor: isStationConfirmed || isResizing ? "default" : "grab",
                }}
                animate={{ boxShadow: selectedPrizeId === prize.id ? "0px 0px 15px rgba(255,255,100,0.8)" : "none", zIndex: selectedPrizeId === prize.id ? 40 : 20 }}
                onClick={(e) => { e.stopPropagation(); setSelectedPrizeId(prize.id); }}
                onDoubleClick={(e) => { if (!isStationConfirmed) { e.stopPropagation(); setResizePrizeId(prize.id); setSelectedPrizeId(prize.id); } }}
              >
                <div className="w-full h-full relative select-none">
                  <Image src={prize.imageUrl} alt={prize.name} fill style={{ objectFit: "contain" }} draggable={false} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild><Button className="absolute bottom-4 left-4 z-40 bg-black/70 text-white">Insignias</Button></SheetTrigger>
          <SheetContent side="bottom" className="h-[40vh] bg-black/70 border-t-2 border-white/20 text-white">
            <SheetHeader><SheetTitle className="text-white sr-only">Tus Insignias</SheetTitle></SheetHeader>
            <div className="h-full flex flex-col pt-2"><SidebarContent /></div>
          </SheetContent>
        </Sheet>
      ) : (
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div className="absolute z-30 bg-black/60 p-2 right-0 top-0 h-full w-32 flex flex-col" initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}>
              <h3 className="text-white font-bold text-sm mb-2 text-center mt-12">Insignias</h3>
              <SidebarContent />
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {resizePrizeId && !isStationConfirmed && (
        <div className={`fixed z-50 max-w-md w-[90vw] bg-background/95 p-3 rounded-xl shadow-xl flex items-center gap-3 ${isMobile ? 'left-1/2 bottom-4 -translate-x-1/2' : 'top-4 left-4'}`} onClick={(e) => e.stopPropagation()}>
          {(() => {
            const p = placedPrizes.find(p => p.id === resizePrizeId);
            if (!p) return null;
            return (
              <>
                <div className="w-10 h-10 relative shrink-0"><Image src={p.imageUrl} alt={p.name} fill style={{ objectFit: "contain" }} /></div>
                <Slider value={[p.scale || 1]} min={0.5} max={isSpecialPrize(p.imageUrl) ? 7 : 5} step={0.1} onValueChange={(v) => handleScaleChange(p.id, v)} onValueCommit={(v) => handleScaleChangeCommit(p.id, v)} className="flex-1" />
                <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => handleDeletePrize(p.id)}><Trash2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setResizePrizeId(null)}><X className="h-4 w-4" /></Button>
              </>
            );
          })()}
        </div>
      )}

      <AnimatePresence>
        {isYaraMessageVisible && yaraCharImage && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setIsYaraMessageVisible(false)}>
            <div className="relative flex flex-col md:flex-row items-center gap-4 max-w-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="w-32 h-auto md:w-48 shrink-0"><Image src={yaraCharImage.imageUrl} alt="Yara" width={150} height={187} className="h-auto w-full" /></div>
              <div className="w-full"><Card className="p-4 shadow-lg bg-white/95 relative">
                <TypewriterText text={yaraMessageFinal} className="text-base text-primary font-medium" />
                <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 md:left-auto md:right-[-10px] md:top-1/2 md:-translate-y-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white/95 md:border-l-[10px] md:border-l-white/95" />
              </Card></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <CompletionDialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen} />
    </div>
  );
}
