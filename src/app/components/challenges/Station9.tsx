
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, PanInfo } from "framer-motion";
import html2canvas from "html2canvas";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

import { useUser, useFirestore } from "@/firebase";
import { usePrizeCart } from "@/hooks/use-prize-cart";
import { useIsMobile } from "@/hooks/use-mobile";

import CompletionDialog from "../CompletionDialog";
import TypewriterText from "../auth/TypewriterText";
import ResponsiveBackground from "../ResponsiveBackground";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { Check, Download, Pencil, Trash2, Gift, Menu, X } from "lucide-react";
import type { Prize } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";


// Tipos
type PlacedPrize = Prize & {
  x: number;
  y: number;
  scale: number;
  stationId?: number;
};

// Helpers
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const isSpecialPrize = (imageUrl: string) => imageUrl.includes("Molinos.png") || imageUrl.includes("Ciudad.png");
const getBadgeBasePx = (rect: DOMRect) => Math.min(rect.width * 0.08, rect.height * 0.08);

const clampPositionByBadgeSize = (xPercent: number, yPercent: number, rect: DOMRect, scale: number) => {
  const basePx = getBadgeBasePx(rect);
  const badgePx = basePx * (scale || 1);
  const halfWPercent = (badgePx / rect.width) * 50;
  const halfHPercent = (badgePx / rect.height) * 50;
  const x = clamp(xPercent, halfWPercent, 100 - halfWPercent);
  const y = clamp(yPercent, halfHPercent, 100 - halfHPercent);
  return { x, y };
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));


