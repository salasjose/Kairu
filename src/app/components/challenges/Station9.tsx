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
import { Trash2, Gift, X, Check, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { useIsMobile } from "@/hooks/use-mobile";
import ResponsiveBackground from "../ResponsiveBackground";

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------

type PlacedPrize = Prize & {
  x: number; // porcentaje
  y: number; // porcentaje
  scale?: number;
  stationId?: number;
};

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const getBadgeBasePx = (rect: DOMRect) => {
  return Math.min(rect.width * 0.08, rect.height * 0.08);
};

const clampPositionByBadgeSize = (
  xPercent: number,
  yPercent: number,
  rect: DOMRect,
  scale: number
) => {
  const basePx = getBadgeBasePx(rect);
  const badgePx = basePx * (scale || 1);

  const halfWPercent = (badgePx / rect.width) * 50;
  const halfHPercent = (badgePx / rect.height) * 50;

  const safeX = clamp(xPercent, halfWPercent, 100 - halfWPercent);
  const safeY = clamp(yPercent, halfHPercent, 100 - halfHPercent);

  return { x: safeX, y: safeY };
};

const isSpecialPrize = (imageUrl: string) => {
  return imageUrl.includes("Molinos.png") || imageUrl.includes("Ciudad.png");
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------
// Componente principal: Station9
// ------------------------------------------------------------------

export default function Station9() {
  const [chosenScenario, setChosenScenario] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [isStationConfirmed, setIsStationConfirmed] = useState(false);
  const [placedPrizes, setPlacedPrizes] = useState<PlacedPrize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);
  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [showYaraMessage, setShowYaraMessage] = useState(true);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const isMobile = useIsMobile();
  const { user } = useUser();
  const db = useFirestore();

  const { prizes: collectedPrizes = [] } = usePrizeCart() ?? {};

  const selectedPrize = useMemo(
    () => placedPrizes.find((p) => p.id === selectedPrizeId) || null,
    [placedPrizes, selectedPrizeId]
  );

  // ------------------------------------------------------------------
  // Cargar estado desde Firestore
  // ------------------------------------------------------------------

  useEffect(() => {
    if (!user || !db) return;

    const load = async () => {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const snap = await getDoc(userDocRef);
        if (!snap.exists()) return;

        const data = snap.data() as any;

        setChosenScenario(data.chosenScenario ?? null);
        setPlayerName(data.playerName ?? "");
        setIsStationConfirmed(!!data.station9Confirmed);

        const savedPlaced = (data.placedPrizes ?? []) as PlacedPrize[];
        setPlacedPrizes(savedPlaced);
      } catch (e) {
        console.error(e);
        toast({
          title: "Error al cargar",
          description: "No se pudo cargar el estado de la estación.",
          variant: "destructive",
        });
      }
    };

    void load();
  }, [user, db]);

  // Mensaje guía (Yara)
  useEffect(() => {
    const t = setTimeout(() => setShowYaraMessage(false), 15000);
    return () => clearTimeout(t);
  }, []);

  // ------------------------------------------------------------------
  // Guardado (Firestore)
  // ------------------------------------------------------------------

  const savePrizesToDb = useCallback(
    async (prizesToSave: PlacedPrize[]) => {
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
    },
    [user, db]
  );

  // Guardado con debounce
  const saveDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestPrizesToSaveRef = useRef<PlacedPrize[] | null>(null);

  const scheduleSavePrizes = useCallback(
    (prizesToSave: PlacedPrize[]) => {
      if (!user || !db) return;

      latestPrizesToSaveRef.current = prizesToSave;

      if (saveDebounceTimerRef.current) {
        clearTimeout(saveDebounceTimerRef.current);
      }

      saveDebounceTimerRef.current = setTimeout(() => {
        const payload = latestPrizesToSaveRef.current;
        if (payload) void savePrizesToDb(payload);
      }, 600);
    },
    [user, db, savePrizesToDb]
  );

  useEffect(() => {
    return () => {
      if (saveDebounceTimerRef.current) clearTimeout(saveDebounceTimerRef.current);
    };
  }, []);

  // ------------------------------------------------------------------
  // Colocar insignia desde el sidebar al lienzo
  // ------------------------------------------------------------------

  const handlePrizeDrop = (prizeId: string, info: PanInfo) => {
    if (isStationConfirmed || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const pointerX = info.point.x;
    const pointerY = info.point.y;

    // Drop dentro del canvas
    if (
      pointerX < canvasRect.left ||
      pointerX > canvasRect.right ||
      pointerY < canvasRect.top ||
      pointerY > canvasRect.bottom
    ) {
      toast({
        title: "Fuera del lienzo",
        description: "Arrastra la insignia dentro del área del lienzo.",
        variant: "destructive",
      });
      return;
    }

    const rawX = ((pointerX - canvasRect.left) / canvasRect.width) * 100;
    const rawY = ((pointerY - canvasRect.top) / canvasRect.height) * 100;

    const { x, y } = clampPositionByBadgeSize(rawX, rawY, canvasRect, 1);

    const prizeData = collectedPrizes.find((p) => p.id === prizeId);
    if (!prizeData) return;

    const newPlacedPrize: PlacedPrize = {
      ...prizeData,
      x,
      y,
      scale: 1,
      stationId: (prizeData as any).stationId ?? 9,
    };

    const newPlacedPrizes = [
      ...placedPrizes.filter((p) => p.id !== prizeId),
      newPlacedPrize,
    ];

    setPlacedPrizes(newPlacedPrizes);
    scheduleSavePrizes(newPlacedPrizes);
  };

  // ------------------------------------------------------------------
  // Escala (UI)
  // ------------------------------------------------------------------

  const handleScaleChange = (prizeId: string, newScale: number[]) => {
    if (isStationConfirmed) return;
    const prize = placedPrizes.find((p) => p.id === prizeId);
    if (!prize) return;

    const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;
    const scale = clamp(newScale[0], 0.5, maxScale);

    const updated = placedPrizes.map((p) =>
      p.id === prizeId ? { ...p, scale } : p
    );
    setPlacedPrizes(updated);
  };

  const handleScaleChangeCommit = (prizeId: string, newScale: number[]) => {
    if (isStationConfirmed) return;

    const prize = placedPrizes.find((p) => p.id === prizeId);
    if (!prize) return;

    const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;
    const scale = clamp(newScale[0], 0.5, maxScale);

    let nextX = prize.x;
    let nextY = prize.y;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const clampedPos = clampPositionByBadgeSize(prize.x, prize.y, rect, scale);
      nextX = clampedPos.x;
      nextY = clampedPos.y;
    }

    const updated = placedPrizes.map((p) =>
      p.id === prizeId ? { ...p, x: nextX, y: nextY, scale } : p
    );

    setPlacedPrizes(updated);
    scheduleSavePrizes(updated);
  };

  // ------------------------------------------------------------------
  // Eliminar insignia
  // ------------------------------------------------------------------

  const handleDeletePrize = (prizeId: string) => {
    if (isStationConfirmed) return;

    const newPlacedPrizes = placedPrizes.filter((p) => p.id !== prizeId);
    setPlacedPrizes(newPlacedPrizes);
    scheduleSavePrizes(newPlacedPrizes);
    setSelectedPrizeId(null);
  };

  // ------------------------------------------------------------------
  // GUARDAR / DESBLOQUEAR ESTACIÓN
  // ------------------------------------------------------------------

  const handleSaveStation = async () => {
    if (!user || !db) return;

    const allPlaced =
      collectedPrizes.length > 0 &&
      collectedPrizes.every((cp) => placedPrizes.some((p) => p.id === cp.id));

    if (!allPlaced) {
      toast({
        title: "Faltan insignias",
        description:
          "Debes colocar todas las insignias en el lienzo antes de guardar.",
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
        title: "Estación guardada",
        description:
          "Tu estación quedó bloqueada. Puedes descargar la imagen o desbloquear para editar.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "No se pudo guardar la estación.",
        variant: "destructive",
      });
    }
  };

  const handleUnlockStation = async () => {
    if (!user || !db) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { station9Confirmed: false }, { merge: true });

      setIsStationConfirmed(false);
      toast({
        title: "Estación desbloqueada",
        description: "Ahora puedes mover, escalar o eliminar insignias.",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "No se pudo desbloquear la estación.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // Descargar imagen
  // ------------------------------------------------------------------

  const handleDownloadImage = async () => {
    if (!canvasRef.current) return;

    if (!isStationConfirmed) {
      toast({
        title: "Primero guarda",
        description:
          "Debes guardar la estación antes de descargar la imagen final.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSelectedPrizeId(null);
      await sleep(200);

      const canvas = await html2canvas(canvasRef.current, {
        useCORS: true,
        scale: Math.max(2, window.devicePixelRatio || 2),
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "lienzo-estacion-9.png";
      link.click();

      if (user && db) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { station9Finalized: true }, { merge: true });
      }

      setIsCompletionDialogOpen(true);
    } catch (e) {
      console.error(e);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // Fondos responsivos
  // ------------------------------------------------------------------

  const scenarioBackgrounds: {
    [key: string]: { pc: string; tablet: string; mobile: string };
  } = {
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

  const backgrounds = chosenScenario ? scenarioBackgrounds[chosenScenario] : null;

  // ------------------------------------------------------------------
  // Sidebar
  // ------------------------------------------------------------------

  const Sidebar = () => {
    const safeCollectedPrizes = Array.isArray(collectedPrizes)
      ? collectedPrizes
      : [];

    const remaining = safeCollectedPrizes.filter(
      (p) => !placedPrizes.some((pp) => pp.id === p.id)
    );

    return (
      <div
        className={
          isMobile
            ? "fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur border-t p-3 z-50"
            : "w-72 shrink-0 border-l bg-background/90 backdrop-blur p-4"
        }
      >
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5" />
          <div className="font-semibold">Insignias</div>
        </div>

        <div
          className={
            isMobile
              ? "flex gap-3 overflow-x-auto pb-1"
              : "grid grid-cols-2 gap-3"
          }
        >
          {remaining.map((prize) => (
            <motion.div
              key={prize.id}
              drag={!isStationConfirmed}
              dragMomentum={false}
              dragElastic={0}
              whileDrag={{ scale: 1.05, zIndex: 50 }}
              onDragEnd={(event, info) => handlePrizeDrop(prize.id, info)}
              className="relative rounded-lg border bg-card p-2 cursor-grab active:cursor-grabbing select-none"
              style={{ touchAction: "none" }}
            >
              <div className="relative w-16 h-16 mx-auto">
                <Image
                  src={prize.imageUrl}
                  alt={prize.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="text-[11px] mt-1 text-center line-clamp-2">
                {prize.name}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {!isStationConfirmed ? (
            <Button onClick={handleSaveStation} className="w-full">
              <Check className="w-4 h-4 mr-2" />
              Guardar estación
            </Button>
          ) : (
            <>
              <Button onClick={handleDownloadImage} className="w-full" variant="default">
                <Download className="w-4 h-4 mr-2" />
                Descargar imagen
              </Button>
              <Button onClick={handleUnlockStation} className="w-full" variant="secondary">
                Desbloquear
              </Button>
            </>
          )}
        </div>
      </div>
    );
  };

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <AnimatePresence>
        {showYaraMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-3 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="p-3 shadow-lg">
              <TypewriterText text="Arrastra las insignias al lienzo. Ajusta el tamaño y guarda para descargar tu imagen final." />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={isMobile ? "w-full h-full" : "flex w-full h-full"}>
        <div className="relative flex-1">
          <div
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            onClick={() => setSelectedPrizeId(null)}
          >
            {backgrounds ? (
              <ResponsiveBackground
                desktopSrc={backgrounds.pc}
                tabletSrc={backgrounds.tablet}
                mobileSrc={backgrounds.mobile}
              />
            ) : (
              <div className="w-full h-full bg-muted" />
            )}

            {placedPrizes.map((prize) => {
              const isSelected = selectedPrizeId === prize.id;
              const scale = prize.scale || 1;
              const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;

              return (
                <motion.div
                  key={prize.id}
                  layout
                  drag={!isStationConfirmed}
                  dragMomentum={false}
                  dragElastic={0}
                  whileDrag={{ scale: 1.05, zIndex: 50 }}
                  onDrag={(event, info) => {
                    if (isStationConfirmed || !canvasRef.current) return;
                     const rect = canvasRef.current.getBoundingClientRect();
                    const { x, y } = clampPositionByBadgeSize(
                      (info.point.x - rect.left) / rect.width * 100,
                      (info.point.y - rect.top) / rect.height * 100,
                      rect,
                      prize.scale || 1
                    );
                    const updatedPrizes = placedPrizes.map(p => 
                      p.id === prize.id ? { ...p, x, y } : p
                    );
                    setPlacedPrizes(updatedPrizes);
                  }}
                  onDragStart={(event) => {
                    if (!isStationConfirmed) {
                      event.stopPropagation();
                      setSelectedPrizeId(prize.id);
                    }
                  }}
                  onDragEnd={(event, info) => {
                    if (isStationConfirmed) return;
                    scheduleSavePrizes(placedPrizes);
                  }}
                  className="placed-prize-wrapper absolute"
                  style={{
                    left: `${prize.x}%`,
                    top: `${prize.y}%`,
                    width: `calc(min(8vw, 8vh) * ${scale})`,
                    height: `calc(min(8vw, 8vh) * ${scale})`,
                    transform: "translate(-50%, -50%)",
                    touchAction: "none",
                    cursor: isStationConfirmed ? "default" : "grab",
                  }}
                  initial={false}
                  animate={{
                    boxShadow: isSelected
                      ? "0px 0px 15px rgba(255,255,100,0.8)"
                      : "0px 0px 0px rgba(0,0,0,0)",
                  }}
                  transition={{ duration: 0.15 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isStationConfirmed) setSelectedPrizeId(prize.id);
                  }}
                >
                  <Image
                    src={prize.imageUrl}
                    alt={prize.name}
                    fill
                    className="object-contain"
                    draggable={false}
                  />

                  {!isStationConfirmed && isSelected && (
                    <div
                      className={
                        isMobile
                          ? "fixed left-1/2 -translate-x-1/2 bottom-[88px] z-[60] w-[92vw] max-w-md"
                          : "absolute left-1/2 -translate-x-1/2 -bottom-16 z-50 w-64"
                      }
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Card className="p-2 shadow-xl">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-medium">Tamaño</div>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeletePrize(prize.id)}
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="mt-2">
                          <Slider
                            value={[scale]}
                            min={0.5}
                            max={maxScale}
                            step={0.1}
                            onValueChange={(v) => handleScaleChange(prize.id, v)}
                            onValueCommit={(v) => handleScaleChangeCommit(prize.id, v)}
                          />
                        </div>

                        <div className="mt-2 flex justify-end">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setSelectedPrizeId(null)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cerrar
                          </Button>
                        </div>
                      </Card>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        <Sidebar />
      </div>

      <CompletionDialog
        open={isCompletionDialogOpen}
        onOpenChange={setIsCompletionDialogOpen}
      />
    </div>
  );
}
