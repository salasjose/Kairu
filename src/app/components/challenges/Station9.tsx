
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
import { Trash2, Gift, X, Check, Download, Move, Minus, Plus } from "lucide-react";
import html2canvas from "html2canvas";
import { useIsMobile } from "@/hooks/use-mobile";
import ResponsiveBackground from "../ResponsiveBackground";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ------------------------------------------------------------------
// Tipos y Utilidades
// ------------------------------------------------------------------

type PlacedPrize = {
  id: string;
  imageUrl: string;
  name: string;
  nx: number; // Normalizado 0..1
  ny: number; // Normalizado 0..1
  scale: number;
  stationId: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const isSpecialPrize = (imageUrl: string) =>
  imageUrl.includes("Molinos.png") || imageUrl.includes("Ciudad.png") || imageUrl.includes("Panal.png");

const getDynamicMarginNorm = (scale: number) => clamp(0.05 + (scale * 0.02), 0.05, 0.2);

const clampNormByMargin = (nx: number, ny: number, scale: number) => {
  const margin = getDynamicMarginNorm(scale);
  return {
    nx: clamp(nx, margin, 1 - margin),
    ny: clamp(ny, margin, 1 - margin),
  };
};

// ------------------------------------------------------------------
// Componentes Auxiliares
// ------------------------------------------------------------------

function DraggablePrize({ prize, onDragEnd }: { prize: Prize; onDragEnd: (event: any, info: PanInfo) => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          key={prize.id}
          drag
          dragMomentum={false}
          onDragEnd={onDragEnd}
          className="w-full h-full aspect-square bg-white/10 backdrop-blur-md rounded-md p-1 cursor-grab active:cursor-grabbing border border-white/20"
          style={{ touchAction: "none" }}
        >
          <div className="relative w-full h-full">
            <Image src={prize.imageUrl} alt={prize.name} fill style={{ objectFit: "contain" }} />
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top"><p>{prize.name}</p></TooltipContent>
    </Tooltip>
  );
}

function ScenarioPicker({ onScenarioSelect }: { onScenarioSelect: (url: string) => void }) {
  const scenarios = useMemo(() => [
    { name: "Terral", ...PlaceHolderImages.find(p => p.id === 'scenario-bosque-seco') },
    { name: "Civika", ...PlaceHolderImages.find(p => p.id === 'scenario-ciudad') },
    { name: "Mareva", ...PlaceHolderImages.find(p => p.id === 'scenario-mar-costero') },
    { name: "Manglia", ...PlaceHolderImages.find(p => p.id === 'scenario-manglares') },
  ].filter(s => s.imageUrl), []);

  return (
    <div className="w-full h-full bg-background/80 backdrop-blur-sm flex items-center justify-center p-8 text-center">
      <Card className="p-8 max-w-4xl shadow-2xl">
        <h2 className="text-3xl font-bold text-primary mb-4">Elige tu Lienzo</h2>
        <p className="text-muted-foreground mb-8 text-lg">Selecciona el ambiente donde construirás tu estación ideal.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {scenarios.map((scenario: any) => (
            <button
              key={scenario.imageUrl}
              onClick={() => onScenarioSelect(scenario.imageUrl)}
              className="flex flex-col items-center group"
            >
              <div className="relative w-full aspect-square rounded-xl overflow-hidden border-4 border-transparent group-hover:border-primary transition-all shadow-lg">
                <Image src={scenario.imageUrl} alt={scenario.name} fill className="object-cover" />
              </div>
              <p className="font-bold mt-3 text-primary group-hover:scale-110 transition-transform">{scenario.name}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ------------------------------------------------------------------
// Componente Principal
// ------------------------------------------------------------------

export default function Station9() {
  const [chosenScenario, setChosenScenario] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [placedPrizes, setPlacedPrizes] = useState<PlacedPrize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);
  const [resizePrizeId, setResizePrizeId] = useState<string | null>(null);
  const [isStationConfirmed, setIsStationConfirmed] = useState(false);
  const [isStationFinalized, setIsStationFinalized] = useState(false);
  const [isYaraMessageVisible, setIsYaraMessageVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);

  const { user } = useUser();
  const db = useFirestore();
  const { prizes: collectedPrizes } = usePrizeCart();
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const yaraTimerRef = useRef<any>(null);

  // 1. Carga de datos
  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!user || !db) { setIsLoading(false); return; }
      try {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data();
          setChosenScenario(data.chosenScenario || null);
          setPlayerName(data.nombre || data.usuario || "Guardián");
          setIsStationConfirmed(!!data.station9Confirmed);
          setIsStationFinalized(!!data.station9Finalized);
          setPlacedPrizes(data.placedPrizes || []);
        }
      } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };
    fetchPlayerData();
  }, [user, db]);

  // 2. Yara Logic
  useEffect(() => {
    if (!isLoading && chosenScenario) {
      yaraTimerRef.current = setTimeout(() => {
        setIsYaraMessageVisible(true);
        setTimeout(() => setIsYaraMessageVisible(false), 25000);
      }, 1000);
    }
    return () => clearTimeout(yaraTimerRef.current);
  }, [isLoading, chosenScenario]);

  // 3. Memos para estado de insignias
  const unplacedPrizes = useMemo(() => 
    collectedPrizes.filter(p => !placedPrizes.some(pp => pp.id === p.id)),
    [collectedPrizes, placedPrizes]
  );

  const allPrizesPlaced = useMemo(() => 
    collectedPrizes.length > 0 && unplacedPrizes.length === 0,
    [collectedPrizes, unplacedPrizes]
  );

  // 4. Handlers
  const savePrizesToDb = useCallback(async (prizes: PlacedPrize[]) => {
    if (!user || !db) return;
    await setDoc(doc(db, "users", user.uid), { placedPrizes: prizes }, { merge: true });
  }, [user, db]);

  const handlePrizeDrop = async (prizeId: string, info: PanInfo) => {
    if (isStationConfirmed || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const nx = (info.point.x - rect.left) / rect.width;
    const ny = (info.point.y - rect.top) / rect.height;
    if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return;

    const prizeData = collectedPrizes.find(p => p.id === prizeId);
    if (!prizeData) return;

    const clamped = clampNormByMargin(nx, ny, 1);
    const newPrize: PlacedPrize = { ...prizeData, nx: clamped.nx, ny: clamped.ny, scale: 1, stationId: 9 };
    const newList = [...placedPrizes.filter(p => p.id !== prizeId), newPrize];
    setPlacedPrizes(newList);
    await savePrizesToDb(newList);
  };

  const handleScaleChange = (prizeId: string, value: number[]) => {
    const prize = placedPrizes.find(p => p.id === prizeId);
    if (!prize) return;
    const clamped = clampNormByMargin(prize.nx, prize.ny, value[0]);
    const updated = placedPrizes.map(p => p.id === prizeId ? { ...p, scale: value[0], nx: clamped.nx, ny: clamped.ny } : p);
    setPlacedPrizes(updated);
  };

  const handleDeletePrize = async (prizeId: string) => {
    const newList = placedPrizes.filter(p => p.id !== prizeId);
    setPlacedPrizes(newList);
    await savePrizesToDb(newList);
    setSelectedPrizeId(null);
    setResizePrizeId(null);
  };

  const handleSaveStation = async () => {
    if (!user || !db) return;
    await setDoc(doc(db, "users", user.uid), { station9Confirmed: true }, { merge: true });
    setIsStationConfirmed(true);
    setResizePrizeId(null);
    toast({ title: "Estación Confirmada", description: "Tu creación ha sido bloqueada. Ahora puedes descargarla." });
  };

  const handleUnlockStation = async () => {
    if (isStationFinalized) return;
    if (!user || !db) return;
    await setDoc(doc(db, "users", user.uid), { station9Confirmed: false }, { merge: true });
    setIsStationConfirmed(false);
    toast({ title: "Modo Edición", description: "Puedes volver a mover tus insignias." });
  };

  const handleDownloadImage = async () => {
    if (!canvasRef.current) return;
    setSelectedPrizeId(null);
    setResizePrizeId(null);
    await new Promise(r => setTimeout(r, 300));

    try {
      const canvas = await html2canvas(canvasRef.current, { useCORS: true, backgroundColor: null, scale: 2 });
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], "mi-estacion-kairu.png", { type: "image/png" });
        if (isMobile && navigator.share) {
          await navigator.share({ files: [file], title: 'Mi Estación Kairu' });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = "mi-estacion-kairu.png"; a.click();
        }
        await setDoc(doc(db!, "users", user!.uid), { station9Finalized: true }, { merge: true });
        setIsStationFinalized(true);
        setIsCompletionDialogOpen(true);
      });
    } catch (e) { console.error(e); }
  };

  // 5. Sidebar UI
  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex-grow overflow-y-auto p-2">
        <div className="grid grid-cols-1 gap-3">
          {unplacedPrizes.map(p => (
            <div key={p.id} className="aspect-square w-full">
              <DraggablePrize prize={p} onDragEnd={(e, i) => handlePrizeDrop(p.id, i)} />
            </div>
          ))}
          {unplacedPrizes.length === 0 && collectedPrizes.length > 0 && (
            <p className="text-white/60 text-xs text-center italic mt-4">¡Todas colocadas!</p>
          )}
        </div>
      </div>
      <div className="p-3 border-t border-white/10 bg-black/20 space-y-2">
        {!isStationConfirmed && allPrizesPlaced && (
          <Button onClick={handleSaveStation} className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg" size="sm">
            <Check className="mr-2 h-4 w-4" /> Confirmar
          </Button>
        )}
        {isStationConfirmed && !isStationFinalized && (
          <Button onClick={handleUnlockStation} variant="outline" className="w-full bg-white/10 text-white border-white/20" size="sm">
            Modificar
          </Button>
        )}
        <Button onClick={handleDownloadImage} disabled={!isStationConfirmed} variant={isStationFinalized ? "secondary" : "default"} className="w-full shadow-lg" size="sm">
          <Download className="mr-2 h-4 w-4" /> Descargar
        </Button>
      </div>
    </div>
  );

  // 6. Background Mapping
  const scenarioBG = useMemo(() => {
    if (!chosenScenario) return null;
    if (chosenScenario.includes("Bosque") || chosenScenario.includes("seco")) return { d: "/backgrounds/Terral1366_X_768.png", t: "/backgrounds/Terral1024_X_768.png", m: "/backgrounds/Terral1075_X_1944.png" };
    if (chosenScenario.includes("Ciudad") || chosenScenario.includes("Civika")) return { d: "/backgrounds/Civika1366_X_768.png", t: "/backgrounds/Civika1024_X_768.png", m: "/backgrounds/Civika1075_X_1944.png" };
    if (chosenScenario.includes("Mar") || chosenScenario.includes("Mareva")) return { d: "/backgrounds/Mareva1366_X_768.png", t: "/backgrounds/Mareva1024_X_768.png", m: "/backgrounds/Mareva1075_X_1944.png" };
    if (chosenScenario.includes("Manglares") || chosenScenario.includes("Manglia")) return { d: "/backgrounds/Manglia1366_X_768.png", t: "/backgrounds/Manglia1024_X_768.png", m: "/backgrounds/Manglia1075_X_1944.png" };
    return null;
  }, [chosenScenario]);

  if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-background">Cargando...</div>;
  if (!chosenScenario) return <ScenarioPicker onScenarioSelect={(url) => setDoc(doc(db!, "users", user!.uid), { chosenScenario: url }, { merge: true }).then(() => setChosenScenario(url))} />;

  return (
    <TooltipProvider>
      <div className="relative w-screen h-screen bg-black overflow-hidden" onClick={() => { setSelectedPrizeId(null); setResizePrizeId(null); }}>
        
        {/* Lienzo */}
        <div ref={canvasRef} className="absolute inset-0 z-10">
          {scenarioBG && <ResponsiveBackground desktopSrc={scenarioBG.d} tabletSrc={scenarioBG.t} mobileSrc={scenarioBG.m} />}
          
          <div className="absolute inset-0 z-20 pointer-events-none">
            {placedPrizes.map(p => {
              const isSelected = selectedPrizeId === p.id;
              const isEditing = resizePrizeId === p.id;
              return (
                <motion.div
                  key={p.id}
                  drag={!isStationConfirmed && !isEditing}
                  dragMomentum={false}
                  dragConstraints={canvasRef}
                  onDragStart={() => { setSelectedPrizeId(p.id); setResizePrizeId(null); }}
                  onDragEnd={async (e, i) => {
                    if (isStationConfirmed || !canvasRef.current) return;
                    const rect = canvasRef.current.getBoundingClientRect();
                    const nx = (i.point.x - rect.left) / rect.width;
                    const ny = (i.point.y - rect.top) / rect.height;
                    const cl = clampNormByMargin(nx, ny, p.scale);
                    const updated = placedPrizes.map(item => item.id === p.id ? { ...item, nx: cl.nx, ny: cl.ny } : item);
                    setPlacedPrizes(updated);
                    await savePrizesToDb(updated);
                  }}
                  className="absolute pointer-events-auto cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${p.nx * 100}%`, top: `${p.ny * 100}%`,
                    width: `calc(min(10vw, 10vh) * ${p.scale})`,
                    height: `calc(min(10vw, 10vh) * ${p.scale})`,
                    transform: "translate(-50%, -50%)",
                    touchAction: "none"
                  }}
                  animate={{ boxShadow: isSelected ? "0 0 20px rgba(255,255,255,0.6)" : "none", scale: isSelected ? 1.05 : 1, zIndex: isSelected ? 50 : 20 }}
                  onClick={(e) => { e.stopPropagation(); setSelectedPrizeId(p.id); }}
                  onDoubleClick={(e) => { e.stopPropagation(); setSelectedPrizeId(p.id); setResizePrizeId(p.id); }}
                >
                  <div className="w-full h-full relative select-none">
                    <Image src={p.imageUrl} alt={p.name} fill style={{ objectFit: "contain" }} draggable={false} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Sidebar / Sheet */}
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button className="absolute bottom-6 left-6 z-40 bg-black/60 backdrop-blur-md text-white border border-white/20 rounded-full shadow-2xl">
                <Gift className="mr-2 h-5 w-5" /> Insignias
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[45vh] bg-black/80 backdrop-blur-xl border-t border-white/20 text-white rounded-t-3xl">
              <SheetHeader><SheetTitle className="text-white text-center">Tus Recompensas</SheetTitle></SheetHeader>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        ) : (
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                initial={{ x: 300 }} animate={{ x: 0 }} exit={{ x: 300 }}
                className="absolute right-0 top-0 h-full w-28 bg-black/40 backdrop-blur-md border-l border-white/10 z-30 pt-16"
              >
                <SidebarContent />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Editor de Tamaño */}
        {resizePrizeId && !isStationConfirmed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`fixed z-50 p-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border flex items-center gap-4 min-w-[300px] ${isMobile ? 'bottom-6 left-6 right-6' : 'top-20 left-6'}`}
            onClick={e => e.stopPropagation()}
          >
            {(() => {
              const p = placedPrizes.find(item => item.id === resizePrizeId);
              if (!p) return null;
              return (
                <>
                  <div className="w-12 h-12 relative flex-shrink-0"><Image src={p.imageUrl} alt={p.name} fill style={{ objectFit: "contain" }} /></div>
                  <div className="flex-grow flex items-center gap-2">
                    <Minus className="h-4 w-4 text-muted-foreground" />
                    <Slider value={[p.scale]} min={0.5} max={isSpecialPrize(p.imageUrl) ? 7 : 4} step={0.1} onValueChange={v => handleScaleChange(p.id, v)} onValueCommit={v => savePrizesToDb(placedPrizes)} />
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <Button variant="destructive" size="icon" onClick={() => handleDeletePrize(p.id)} className="rounded-full"><Trash2 className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => setResizePrizeId(null)} className="rounded-full"><X className="h-4 w-4" /></Button>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* Yara Dialog */}
        <AnimatePresence>
          {isYaraMessageVisible && yaraCharImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm pointer-events-none"
            >
              <div className="relative flex flex-col md:flex-row items-center gap-6 max-w-2xl pointer-events-auto">
                <div className="w-32 md:w-48 shrink-0"><Image src={yaraCharImage.imageUrl} alt="Yara" width={200} height={250} className="drop-shadow-2xl" /></div>
                <Card className="p-6 bg-white/95 shadow-2xl relative border-none rounded-3xl">
                  <TypewriterText text={`${playerName}, ¡Ya eres un Guardián! Mueve tus insignias por el lienzo arrastrándolas desde la barra lateral. ¡Haz que esta estación sea única!`} className="text-lg text-primary font-medium leading-relaxed" />
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 md:left-auto md:-right-3 md:top-1/2 md:-translate-y-1/2 w-0 h-0 border-8 border-transparent border-t-white/95 md:border-l-white/95 md:border-t-transparent" />
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CompletionDialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen} />
      </div>
    </TooltipProvider>
  );
}
