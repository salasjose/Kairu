
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { motion, PanInfo, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { toast } from "@/hooks/use-toast";

import { useUser, useFirestore } from "@/firebase";
import { usePrizeCart } from "@/hooks/use-prize-cart";
import { useIsMobile } from "@/hooks/use-mobile";

import CompletionDialog from "../CompletionDialog";
import TypewriterText from "../auth/TypewriterText";
import ResponsiveBackground from "../ResponsiveBackground";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { Check, Download, Pencil, Trash2, Gift, PanelRightClose, PanelRightOpen, X } from "lucide-react";
import type { Prize } from "@/lib/data";
import { PlaceHolderImages } from "@/lib/placeholder-images";

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------

type PlacedPrize = Prize & {
  x: number; // porcentaje (0-100)
  y: number; // porcentaje (0-100)
  scale: number; // 0.5 - max
  stationId?: number;
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const isSpecialPrize = (imageUrl: string) =>
  imageUrl.includes("Molinos.png") || imageUrl.includes("Ciudad.png");

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

// ------------------------------------------------------------------
// Station9
// ------------------------------------------------------------------

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

  // State for responsive sidebar
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarInitializedRef = useRef(false);

  const scenarioBackgrounds = useMemo(() => {
    if (!chosenScenario) return null;

    const v = chosenScenario;

    const isBosque =
      v.includes("Bosque_Seco_Tropical") || v.includes("bosque-seco") || v.includes("scenario-bosque-seco");
    const isCiudad =
      v.includes("Ciudad_Sostenible") || v.includes("ciudad") || v.includes("scenario-ciudad");
    const isMar =
      v.includes("Mar_Costero") || v.includes("mar-costero") || v.includes("scenario-mar-costero");
    const isManglares =
      v.includes("Manglares") || v.includes("manglares") || v.includes("scenario-manglares");

    if (isBosque) return { desktopSrc: "/backgrounds/Terral1366_X_768.png", tabletSrc: "/backgrounds/Terral1024_X_768.png", mobileSrc: "/backgrounds/Terral1075_X_1944.png" };
    if (isCiudad) return { desktopSrc: "/backgrounds/Civika1366_X_768.png", tabletSrc: "/backgrounds/Civika1024_X_768.png", mobileSrc: "/backgrounds/Civika1075_X_1944.png" };
    if (isMar) return { desktopSrc: "/backgrounds/Mareva1366_X_768.png", tabletSrc: "/backgrounds/Mareva1024_X_768.png", mobileSrc: "/backgrounds/Mareva1075_X_1944.png" };
    if (isManglares) return { desktopSrc: "/backgrounds/Manglia1366_X_768.png", tabletSrc: "/backgrounds/Manglia1024_X_768.png", mobileSrc: "/backgrounds/Manglia1075_X_1944.png" };

    return null;
  }, [chosenScenario]);


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
          const data = snap.data() as any;
          setChosenScenario(data.chosenScenario ?? null);
          const fullName = data.playerName || data.usuario || `${data.nombre || ""} ${data.apellido || ""}`.trim();
          setPlayerName(fullName || "Guardián");
          const savedPlaced = (data.placedPrizes ?? []) as PlacedPrize[];
          setPlacedPrizes(savedPlaced.map((p) => ({ ...p, scale: typeof p.scale === "number" ? p.scale : 1, stationId: p.stationId ?? 9 })));
          const confirmed = !!data.station9Confirmed;
          const finalized = !!data.station9Finalized;
          setIsStationConfirmed(confirmed || finalized);
          setIsStationFinalized(finalized);
        }
      } catch (e) {
        console.error(e);
        toast({ title: "Error", description: "No se pudo cargar la estación 9.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    void fetchPlayerData();
  }, [user, db]);

  useEffect(() => {
    if (isLoading || isMobile === undefined) return;
    if (!sidebarInitializedRef.current) {
        setIsSidebarOpen(!isMobile);
        sidebarInitializedRef.current = true;
    }
  }, [isLoading, isMobile]);

  useEffect(() => {
    if (isLoading) return;
    if (yaraShowTimerRef.current) clearTimeout(yaraShowTimerRef.current);
    if (yaraHideTimerRef.current) clearTimeout(yaraHideTimerRef.current);

    yaraShowTimerRef.current = setTimeout(() => {
      setIsYaraVisible(true);
      yaraHideTimerRef.current = setTimeout(() => { setIsYaraVisible(false); }, 25000);
    }, 800);

    return () => {
      if (yaraShowTimerRef.current) clearTimeout(yaraShowTimerRef.current);
      if (yaraHideTimerRef.current) clearTimeout(yaraHideTimerRef.current);
    };
  }, [isLoading]);

  const savePrizesToDb = useCallback(
    async (prizesToSave: PlacedPrize[]) => {
      if (!user || !db) return;
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { placedPrizes: prizesToSave }, { merge: true });
    },
    [user, db]
  );

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<PlacedPrize[] | null>(null);

  const scheduleSave = useCallback(
    (next: PlacedPrize[]) => {
      latestRef.current = next;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        const payload = latestRef.current;
        if (payload) void savePrizesToDb(payload);
      }, 500);
    },
    [savePrizesToDb]
  );
  
  useEffect(() => () => { if (saveTimerRef.current) clearTimeout(saveTimerRef.current); }, []);

  const reclampAll = useCallback(() => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setPlacedPrizes((prev) => {
      const next = prev.map((p) => {
        const { x, y } = clampPositionByBadgeSize(p.x, p.y, rect, p.scale || 1);
        return { ...p, x, y };
      });
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        scheduleSave(next);
      }
      return next;
    });
  }, [scheduleSave]);
  
  useEffect(() => {
    if (isLoading) return;
    const t = setTimeout(() => reclampAll(), 200);
    const onResize = () => reclampAll();
    window.addEventListener("resize", onResize);
    return () => {
        clearTimeout(t);
        window.removeEventListener("resize", onResize);
    };
  }, [isLoading, reclampAll]);

  const placedIds = useMemo(() => new Set(placedPrizes.map((p) => p.id)), [placedPrizes]);
  const allPlaced = useMemo(() => {
    const safe = Array.isArray(collectedPrizes) ? collectedPrizes : [];
    return safe.length > 0 && safe.every((p) => placedIds.has(p.id));
  }, [collectedPrizes, placedIds]);

  const addPrizeAtCenter = useCallback(
    (prize: Prize) => {
      if (!canvasRef.current || isStationConfirmed || isStationFinalized) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = 1;
      const { x, y } = clampPositionByBadgeSize(50, 50, rect, scale);
      const newPlaced: PlacedPrize = { ...prize, x, y, scale, stationId: (prize as any).stationId ?? 9 };
      const updated = [...placedPrizes.filter((p) => p.id !== prize.id), newPlaced];
      setPlacedPrizes(updated);
      scheduleSave(updated);
      setSelectedPrizeId(prize.id);
      setResizePrizeId(null);
    },
    [placedPrizes, scheduleSave, isStationConfirmed, isStationFinalized]
  );

  const movePlacedPrize = useCallback(
    (id: string, info: PanInfo) => {
        if (!canvasRef.current || isStationConfirmed || isStationFinalized || resizePrizeId) return;
    
        // Update state immediately for smooth dragging
        setPlacedPrizes(prevPrizes => {
            const rect = canvasRef.current!.getBoundingClientRect();
            const current = prevPrizes.find(p => p.id === id);
            if (!current) return prevPrizes;
    
            // Calculate new position based on drag offset
            const prevXPx = (current.x / 100) * rect.width;
            const prevYPx = (current.y / 100) * rect.height;
            const newXPx = prevXPx + info.offset.x;
            const newYPx = prevYPx + info.offset.y;
    
            const rawX = (newXPx / rect.width) * 100;
            const rawY = (newYPx / rect.height) * 100;
    
            const { x, y } = clampPositionByBadgeSize(rawX, rawY, rect, current.scale || 1);
    
            return prevPrizes.map(p => (p.id === id ? { ...p, x, y } : p));
        });
    },
    [isStationConfirmed, isStationFinalized, resizePrizeId]
  );

  const onDragEnd = useCallback(() => {
    scheduleSave(placedPrizes);
  }, [placedPrizes, scheduleSave]);

  const openResize = useCallback((id: string) => {
      if (isStationConfirmed || isStationFinalized) return;
      setSelectedPrizeId(id);
      setResizePrizeId(id);
    }, [isStationConfirmed, isStationFinalized]);

  const closeResize = useCallback(() => {
    setResizePrizeId(null);
  }, []);

  const handleScaleChange = useCallback(
    (id: string, value: number[]) => {
      if (isStationConfirmed || isStationFinalized || resizePrizeId !== id) return;
      const prize = placedPrizes.find((p) => p.id === id);
      if (!prize) return;
      const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;
      const scale = clamp(value[0], 0.5, maxScale);
      setPlacedPrizes((prev) => prev.map((p) => (p.id === id ? { ...p, scale } : p)));
    },
    [placedPrizes, resizePrizeId, isStationConfirmed, isStationFinalized]
  );
  
  const handleScaleCommit = useCallback(
    (id: string, value: number[]) => {
      if (!canvasRef.current || isStationConfirmed || isStationFinalized || resizePrizeId !== id) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const prize = placedPrizes.find((p) => p.id === id);
      if (!prize) return;
      const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;
      const scale = clamp(value[0], 0.5, maxScale);
      const { x, y } = clampPositionByBadgeSize(prize.x, prize.y, rect, scale);
      const updated = placedPrizes.map((p) => (p.id === id ? { ...p, x, y, scale } : p));
      setPlacedPrizes(updated);
      scheduleSave(updated);
    },
    [placedPrizes, resizePrizeId, scheduleSave, isStationConfirmed, isStationFinalized]
  );

  const deletePrize = useCallback(
    (id: string) => {
      if (isStationConfirmed || isStationFinalized) return;
      const updated = placedPrizes.filter((p) => p.id !== id);
      setPlacedPrizes(updated);
      scheduleSave(updated);
      if (selectedPrizeId === id) setSelectedPrizeId(null);
      if (resizePrizeId === id) closeResize();
    },
    [placedPrizes, scheduleSave, selectedPrizeId, resizePrizeId, closeResize, isStationConfirmed, isStationFinalized]
  );
  
  const confirmStation = useCallback(async () => {
    if (!user || !db || !allPlaced) {
      toast({ title: "Faltan insignias", description: "Debes colocar todas las insignias antes de confirmar.", variant: "destructive" });
      return;
    }
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
      toast({ title: isStationFinalized ? "Finalizada" : "Primero confirma", description: isStationFinalized ? "Ya has finalizado esta estación" : "Debes confirmar la estación antes de descargar.", variant: "destructive" });
      return;
    }

    try {
      setSelectedPrizeId(null);
      closeResize();
      await sleep(150);

      const canvasEl = canvasRef.current;
      const canvas = await html2canvas(canvasEl, { useCORS: true, backgroundColor: null, scale: Math.max(2, window.devicePixelRatio || 2) });
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to create blob');

      const file = new File([blob], 'estacion-9.png', { type: 'image/png' });

      // Use Web Share API if available (for mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mi Estación Kairu',
          text: '¡Mira la estación que creé en EcoQuest Explorers!',
        });
      } else {
        // Fallback for desktop browsers
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file);
        link.download = 'estacion-9.png';
        link.click();
        URL.revokeObjectURL(link.href);
      }

      if (user && db) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { station9Finalized: true }, { merge: true });
      }
      setIsStationFinalized(true);
      setIsCompletionDialogOpen(true);
      toast({ title: "¡Listo!", description: "Tu estación ha sido finalizada." });

    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo generar o compartir la imagen.", variant: "destructive" });
    }
  }, [isStationConfirmed, isStationFinalized, closeResize, user, db]);
  
  const SidebarContent = () => {
    const safeCollected = Array.isArray(collectedPrizes) ? collectedPrizes : [];
    return (
        <>
            <div className="flex items-center justify-between gap-2 p-4 border-b">
                <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    <div className="font-semibold">Insignias Ganadas</div>
                </div>
                {isMobile && <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}><X className="w-5 h-5"/></Button>}
            </div>
            
            <div className="flex-grow overflow-y-auto p-4">
                <div className="text-xs text-muted-foreground mb-3">
                    Colocadas: <b>{placedPrizes.length}</b> / <b>{safeCollected.length}</b>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {safeCollected.map((prize) => {
                        const placed = placedIds.has(prize.id);
                        return (
                            <div key={prize.id} className={`rounded-lg border p-2 ${placed ? "opacity-60" : ""}`}>
                                <button type="button" className="w-full" disabled={placed || isStationConfirmed || isStationFinalized} onClick={() => addPrizeAtCenter(prize)}>
                                    <div className="relative w-16 h-16 mx-auto"><Image src={prize.imageUrl} alt={prize.name} fill className="object-contain" /></div>
                                    <div className="text-[11px] mt-1 text-center line-clamp-2">{prize.name}</div>
                                    <div className="text-[10px] text-center mt-1 text-muted-foreground">{placed ? "Ya colocada" : "Toca para agregar"}</div>
                                </button>
                            </div>
                        );
                    })}
                    {safeCollected.length === 0 && <div className="text-xs text-muted-foreground col-span-2">No tienes insignias aún.</div>}
                </div>
            </div>
            
            <div className="p-4 border-t flex flex-col gap-2">
                {!isStationConfirmed && !isStationFinalized && <Button onClick={confirmStation} disabled={!allPlaced} className="w-full"><Check className="w-4 h-4 mr-2" />Confirmar estación</Button>}
                {isStationConfirmed && !isStationFinalized && (
                    <>
                        <Button onClick={handleDownloadImage} className="w-full"><Download className="w-4 h-4 mr-2" />Descargar Imagen</Button>
                        <Button onClick={enableModify} variant="secondary" className="w-full"><Pencil className="w-4 h-4 mr-2" />Modificar</Button>
                    </>
                )}
                {isStationFinalized && <div className="text-xs text-muted-foreground text-center">Estación finalizada. Ya no se puede modificar.</div>}
            </div>
        </>
    );
};

  const selectedPrize = useMemo(() => placedPrizes.find((p) => p.id === selectedPrizeId) || null, [placedPrizes, selectedPrizeId]);
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara-final");

  if (!chosenScenario && !isLoading) {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
            <h2 className="text-2xl font-bold text-primary mb-4">¡Un Momento!</h2>
            <p className="text-muted-foreground mb-6">Parece que no has elegido un lienzo para tu estación final. Por favor, reinicia el onboarding desde los ajustes del mapa para elegir uno.</p>
        </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      {isYaraVisible && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[200] w-[92vw] max-w-2xl">
          <Card className="p-3 shadow-lg"><div className="flex items-start gap-3">
              {yaraCharImage?.imageUrl && <div className="relative w-12 h-12 shrink-0"><Image src={yaraCharImage.imageUrl} alt="Yara" fill className="object-contain" /></div>}
              <div className="flex-1">
                <TypewriterText text={`Hola ${playerName}. En esta estación debes colocar todas tus insignias sobre el lienzo. Toca una insignia en el panel para agregarla, arrástrala para ubicarla, y con doble clic podrás cambiar su tamaño. Cuando estén todas, confirma la estación y descarga la imagen final.`} />
                <div className="text-[11px] text-muted-foreground mt-2">(Este mensaje se cerrará automáticamente en 25 segundos)</div>
              </div>
          </div></Card>
        </div>
      )}

      <div className="flex w-full h-full">
        <div className="relative flex-1">
          <div ref={canvasRef} className="absolute inset-0 w-full h-full" onClick={() => { setSelectedPrizeId(null); closeResize(); }}>
            <div className="absolute inset-0 z-0 pointer-events-none">
              {scenarioBackgrounds ? <ResponsiveBackground desktopSrc={scenarioBackgrounds.desktopSrc} tabletSrc={scenarioBackgrounds.tabletSrc} mobileSrc={scenarioBackgrounds.mobileSrc} /> : <div className="w-full h-full bg-muted" />}
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
                    style={{ left: `${prize.x}%`, top: `${prize.y}%`, width: `calc(min(8vw, 8vh) * ${scale})`, height: `calc(min(8vw, 8vh) * ${scale})`, transform: "translate(-50%, -50%)", touchAction: "none", cursor: canEdit && !isResizeOpen ? "grab" : "default", zIndex: isSelected ? 120 : 20 }}
                    drag={canEdit && !isResizeOpen} dragMomentum={false} dragElastic={0}
                    onDrag={(e, info) => { e.stopPropagation(); movePlacedPrize(prize.id, info); }}
                    onDragStart={(e) => { if (!canEdit) return; e.stopPropagation(); setSelectedPrizeId(prize.id); setResizePrizeId(null); }}
                    onDragEnd={(e) => { if (!canEdit) return; e.stopPropagation(); onDragEnd(); }}
                    onClick={(e) => { e.stopPropagation(); setSelectedPrizeId(prize.id); }}
                    onDoubleClick={(e) => { e.stopPropagation(); if (!canEdit) return; openResize(prize.id); }}
                  >
                    <Image src={prize.imageUrl} alt={prize.name} fill className="object-contain pointer-events-none" draggable={false} />
                    {canEdit && isSelected && !isResizeOpen && <div className="absolute inset-0 border-2 border-dashed border-primary rounded-md animate-pulse"></div>}

                    {canEdit && isResizeOpen && (
                      <div className={isMobile ? "fixed left-1/2 -translate-x-1/2 bottom-4 z-[200] w-[92vw] max-w-md" : "absolute left-1/2 -translate-x-1/2 -bottom-20 z-[200] w-72"} onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                        <Card className="p-3 shadow-xl bg-card/90 backdrop-blur-sm">
                          <div className="flex items-center justify-between gap-2">
                            <Button size="icon" variant="ghost" onClick={() => deletePrize(prize.id)} title="Eliminar"><Trash2 className="w-4 h-4" /></Button>
                            <Slider value={[scale]} min={0.5} max={maxScale} step={0.1} onValueChange={(v) => handleScaleChange(prize.id, v)} onValueCommit={(v) => handleScaleCommit(prize.id, v)} className="mx-4"/>
                            <Button size="sm" variant="secondary" onClick={closeResize}>Listo</Button>
                          </div>
                        </Card>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar for Desktop */}
        {!isMobile && (
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div 
                        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.3 }}
                        className="w-80 shrink-0 border-l bg-background/80 backdrop-blur-sm flex flex-col"
                    >
                        <SidebarContent />
                    </motion.div>
                )}
            </AnimatePresence>
        )}
      </div>
      
      {/* Sidebar Toggle Button */}
      <div className="absolute top-4 right-4 z-[60]">
        <Button size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <PanelRightClose /> : <PanelRightOpen />}
        </Button>
      </div>

      {/* Sheet for Mobile */}
      {isMobile && (
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="right" className="w-[320px] max-w-[85vw] bg-background/80 backdrop-blur-sm p-0 flex flex-col">
                <SidebarContent />
            </SheetContent>
        </Sheet>
      )}

      <CompletionDialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen} />
    </div>
  );
}

    