export default function Station9() {
  const isMobile = useIsMobile();
  const { user } = useUser();
  const db = useFirestore();
  const { prizes: collectedPrizes = [] } = usePrizeCart?.() ?? { prizes: [] };

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chosenScenario, setChosenScenario] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("Guardián");
  const [placedPrizes, setPlacedPrizes] = useState<PlacedPrize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);
  const [resizePrizeId, setResizePrizeId] = useState<string | null>(null);
  const [isStationConfirmed, setIsStationConfirmed] = useState(false);
  const [isStationFinalized, setIsStationFinalized] = useState(false);
  const [isYaraVisible, setIsYaraVisible] = useState(false);
  const yaraShowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const yaraHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
        setCanvasRect(canvasRef.current.getBoundingClientRect());
    }
    const handleResize = () => {
        if (canvasRef.current) {
            setCanvasRect(canvasRef.current.getBoundingClientRect());
        }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const scenarioBackgrounds = useMemo(() => {
    if (!chosenScenario) return null;
    const v = chosenScenario;
    const isBosque = v.includes("Bosque_Seco_Tropical") || v.includes("bosque-seco");
    const isCiudad = v.includes("Ciudad_Sostenible") || v.includes("ciudad");
    const isMar = v.includes("Mar_Costero") || v.includes("mar-costero");
    const isManglares = v.includes("Manglares") || v.includes("manglares");

    if (isBosque) return { desktopSrc: "/backgrounds/Terral1366_X_768.png", tabletSrc: "/backgrounds/Terral1024_X_768.png", mobileSrc: "/backgrounds/Terral1075_X_1944.png" };
    if (isCiudad) return { desktopSrc: "/backgrounds/Civika1366_X_768.png", tabletSrc: "/backgrounds/Civika1024_X_768.png", mobileSrc: "/backgrounds/Civika1075_X_1944.png" };
    if (isMar) return { desktopSrc: "/backgrounds/Mareva1366_X_768.png", tabletSrc: "/backgrounds/Mareva1024_X_768.png", mobileSrc: "/backgrounds/Mareva1075_X_1944.png" };
    if (isManglares) return { desktopSrc: "/backgrounds/Manglia1366_X_768.png", tabletSrc: "/backgrounds/Manglia1024_X_768.png", mobileSrc: "/backgrounds/Manglia1075_X_1944.png" };
    return null;
  }, [chosenScenario]);
  
  const [availableCanvases, setAvailableCanvases] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!user || !db) { setIsLoading(false); return; }
      try {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data.chosenScenario) {
            setChosenScenario(data.chosenScenario);
          } else {
            const scenarios = PlaceHolderImages.filter(p => p.id.startsWith('scenario-'));
            setAvailableCanvases(scenarios);
          }
          const fullName = data.playerName || data.usuario || `${data.nombre || ""} ${data.apellido || ""}`.trim();
          setPlayerName(fullName || "Guardián");
          setPlacedPrizes((data.placedPrizes ?? []).map((p: PlacedPrize) => ({ ...p, scale: typeof p.scale === "number" ? p.scale : 1, stationId: p.stationId ?? 9 })));
          const confirmed = !!data.station9Confirmed;
          const finalized = !!data.station9Finalized;
          setIsStationConfirmed(confirmed || finalized);
          setIsStationFinalized(finalized);
        } else {
            const scenarios = PlaceHolderImages.filter(p => p.id.startsWith('scenario-'));
            setAvailableCanvases(scenarios);
        }
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "No se pudo cargar la estación 9.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchPlayerData();
  }, [user, db]);

  useEffect(() => {
    if (isLoading) return;
    if (yaraShowTimerRef.current) clearTimeout(yaraShowTimerRef.current);
    if (yaraHideTimerRef.current) clearTimeout(yaraHideTimerRef.current);
    yaraShowTimerRef.current = setTimeout(() => {
      setIsYaraVisible(true);
      yaraHideTimerRef.current = setTimeout(() => setIsYaraVisible(false), 25000);
    }, 800);
    return () => {
      if (yaraShowTimerRef.current) clearTimeout(yaraShowTimerRef.current);
      if (yaraHideTimerRef.current) clearTimeout(yaraHideTimerRef.current);
    };
  }, [isLoading]);

  const savePrizesToDb = useCallback(async (prizesToSave: PlacedPrize[]) => {
    if (!user || !db) return;
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, { placedPrizes: prizesToSave }, { merge: true });
  }, [user, db]);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<PlacedPrize[] | null>(null);
  const scheduleSave = useCallback((next: PlacedPrize[]) => {
    latestRef.current = next;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const payload = latestRef.current;
      if (payload) savePrizesToDb(payload);
    }, 500);
  }, [savePrizesToDb]);

  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  const addPrizeAtCenter = useCallback((prize: Prize) => {
    if (!canvasRect) return;
    if (isStationConfirmed || isStationFinalized) return;
    const scale = 1;
    const { x, y } = clampPositionByBadgeSize(50, 50, canvasRect, scale);
    const newPlaced: PlacedPrize = { ...prize, x, y, scale, stationId: (prize as any).stationId ?? 9 };
    const updated = [...placedPrizes.filter((p) => p.id !== prize.id), newPlaced];
    setPlacedPrizes(updated);
    scheduleSave(updated);
    setSelectedPrizeId(prize.id);
    setResizePrizeId(null);
    if(isMobile) setIsSidebarOpen(false);
  }, [placedPrizes, scheduleSave, isStationConfirmed, isStationFinalized, isMobile, canvasRect]);

  const movePlacedPrize = useCallback((id: string, info: PanInfo) => {
    if (!canvasRect) return;
    if (isStationConfirmed || isStationFinalized || resizePrizeId !== null) return;
    const current = placedPrizes.find((p) => p.id === id);
    if (!current) return;
    const newXPx = (current.x / 100) * canvasRect.width + info.offset.x;
    const newYPx = (current.y / 100) * canvasRect.height + info.offset.y;
    const rawX = (newXPx / canvasRect.width) * 100;
    const rawY = (newYPx / canvasRect.height) * 100;
    const { x, y } = clampPositionByBadgeSize(rawX, rawY, canvasRect, current.scale || 1);
    const updated = placedPrizes.map((p) => (p.id === id ? { ...p, x, y } : p));
    setPlacedPrizes(updated);
    scheduleSave(updated);
  }, [placedPrizes, scheduleSave, isStationConfirmed, isStationFinalized, resizePrizeId, canvasRect]);

  const closeResize = useCallback(() => {
    setResizePrizeId(null);
  }, []);

  const handleScaleChange = useCallback((id: string, value: number[]) => {
    if (isStationConfirmed || isStationFinalized || resizePrizeId !== id) return;
    const prize = placedPrizes.find((p) => p.id === id);
    if (!prize) return;
    const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;
    const scale = clamp(value[0], 0.5, maxScale);
    setPlacedPrizes((prev) => prev.map((p) => (p.id === id ? { ...p, scale } : p)));
  }, [placedPrizes, resizePrizeId, isStationConfirmed, isStationFinalized]);

  const handleScaleCommit = useCallback((id: string, value: number[]) => {
    if (!canvasRect || isStationConfirmed || isStationFinalized || resizePrizeId !== id) return;
    const prize = placedPrizes.find((p) => p.id === id);
    if (!prize) return;
    const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;
    const scale = clamp(value[0], 0.5, maxScale);
    const { x, y } = clampPositionByBadgeSize(prize.x, prize.y, canvasRect, scale);
    const updated = placedPrizes.map((p) => (p.id === id ? { ...p, x, y, scale } : p));
    setPlacedPrizes(updated);
    scheduleSave(updated);
  }, [placedPrizes, resizePrizeId, scheduleSave, isStationConfirmed, isStationFinalized, canvasRect]);

  const deletePrize = useCallback((id: string) => {
    if (isStationConfirmed || isStationFinalized) return;
    const updated = placedPrizes.filter((p) => p.id !== id);
    setPlacedPrizes(updated);
    scheduleSave(updated);
    if (selectedPrizeId === id) setSelectedPrizeId(null);
    if (resizePrizeId === id) closeResize();
  }, [placedPrizes, scheduleSave, selectedPrizeId, resizePrizeId, closeResize, isStationConfirmed, isStationFinalized]);

  const placedIds = useMemo(() => new Set(placedPrizes.map((p) => p.id)), [placedPrizes]);
  const remainingPrizes = useMemo(() => (Array.isArray(collectedPrizes) ? collectedPrizes : []).filter((p) => !placedIds.has(p.id)), [collectedPrizes, placedIds]);
  const allPlaced = useMemo(() => (Array.isArray(collectedPrizes) ? collectedPrizes : []).length > 0 && remainingPrizes.length === 0, [collectedPrizes, remainingPrizes]);

  const confirmStation = useCallback(async () => {
    if (!user || !db || !allPlaced) { toast({ title: "Faltan insignias", description: "Debes colocar todas las insignias antes de confirmar.", variant: "destructive" }); return; }
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { station9Confirmed: true }, { merge: true });
      setIsStationConfirmed(true);
      setSelectedPrizeId(null);
      closeResize();
      toast({ title: "Estación confirmada", description: "Quedó bloqueada. Puedes descargar o modificar." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo confirmar la estación.", variant: "destructive" });
    }
  }, [user, db, allPlaced, closeResize]);

  const enableModify = useCallback(async () => {
    if (!user || !db || isStationFinalized) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { station9Confirmed: false }, { merge: true });
      setIsStationConfirmed(false);
      toast({ title: "Modo edición", description: "Ya puedes mover y redimensionar." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo habilitar modificar.", variant: "destructive" });
    }
  }, [user, db, isStationFinalized]);

  const handleDownloadImage = useCallback(async () => {
    if (!canvasRef.current || !isStationConfirmed || isStationFinalized) {
      toast({ title: "No se puede descargar", description: "Confirma la estación primero.", variant: "destructive" });
      return;
    }
    setSelectedPrizeId(null);
    closeResize();
    await sleep(200);

    const canvas = await html2canvas(canvasRef.current, { useCORS: true, backgroundColor: null, scale: window.devicePixelRatio || 2 });
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));

    if (!blob) { toast({ title: "Error", description: "No se pudo generar la imagen.", variant: "destructive" }); return; }

    const file = new File([blob], 'estacion-kairu.png', { type: 'image/png' });
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
            await navigator.share({
                title: 'Mi Estación Kairu',
                text: '¡Mira la estación que creé en EcoQuest Explorers!',
                files: [file],
            });
        } catch (error) {
            console.error('Error sharing:', error);
            toast({ title: "Compartir cancelado", description: "No se pudo compartir la imagen.", variant: "default" });
        }
    } else {
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "estacion-kairu.png";
        link.click();
        URL.revokeObjectURL(link.href);
    }
    
    if (user && db) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { station9Finalized: true }, { merge: true });
    }
    setIsStationFinalized(true);
    setIsCompletionDialogOpen(true);
  }, [isStationConfirmed, isStationFinalized, closeResize, user, db]);
  
  const handleSelectCanvas = async (scenario: any) => {
    if (!user || !db) return;
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { chosenScenario: scenario.imageUrl }, { merge: true });
        setChosenScenario(scenario.imageUrl);
        setAvailableCanvases([]);
    } catch (e) {
        console.error("Error saving canvas choice", e);
        toast({ title: "Error", description: "No se pudo guardar tu elección de lienzo.", variant: "destructive" });
    }
  }

  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara-final");

  const sidebarContent = (
    <div className="flex h-full flex-col">
        <SheetHeader className="p-4 border-b">
            <SheetTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5" />
                Insignias Ganadas
            </SheetTitle>
            <SheetDescription className="text-left">
                Colocadas: <b>{placedPrizes.length}</b> / <b>{collectedPrizes.length}</b>
            </SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-3 p-4 overflow-y-auto flex-grow">
            {collectedPrizes.map((prize) => {
                const isPlaced = placedIds.has(prize.id);
                return (
                    <div key={prize.id} className={cn("rounded-lg border p-2", isPlaced && "opacity-50")}>
                        <button type="button" className="w-full" disabled={isPlaced || isStationConfirmed || isStationFinalized} onClick={() => addPrizeAtCenter(prize)}>
                            <div className="relative w-16 h-16 mx-auto">
                                <Image src={prize.imageUrl} alt={prize.name} fill className="object-contain" />
                            </div>
                            <div className="text-[11px] mt-1 text-center line-clamp-2">{prize.name}</div>
                            <div className="text-[10px] text-center mt-1 text-muted-foreground">{isPlaced ? "Colocada" : "Toca para agregar"}</div>
                        </button>
                    </div>
                );
            })}
            {collectedPrizes.length === 0 && <div className="text-xs text-muted-foreground col-span-2">No tienes insignias aún.</div>}
        </div>

        <div className="p-4 border-t mt-auto flex flex-col gap-2">
            {!isStationConfirmed && !isStationFinalized && (
                <Button onClick={confirmStation} disabled={!allPlaced} className="w-full">
                    <Check className="w-4 h-4 mr-2" />
                    Confirmar estación
                </Button>
            )}
            {isStationConfirmed && !isStationFinalized && (
                <>
                    <Button onClick={handleDownloadImage} className="w-full"><Download className="w-4 h-4 mr-2" />Descargar Imagen</Button>
                    <Button onClick={enableModify} variant="secondary" className="w-full"><Pencil className="w-4 h-4 mr-2" />Modificar</Button>
                </>
            )}
            {isStationFinalized && <div className="text-xs text-muted-foreground text-center">Estación finalizada.</div>}
        </div>
    </div>
  );

  if (isLoading) {
    return <div className="w-screen h-screen bg-background flex items-center justify-center">Cargando estación...</div>;
  }

  if (!chosenScenario) {
    return (
        <div className="w-screen h-screen bg-background flex flex-col items-center justify-center p-4">
            <h2 className="text-2xl font-bold mb-4">Elige tu Lienzo Final</h2>
            <p className="text-muted-foreground mb-8">Este será el fondo de tu estación personalizada.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {availableCanvases.map(scenario => (
                    <Card key={scenario.id} onClick={() => handleSelectCanvas(scenario)} className="p-2 cursor-pointer hover:border-primary hover:scale-105 transition-transform duration-300">
                        <Image src={scenario.imageUrl} alt={scenario.description} width={200} height={200} className="rounded-md aspect-square object-cover" />
                        <p className="font-bold mt-2 text-sm">{scenario.imageHint.split(' ')[0]}</p>
                    </Card>
                ))}
            </div>
        </div>
    )
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {isYaraVisible && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[200] w-[92vw] max-w-2xl">
          <Card className="p-3 shadow-lg">
            <div className="flex items-start gap-3">
              {yaraCharImage?.imageUrl && <div className="relative w-12 h-12 shrink-0"><Image src={yaraCharImage.imageUrl} alt="Yara" fill className="object-contain" /></div>}
              <div className="flex-1">
                <TypewriterText text={`¡Felicidades, ${playerName}! Has llegado a tu estación. Coloca todas tus insignias sobre el lienzo. Arrastra para ubicar, y haz doble clic para cambiar el tamaño. Cuando termines, confirma y descarga tu obra maestra.`} />
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="flex w-full h-full">
        <div className="relative flex-1">
          <div ref={canvasRef} className="absolute inset-0 w-full h-full" onClick={() => { setSelectedPrizeId(null); closeResize(); }}>
            <div className="absolute inset-0 z-0 pointer-events-none">
              {scenarioBackgrounds ? <ResponsiveBackground {...scenarioBackgrounds} /> : <div className="w-full h-full bg-muted" />}
            </div>
            <div className="absolute inset-0 z-10">
              {placedPrizes.map((prize) => {
                const isSelected = selectedPrizeId === prize.id;
                const scale = prize.scale || 1;
                const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;
                const isResizeOpen = resizePrizeId === prize.id;
                const canEdit = !isStationConfirmed && !isStationFinalized;

                return (
                  <motion.div
                    key={prize.id}
                    className="absolute"
                    style={{
                      left: `${prize.x}%`,
                      top: `${prize.y}%`,
                      width: `calc(min(8vw, 8vh) * ${scale})`,
                      height: `calc(min(8vw, 8vh) * ${scale})`,
                      transform: "translate(-50%, -50%)",
                      touchAction: "none",
                      cursor: canEdit && !isResizeOpen ? "grab" : "default",
                      zIndex: isSelected ? 120 : 20,
                    }}
                    drag={canEdit && !isResizeOpen}
                    dragMomentum={false}
                    dragConstraints={canvasRef}
                    dragTransition={{ power: 0, timeConstant: 100 }}
                    onDragStart={(e) => {
                      if (!canEdit) return;
                      e.stopPropagation();
                      setSelectedPrizeId(prize.id);
                      setResizePrizeId(null);
                    }}
                    onDragEnd={(e, info) => {
                      if (!canEdit) return;
                      e.stopPropagation();
                      movePlacedPrize(prize.id, info);
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedPrizeId(prize.id); }}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (!canEdit) return;
                      setResizePrizeId(prize.id);
                    }}
                  >
                    <Image src={prize.imageUrl} alt={prize.name} fill className="object-contain" draggable={false} />

                    {canEdit && isResizeOpen && (
                        <div
                            className={cn(
                                "absolute z-[200] p-3 shadow-xl bg-background/80 backdrop-blur-sm rounded-lg",
                                isMobile ? "left-1/2 -translate-x-1/2 bottom-4 w-64" : "left-full ml-2 top-1/2 -translate-y-1/2 w-48"
                            )}
                            onClick={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between gap-2">
                                <Button size="icon" variant="ghost" onClick={() => deletePrize(prize.id)} title="Eliminar"><Trash2 className="w-4 h-4" /></Button>
                            </div>
                            <div className="mt-2"><Slider value={[scale]} min={0.5} max={maxScale} step={0.1} onValueChange={(v) => handleScaleChange(prize.id, v)} onValueCommit={(v) => handleScaleCommit(prize.id, v)} /></div>
                            <div className="mt-2 flex justify-end"><Button size="sm" variant="secondary" onClick={closeResize}>Listo</Button></div>
                        </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {isMobile ? (
             <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="absolute bottom-4 right-4 z-50 rounded-full h-14 w-14 shadow-lg"><Gift /></Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh] p-0 flex flex-col bg-background/90 backdrop-blur-sm">
                    {sidebarContent}
                </SheetContent>
            </Sheet>
        ) : (
          <div className={cn("transition-all duration-300 ease-in-out bg-background/80 backdrop-blur-sm border-l", sidebarOpen ? "w-80" : "w-0 overflow-hidden")}>
             {sidebarOpen && sidebarContent}
          </div>
        )}
         {!isMobile && (
            <Button
                variant="outline"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={cn("absolute top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out z-50", sidebarOpen ? "right-80" : "right-2")}
            >
                {sidebarOpen ? <X/> : <Menu />}
            </Button>
        )}
      </div>
      <CompletionDialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen} />
    </div>
  );
}
