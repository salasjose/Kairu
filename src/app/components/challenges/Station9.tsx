
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
import { Card } from "@/components/ui/card";
import TypewriterText from "../auth/TypewriterText";
import { Slider } from "@/components/ui/slider";
import { Trash2, Gift, X, Check, Download, Edit, PanelLeft } from "lucide-react";
import html2canvas from "html2canvas";
import { useIsMobile } from "@/hooks/use-mobile";
import ResponsiveBackground from "../ResponsiveBackground";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Logo from "../Logo";

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------

type PlacedPrize = Prize & {
  x: number; // porcentaje
  y: number; // porcentaje
  scale: number;
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const getBadgeBasePx = (rect: DOMRect) => Math.min(rect.width * 0.08, rect.height * 0.08);

const clampPositionByBadgeSize = (xPercent: number, yPercent: number, rect: DOMRect, scale: number) => {
  if (!rect.width || !rect.height) return { x: 50, y: 50 }; // Fallback

  const basePx = getBadgeBasePx(rect);
  const badgePx = basePx * (scale || 1);

  const halfWPercent = (badgePx / rect.width) * 50;
  const halfHPercent = (badgePx / rect.height) * 50;

  const x = clamp(xPercent, halfWPercent, 100 - halfWPercent);
  const y = clamp(yPercent, halfHPercent, 100 - halfHPercent);

  return { x, y };
};

const isSpecialPrize = (imageUrl: string) =>
  imageUrl.includes("Molinos.png") || imageUrl.includes("Ciudad.png");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const scenarioBackgrounds: Record<string, { pc: string; tablet: string; mobile: string }> = {
    "/backgrounds/Bosque_Seco_Tropical.png": {
      pc: "/backgrounds/Terral1366_X_768.png",
      tablet: "/backgrounds/Terral1024_X_768.png",
      mobile: "/backgrounds/Terral1075_X_1944.png",
    },
    "/backgrounds/Ciudad_Sostenible.png": {
      pc: "/backgrounds/Civika1366_X_768.png",
      tablet: "/backgrounds/Civika1024_X_768.png",
      mobile: "/backgrounds/Civika1075_X_1944.png",
    },
    "/backgrounds/Mar_Costero.png": {
      pc: "/backgrounds/Mareva1366_X_768.png",
      tablet: "/backgrounds/Mareva1024_X_768.png",
      mobile: "/backgrounds/Mareva1075_X_1944.png",
    },
    "/backgrounds/Manglares.png": {
      pc: "/backgrounds/Manglia1366_X_768.png",
      tablet: "/backgrounds/Manglia1024_X_768.png",
      mobile: "/backgrounds/Manglia1075_X_1944.png",
    },
};

const scenarioOptions = [
    { name: "Terral", id: 'scenario-bosque-seco', imageUrl: "/backgrounds/Bosque_Seco_Tropical.png" },
    { name: "Civika", id: 'scenario-ciudad', imageUrl: "/backgrounds/Ciudad_Sostenible.png" },
    { name: "Mareva", id: 'scenario-mar-costero', imageUrl: "/backgrounds/Mar_Costero.png" },
    { name: "Manglia", id: 'scenario-manglares', imageUrl: "/backgrounds/Manglares.png" },
];

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const res = await fetch(dataUrl);
    return await res.blob();
}


// ------------------------------------------------------------------
// Componente principal
// ------------------------------------------------------------------

export default function Station9() {
  const [chosenScenario, setChosenScenario] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [isStationConfirmed, setIsStationConfirmed] = useState(false);
  const [placedPrizes, setPlacedPrizes] = useState<PlacedPrize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [showYaraMessage, setShowYaraMessage] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const canvasRectRef = useRef<DOMRect | null>(null);
  const isMobile = useIsMobile();
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === 'char-yara-final');

  const { user } = useUser();
  const db = useFirestore();

  const { prizes: collectedPrizes = [] } = usePrizeCart() ?? {};

  const selectedPrize = useMemo(
    () => placedPrizes.find((p) => p.id === selectedPrizeId) || null,
    [placedPrizes, selectedPrizeId]
  );
  
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestToSaveRef = useRef<PlacedPrize[] | null>(null);

  const savePrizesToDb = useCallback(
    async (prizesToSave: PlacedPrize[]) => {
      if (!user || !db) return;
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { placedPrizes: prizesToSave }, { merge: true });
      } catch (e) {
        console.error("Error saving prizes:", e);
      }
    },
    [user, db]
  );

  const scheduleSave = useCallback(
    (next: PlacedPrize[]) => {
      latestToSaveRef.current = next;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);

      saveTimerRef.current = setTimeout(() => {
        const payload = latestToSaveRef.current;
        if (payload) void savePrizesToDb(payload);
      }, 600);
    },
    [savePrizesToDb]
  );
  
  useEffect(() => {
    const savedSidebarState = localStorage.getItem('kairu-sidebar-open');
    if (savedSidebarState !== null) {
      setIsSidebarOpen(JSON.parse(savedSidebarState));
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('kairu-sidebar-open', JSON.stringify(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    if (!user || !db) {
        setIsLoading(false);
        return;
    };

    const load = async () => {
      try {
        setIsLoading(true);
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) {
            setIsLoading(false);
            return;
        }

        const data = snap.data() as any;

        setChosenScenario(data.chosenScenario ?? null);
        setPlayerName(data.nombre ?? data.usuario ?? "Guardián");
        setIsStationConfirmed(!!data.station9Confirmed);

        const savedPlaced = (data.placedPrizes ?? []) as PlacedPrize[];
        setPlacedPrizes(
          savedPlaced.map((p) => ({
            ...p,
            scale: typeof p.scale === "number" ? p.scale : 1,
          }))
        );
      } catch (e) {
        console.error(e);
        toast({
          title: "Error al cargar",
          description: "No se pudo cargar la estación.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [user, db]);

  useEffect(() => {
      const yaraTimer = setTimeout(() => {
          setShowYaraMessage(false)
      }, 25000);
      return () => clearTimeout(yaraTimer);
  }, []);
  
  const updateCanvasRect = useCallback(() => {
    if (canvasRef.current) {
      canvasRectRef.current = canvasRef.current.getBoundingClientRect();
    }
  }, []);
  
  const addPrizeToCanvasCenter = (prize: Prize) => {
    if (isStationConfirmed) return;
    updateCanvasRect();
    if (!canvasRectRef.current) return;

    const rect = canvasRectRef.current;
    const rawX = 50;
    const rawY = 50;

    const scale = 1;
    const { x, y } = clampPositionByBadgeSize(rawX, rawY, rect, scale);

    const newPlaced: PlacedPrize = {
      ...prize,
      x,
      y,
      scale,
    };

    const updated = [...placedPrizes.filter((p) => p.id !== prize.id), newPlaced];
    setPlacedPrizes(updated);
    scheduleSave(updated);
    setSelectedPrizeId(prize.id);
  };
  
  const handlePrizeDropToCanvas = (prize: Prize, info: PanInfo) => {
    if (isStationConfirmed) return;
    updateCanvasRect();
    if (!canvasRectRef.current) return;

    const rect = canvasRectRef.current;
    const px = info.point.x;
    const py = info.point.y;

    if (px < rect.left || px > rect.right || py < rect.top || py > rect.bottom) return;

    const rawX = ((px - rect.left) / rect.width) * 100;
    const rawY = ((py - rect.top) / rect.height) * 100;

    const scale = 1;
    const { x, y } = clampPositionByBadgeSize(rawX, rawY, rect, scale);

    const newPlaced: PlacedPrize = {
      ...prize,
      x,
      y,
      scale,
    };

    const updated = [...placedPrizes.filter((p) => p.id !== prize.id), newPlaced];
    setPlacedPrizes(updated);
    scheduleSave(updated);
    setSelectedPrizeId(prize.id);
  };

  const movePlacedPrize = (id: string, info: PanInfo) => {
    if (isStationConfirmed || selectedPrizeId) return;
    
    updateCanvasRect();
    if (!canvasRectRef.current) return;

    const rect = canvasRectRef.current;
    const current = placedPrizes.find((p) => p.id === id);
    if (!current) return;

    const prevXPx = (current.x / 100) * rect.width;
    const prevYPx = (current.y / 100) * rect.height;

    const newXPx = prevXPx + info.offset.x;
    const newYPx = prevYPx + info.offset.y;

    const rawX = (newXPx / rect.width) * 100;
    const rawY = (newYPx / rect.height) * 100;

    const { x, y } = clampPositionByBadgeSize(rawX, rawY, rect, current.scale || 1);

    const updated = placedPrizes.map((p) => (p.id === id ? { ...p, x, y } : p));
    setPlacedPrizes(updated);
  };
  
  const handleDragEnd = (id: string) => {
    scheduleSave(placedPrizes);
  };

  const handleScaleChange = (id: string, value: number[]) => {
    if (isStationConfirmed) return;

    setPlacedPrizes((prev) => prev.map((p) => (p.id === id ? { ...p, scale: value[0] } : p)));
  };
  
  const handleScaleCommit = (id: string, value: number[]) => {
    if (isStationConfirmed) return;
    updateCanvasRect();
    if (!canvasRectRef.current) return;

    const rect = canvasRectRef.current;
    const prize = placedPrizes.find((p) => p.id === id);
    if (!prize) return;

    const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;
    const scale = clamp(value[0], 0.5, maxScale);
    const { x, y } = clampPositionByBadgeSize(prize.x, prize.y, rect, scale);

    const updated = placedPrizes.map((p) => (p.id === id ? { ...p, x, y, scale } : p));
    setPlacedPrizes(updated);
    scheduleSave(updated);
  };

  const deletePrize = (id: string) => {
    if (isStationConfirmed) return;
    const updated = placedPrizes.filter((p) => p.id !== id);
    setPlacedPrizes(updated);
    scheduleSave(updated);
    setSelectedPrizeId(null);
  };

  const allPlaced =
    collectedPrizes.length > 0 && collectedPrizes.every((cp) => placedPrizes.some((p) => p.id === cp.id));

  const handleSaveStation = async () => {
    if (!user || !db) return;
    if (!allPlaced) {
      toast({
        title: "Faltan insignias",
        description: "Debes colocar todas las insignias antes de confirmar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { station9Confirmed: true }, { merge: true });
      setIsStationConfirmed(true);
      setSelectedPrizeId(null);

      toast({
        title: "Estación Confirmada",
        description: "Tu lienzo ha sido guardado. Ahora puedes descargar la imagen.",
      });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo confirmar la estación.", variant: "destructive" });
    }
  };
  
  const handleUnlockStation = async () => {
    if (!user || !db) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { station9Confirmed: false }, { merge: true });
      setIsStationConfirmed(false);
      toast({ title: "Lienzo Desbloqueado", description: "Puedes editar nuevamente." });
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "No se pudo desbloquear.", variant: "destructive" });
    }
  };

  const handleDownloadImage = async () => {
    if (!canvasRef.current) return;
  
    if (!isStationConfirmed) {
      toast({
        title: "Primero confirma la estación",
        description: "Debes confirmar la estación antes de descargar la imagen.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      setSelectedPrizeId(null);
      await sleep(150);
  
      const canvas = await html2canvas(canvasRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: Math.max(2, window.devicePixelRatio || 2),
      });
  
      const dataUrl = canvas.toDataURL("image/png");
      const blob = await dataUrlToBlob(dataUrl);
      const imageFile = new File([blob], "mi-estacion-kairu.png", { type: "image/png" });
  
      if (navigator.canShare && navigator.canShare({ files: [imageFile] })) {
        await navigator.share({
          title: "Mi Estación Kairu",
          text: "¡Mira la estación que creé en Kairu!",
          files: [imageFile],
        });
      } else {
        const link = document.createElement("a");
        link.href = dataUrl;
        link.download = "mi-estacion-kairu.png";
        link.click();
      }
  
      if (user && db) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { station9Finalized: true }, { merge: true });
      }
  
      setIsCompletionDialogOpen(true);
    } catch (e) {
      console.error("Error al descargar/compartir la imagen:", e);
      if (e instanceof Error && e.name !== 'AbortError') {
          toast({ title: "Error", description: "No se pudo generar o compartir la imagen.", variant: "destructive" });
      }
    }
  };
  
  const handleSelectScenario = async (scenarioUrl: string) => {
    if (!user || !db) return;
    try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { chosenScenario: scenarioUrl }, { merge: true });
        setChosenScenario(scenarioUrl);
        toast({ title: "Lienzo seleccionado", description: "¡Ya puedes empezar a decorar!" });
    } catch(e) {
        console.error(e);
        toast({ title: "Error", description: "No se pudo guardar tu selección.", variant: "destructive" });
    }
  };
  
  const backgrounds = chosenScenario ? scenarioBackgrounds[chosenScenario] : null;

  const remaining = useMemo(() => {
    const safe = Array.isArray(collectedPrizes) ? collectedPrizes : [];
    return safe.filter((p) => !placedPrizes.some((pp) => pp.id === p.id));
  }, [collectedPrizes, placedPrizes]);

  const SidebarContent = () => (
     <div className="flex flex-col h-full bg-background/70 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            <div className="font-semibold">Insignias</div>
        </div>
        {!isMobile && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsSidebarOpen(false)}>
                <X className="w-4 h-4"/>
            </Button>
        )}
      </div>

      <div className="flex-grow overflow-y-auto pr-2 -mr-2">
        <div className="grid grid-cols-2 gap-3">
          {remaining.map((prize) => (
            <div key={prize.id} className="relative rounded-lg border bg-card p-2 select-none">
              <button
                type="button"
                className="w-full"
                disabled={isStationConfirmed}
                onClick={() => addPrizeToCanvasCenter(prize)}
              >
                <div className="relative w-16 h-16 mx-auto">
                  <Image src={prize.imageUrl} alt={prize.name} fill className="object-contain" />
                </div>
                <div className="text-[11px] mt-1 text-center line-clamp-2">{prize.name}</div>
              </button>

              {!isMobile && !isStationConfirmed && (
                <motion.div
                  drag
                  dragMomentum={false}
                  dragElastic={0}
                  dragSnapToOrigin
                  whileDrag={{ opacity: 0.9, scale: 1.05, zIndex: 80, cursor: 'grabbing' }}
                  onDragStart={updateCanvasRect}
                  onDragEnd={(e, info) => handlePrizeDropToCanvas(prize, info)}
                  className="mt-1 text-[10px] text-center text-muted-foreground cursor-grab"
                  style={{ touchAction: "none" }}
                >
                  (Arrastra)
                </motion.div>
              )}
            </div>
          ))}

          {remaining.length === 0 && (
            <div className="text-xs text-muted-foreground p-2 col-span-2 text-center">¡Ya colocaste todas!</div>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 pt-4 border-t">
        {!isStationConfirmed ? (
          <Button onClick={handleSaveStation} className="w-full" disabled={!allPlaced}>
            <Check className="w-4 h-4 mr-2" />
            Confirmar Estación
          </Button>
        ) : (
          <>
            <Button onClick={handleDownloadImage} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Descargar Imagen
            </Button>
            <Button onClick={handleUnlockStation} className="w-full" variant="secondary">
              <Edit className="w-4 h-4 mr-2" />
              Modificar
            </Button>
          </>
        )}
      </div>
    </div>
  )

  const Sidebar = () => {
    if(isMobile) {
        return (
            <Sheet>
                <SheetTrigger asChild>
                    <Button className="fixed bottom-4 right-4 z-50 rounded-full h-14 w-14 shadow-lg">
                        <Gift className="w-6 h-6"/>
                    </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[60vh] p-0 border-t-0 bg-transparent">
                    <div className="h-full bg-background/80 backdrop-blur-sm rounded-t-2xl">
                      <SheetHeader className="p-4 pb-0">
                        <SheetTitle className="sr-only">Insignias</SheetTitle>
                      </SheetHeader>
                      <SidebarContent />
                    </div>
                </SheetContent>
            </Sheet>
        )
    }

    if (!isSidebarOpen) {
        return (
             <Button className="fixed top-1/2 -translate-y-1/2 right-0 z-50 rounded-r-none" onClick={() => setIsSidebarOpen(true)}>
                <PanelLeft className="w-5 h-5"/>
            </Button>
        )
    }

    return (
        <div className="w-72 shrink-0 border-l">
            <SidebarContent />
        </div>
    )
  };
  
    if (isLoading) {
        return (
            <div className="w-full h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
                <Logo className="h-24 animate-pulse" />
                <p className="text-primary/70 mt-4">Cargando tu estación...</p>
            </div>
        );
    }
  
  if (!chosenScenario) {
    return (
        <div className="w-full h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
            <h1 className="text-3xl font-bold mb-2">Elige tu Lienzo</h1>
            <p className="text-muted-foreground mb-6">Selecciona el escenario para tu estación personalizada antes de continuar.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {scenarioOptions.map((scenario) => {
                    const img = PlaceHolderImages.find(p => p.id === scenario.id);
                    return (
                        <Card 
                            key={scenario.id} 
                            onClick={() => handleSelectScenario(scenario.imageUrl)}
                            className="p-2 cursor-pointer hover:border-primary hover:scale-105 transition-transform duration-300"
                        >
                            {img && <Image src={img.imageUrl} alt={img.description ?? ''} width={200} height={200} className="rounded-md aspect-square object-cover" />}
                             <p className="font-bold mt-2 text-sm">{scenario.name}</p>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <AnimatePresence>
        {showYaraMessage && yaraCharImage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20, transition: { duration: 0.5 } }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-[200] max-w-lg w-[90%] pointer-events-none"
          >
            <Card className="p-3 shadow-xl bg-white/95 relative pointer-events-auto">
                <div className="flex items-start gap-2">
                    <div className="relative w-16 h-20 -mt-8 -ml-6 shrink-0">
                        <Image src={yaraCharImage.imageUrl} alt={yaraCharImage.description} fill className="object-contain" />
                    </div>
                    <div className="flex-1 pt-1">
                        <TypewriterText text={`¡Hola ${playerName}! Esta es tu estación. Añade tus insignias y decora tu lienzo. Cuando termines, confirma para poder descargar tu obra de arte.`} />
                    </div>
                    <Button size="icon" variant="ghost" className="shrink-0 h-7 w-7" onClick={() => setShowYaraMessage(false)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex w-full h-full">
        <div className="relative flex-1">
          <div 
            ref={canvasRef} 
            className="absolute inset-0 w-full h-full" 
            onClick={() => setSelectedPrizeId(null)} 
            onMouseDown={updateCanvasRect}
            onPointerDown={updateCanvasRect}
          >
            <div className="absolute inset-0 z-0 pointer-events-none">
              {backgrounds ? (
                <ResponsiveBackground desktopSrc={backgrounds.pc} tabletSrc={backgrounds.tablet} mobileSrc={backgrounds.mobile} />
              ) : (
                <div className="w-full h-full bg-muted" />
              )}
            </div>

            <div className="absolute inset-0 z-10">
              {placedPrizes.map((prize) => {
                const isSelected = selectedPrizeId === prize.id;
                const scale = prize.scale || 1;

                return (
                  <motion.div
                    key={prize.id}
                    drag={!isStationConfirmed && !isSelected}
                    dragMomentum={false}
                    dragElastic={0}
                    dragControls={isMobile ? { "longPress": 200 } as any : undefined}
                    onTap={(e) => {
                      if(isMobile && !isStationConfirmed) {
                        e.stopPropagation();
                        setSelectedPrizeId(prize.id);
                      }
                    }}
                    onDoubleClick={(e) => {
                        if (isStationConfirmed || isMobile) return;
                        e.stopPropagation();
                        setSelectedPrizeId(prize.id);
                    }}
                    whileDrag={{ zIndex: 120, scale: 1.05 }}
                    onDragStart={updateCanvasRect}
                    onDrag={(e, info) => movePlacedPrize(prize.id, info)}
                    onDragEnd={() => handleDragEnd(prize.id)}
                    className="absolute"
                    style={{
                      left: `${prize.x}%`,
                      top: `${prize.y}%`,
                      width: `calc(min(8vw, 8vh) * ${scale})`,
                      height: `calc(min(8vw, 8vh) * ${scale})`,
                      transform: "translate(-50%, -50%)",
                      touchAction: "none",
                      cursor: isStationConfirmed ? "default" : isSelected ? "default" : "grab",
                      zIndex: isSelected ? 110 : 20,
                    }}
                  >
                    <Image src={prize.imageUrl} alt={prize.name} fill className="object-contain" draggable={false} />

                    {!isStationConfirmed && isSelected && (
                      <div
                        className={
                          isMobile
                            ? "fixed left-1/2 -translate-x-1/2 bottom-20 z-[150] w-[92vw] max-w-md"
                            : "absolute left-1/2 -translate-x-1/2 -bottom-24 z-[150] w-64"
                        }
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Card className="p-2 shadow-xl">
                          <div className="flex items-center justify-between gap-2">
                            <Button size="icon" variant="ghost" onClick={() => deletePrize(prize.id)} title="Eliminar">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                             <Button size="sm" variant="secondary" onClick={() => setSelectedPrizeId(null)}>
                              <X className="w-4 h-4 mr-1" />
                              Cerrar
                            </Button>
                          </div>

                          <div className="mt-2 px-2">
                            <Slider
                              value={[scale]}
                              min={0.5}
                              max={isSpecialPrize(prize.imageUrl) ? 7 : 5}
                              step={0.1}
                              onValueChange={(v) => handleScaleChange(prize.id, v)}
                              onValueCommit={(v) => handleScaleCommit(prize.id, v)}
                            />
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
        <Sidebar />
      </div>

      <CompletionDialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen} />
    </div>
  );
}
