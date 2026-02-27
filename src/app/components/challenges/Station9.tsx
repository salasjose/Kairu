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
import { Trash2, Gift, X, Check, Download, Minus, Plus, Move } from "lucide-react";
import html2canvas from "html2canvas";
import { useIsMobile } from "@/hooks/use-mobile";
import ResponsiveBackground from "../ResponsiveBackground";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------
// Guardamos coordenadas normalizadas 0..1 para estabilidad entre tamaños
type PlacedPrize = {
  id: string;
  imageUrl: string;
  name: string;
  nx: number; // 0..1 (centro)
  ny: number; // 0..1 (centro)
  scale: number;
  stationId: number;
};

// ------------------------------------------------------------------
// Utils
// ------------------------------------------------------------------
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const isSpecialPrize = (imageUrl: string) =>
  imageUrl.includes("Molinos.png") || imageUrl.includes("Ciudad.png");

/**
 * Margen dinámico en % (basado en escala) para evitar que se salga del lienzo.
 * Ajusta max/min según tu gusto.
 */
const getDynamicMarginPercent = (scale: number) => clamp(6 + scale * 2, 6, 22);

const percentToNorm = (percent: number) => percent / 100;
const normToPercent = (norm: number) => norm * 100;

const clampNormByMargin = (nx: number, ny: number, scale: number) => {
  const marginPercent = getDynamicMarginPercent(scale);
  const marginNorm = percentToNorm(marginPercent);
  return {
    nx: clamp(nx, marginNorm, 1 - marginNorm),
    ny: clamp(ny, marginNorm, 1 - marginNorm),
  };
};

// ------------------------------------------------------------------
// Componente: DraggablePrize (insignia en sidebar)
// ------------------------------------------------------------------
function DraggablePrize({
  prize,
  onDragEnd,
}: {
  prize: Prize;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}) {
  return (
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
            <Image src={prize.imageUrl} alt={prize.name} fill style={{ objectFit: "contain" }} />
          </div>
        </motion.div>
      </TooltipTrigger>
      <TooltipContent side="top">
        <p>{prize.name}</p>
      </TooltipContent>
    </Tooltip>
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
    const list = [
      { name: "Terral", ...PlaceHolderImages.find((p) => p.id === "scenario-bosque-seco") },
      { name: "Civika", ...PlaceHolderImages.find((p) => p.id === "scenario-ciudad") },
      { name: "Mareva", ...PlaceHolderImages.find((p) => p.id === "scenario-mar-costero") },
      { name: "Manglia", ...PlaceHolderImages.find((p) => p.id === "scenario-manglares") },
    ].filter((s) => s?.imageUrl);

    return list as Array<{ name: string; imageUrl: string; description?: string }>;
  }, []);

  return (
    <div className="w-full h-full bg-background/80 backdrop-blur-sm flex items-center justify-center p-8 text-center">
      <Card className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold text-primary mb-4">Elige tu Lienzo</h2>
        <p className="text-muted-foreground mb-6">
          Parece que no tienes un lienzo asignado. Por favor, selecciona uno para continuar y crear tu estación.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {scenarios.map((scenario) => (
            <Card
              key={scenario.imageUrl}
              onClick={() => onScenarioSelect(scenario.imageUrl)}
              className="p-2 cursor-pointer hover:border-primary hover:scale-105 transition-transform duration-300"
            >
              <Image
                src={scenario.imageUrl}
                alt={scenario.description ?? scenario.name}
                width={200}
                height={200}
                className="rounded-md aspect-square object-cover"
              />
              <p className="font-bold mt-2 text-sm">{scenario.name}</p>
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
  // Guardado separado por estación
  const PLACED_FIELD = "placedPrizesStation9";
  const CONFIRMED_FIELD = "station9Confirmed";
  const FINALIZED_FIELD = "station9Finalized";

  const [chosenScenario, setChosenScenario] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const [placedPrizes, setPlacedPrizes] = useState<PlacedPrize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);

  // Panel/edición
  const [resizePrizeId, setResizePrizeId] = useState<string | null>(null);
  const [moveModePrizeId, setMoveModePrizeId] = useState<string | null>(null); // ✅ handle de mover

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
    const value = chosenScenario;

    if (value.includes("Bosque_Seco_Tropical") || value.includes("scenario-bosque-seco")) {
      return {
        desktopSrc: "/backgrounds/Terral1366_X_768.png",
        tabletSrc: "/backgrounds/Terral1024_X_768.png",
        mobileSrc: "/backgrounds/Terral1075_X_1944.png",
      };
    }

    if (value.includes("Ciudad_Sostenible") || value.includes("scenario-ciudad")) {
      return {
        desktopSrc: "/backgrounds/Civika1366_X_768.png",
        tabletSrc: "/backgrounds/Civika1024_X_768.png",
        mobileSrc: "/backgrounds/Civika1075_X_1944.png",
      };
    }

    if (value.includes("Mar_Costero.png") || value.includes("scenario-mar-costero")) {
      return {
        desktopSrc: "/backgrounds/Mareva1366_X_768.png",
        tabletSrc: "/backgrounds/Mareva1024_X_768.png",
        mobileSrc: "/backgrounds/Mareva1075_X_1944.png",
      };
    }

    if (value.includes("Manglares") || value.includes("scenario-manglares")) {
      return {
        desktopSrc: "/backgrounds/Manglia1366_X_768.png",
        tabletSrc: "/backgrounds/Manglia1024_X_768.png",
        mobileSrc: "/backgrounds/Manglia1075_X_1944.png",
      };
    }

    return null;
  }, [chosenScenario]);

  // ------------------------------------------------------------------
  // Carga de datos del usuario
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
          const data = snap.data() as any;

          setChosenScenario(data.chosenScenario || null);
          setPlayerName(data.nombre || data.usuario || "Guardián");

          // ✅ Compatibilidad: si antes guardabas x/y en %, convertimos a nx/ny
          const raw: any[] = data[PLACED_FIELD] || [];
          const normalized: PlacedPrize[] = raw.map((p: any) => {
            const scale = typeof p.scale === "number" ? p.scale : 1;

            // Nueva estructura
            if (typeof p.nx === "number" && typeof p.ny === "number") {
              const clamped = clampNormByMargin(p.nx, p.ny, scale);
              return {
                id: p.id,
                imageUrl: p.imageUrl,
                name: p.name,
                nx: clamped.nx,
                ny: clamped.ny,
                scale,
                stationId: 9,
              };
            }

            // Vieja estructura: x/y en %
            const xPercent = typeof p.x === "number" ? p.x : 50;
            const yPercent = typeof p.y === "number" ? p.y : 50;
            const nx = percentToNorm(xPercent);
            const ny = percentToNorm(yPercent);

            const clamped = clampNormByMargin(nx, ny, scale);

            return {
              id: p.id,
              imageUrl: p.imageUrl,
              name: p.name,
              nx: clamped.nx,
              ny: clamped.ny,
              scale,
              stationId: 9,
            };
          });

          setPlacedPrizes(normalized);
          setIsStationConfirmed(Boolean(data[CONFIRMED_FIELD]));
          setIsStationFinalized(Boolean(data[FINALIZED_FIELD]));
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
  // Mensaje de Yara (25 segundos)
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
  // Guardar insignias en Firestore (Station 9)
  // ------------------------------------------------------------------
  const savePrizesToDb = useCallback(
    async (prizesToSave: PlacedPrize[]) => {
      if (!user || !db) return;
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { [PLACED_FIELD]: prizesToSave }, { merge: true });
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

  // ------------------------------------------------------------------
  // Colocar insignia desde el sidebar (usa nx/ny)
  // ------------------------------------------------------------------
  const handlePrizeDrop = async (prizeId: string, info: PanInfo) => {
    if (isStationConfirmed || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const px = info.point.x;
    const py = info.point.y;

    if (px < rect.left || px > rect.right || py < rect.top || py > rect.bottom) return;

    const prizeData = collectedPrizes.find((p) => p.id === prizeId);
    if (!prizeData) return;

    const initialScale = 1;
    let nx = (px - rect.left) / rect.width;
    let ny = (py - rect.top) / rect.height;

    const clamped = clampNormByMargin(nx, ny, initialScale);
    nx = clamped.nx;
    ny = clamped.ny;

    const newPlacedPrize: PlacedPrize = {
      id: prizeData.id,
      imageUrl: prizeData.imageUrl,
      name: prizeData.name,
      nx,
      ny,
      scale: initialScale,
      stationId: 9,
    };

    const newPlacedPrizes = [...placedPrizes.filter((p) => p.id !== prizeId), newPlacedPrize];
    setPlacedPrizes(newPlacedPrizes);
    await savePrizesToDb(newPlacedPrizes);
  };

  // ------------------------------------------------------------------
  // Escala: slider + botones +/- (mejor UX en móvil)
  // ------------------------------------------------------------------
  const setScaleForPrize = (prizeId: string, nextScale: number, commit: boolean) => {
    if (isStationConfirmed) return;

    const prize = placedPrizes.find((p) => p.id === prizeId);
    if (!prize) return;

    const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;
    const scale = clamp(nextScale, 0.5, maxScale);

    const clamped = clampNormByMargin(prize.nx, prize.ny, scale);

    const updated = placedPrizes.map((p) =>
      p.id === prizeId ? { ...p, scale, nx: clamped.nx, ny: clamped.ny } : p
    );

    setPlacedPrizes(updated);

    if (commit) void savePrizesToDb(updated);
  };

  const handleScaleChange = (prizeId: string, value: number[]) => {
    setScaleForPrize(prizeId, value[0], false);
  };

  const handleScaleCommit = (prizeId: string, value: number[]) => {
    setScaleForPrize(prizeId, value[0], true);
  };

  const bumpScale = (prizeId: string, delta: number) => {
    const prize = placedPrizes.find((p) => p.id === prizeId);
    if (!prize) return;
    setScaleForPrize(prizeId, (prize.scale || 1) + delta, true);
  };

  // ------------------------------------------------------------------
  // Eliminar insignia
  // ------------------------------------------------------------------
  const handleDeletePrize = async (prizeId: string) => {
    if (isStationConfirmed) return;
    const newPlacedPrizes = placedPrizes.filter((p) => p.id !== prizeId);
    setPlacedPrizes(newPlacedPrizes);
    await savePrizesToDb(newPlacedPrizes);
    setSelectedPrizeId(null);
    setResizePrizeId(null);
    setMoveModePrizeId(null);
  };

  // ------------------------------------------------------------------
  // Confirmar / Modificar estación
  // ------------------------------------------------------------------
  const handleSaveStation = async () => {
    if (!user || !db) return;
    if (isStationConfirmed) return;

    if (collectedPrizes.length === 0) {
      toast({ title: "Sin insignias", description: "No has ganado insignias aún.", variant: "destructive" });
      return;
    }

    const unplaced = collectedPrizes.filter((p) => !placedPrizes.some((pp) => pp.id === p.id));
    if (unplaced.length > 0) {
      toast({
        title: "Insignias incompletas",
        description: `Te faltan ${unplaced.length} insignia(s) por colocar.`,
        variant: "destructive",
      });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { station9Confirmed: true }, { merge: true });
      setIsStationConfirmed(true);
      setSelectedPrizeId(null);
      setResizePrizeId(null);
      setMoveModePrizeId(null);

      toast({
        title: "Estación confirmada",
        description: "Tus insignias han sido bloqueadas. Ahora puedes descargar la foto de tu estación.",
      });
    } catch (e) {
      console.error("Error saving station", e);
      toast({ title: "Error", description: "Ocurrió un problema al confirmar la estación.", variant: "destructive" });
    }
  };

  const handleUnlockStation = async () => {
    if (!user || !db) return;

    if (isStationFinalized) {
      toast({
        title: "Estación finalizada",
        description: "Ya descargaste la foto de tu estación. No se puede modificar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { station9Confirmed: false }, { merge: true });
      setIsStationConfirmed(false);
      setSelectedPrizeId(null);
      setResizePrizeId(null);
      setMoveModePrizeId(null);

      toast({ title: "Modo edición activado", description: "Ahora puedes mover y cambiar el tamaño de tus insignias." });
    } catch (e) {
      console.error("Error unlocking station", e);
      toast({ title: "Error", description: "No se pudo modificar la estación.", variant: "destructive" });
    }
  };

  // ------------------------------------------------------------------
  // Descargar / Compartir imagen
  // ------------------------------------------------------------------
  const finalizeDownload = async () => {
    if (!user || !db) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { station9Finalized: true }, { merge: true });
      setIsStationFinalized(true);

      toast({ title: "Imagen lista", description: "Tu estación ha sido procesada." });
      setTimeout(() => setIsCompletionDialogOpen(true), 1000);
    } catch (e) {
      console.error("Error finalizing download", e);
    }
  };

  const handleDownloadImage = async () => {
    if (!user || !db || !canvasRef.current) return;

    if (!isStationConfirmed) {
      toast({
        title: "Primero confirma tu estación",
        description: "Debes pulsar 'Confirmar estación' antes de descargar la imagen.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSelectedPrizeId(null);
      setResizePrizeId(null);
      setMoveModePrizeId(null);

      await new Promise((r) => setTimeout(r, 350));

      const capture = await html2canvas(canvasRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: typeof window !== "undefined" ? Math.max(1, window.devicePixelRatio) : 1,
      });

      capture.toBlob(async (blob) => {
        if (!blob) {
          toast({ title: "Error", description: "No se pudo generar la imagen.", variant: "destructive" });
          return;
        }

        const file = new File([blob], "mi-estacion-kairu.png", { type: "image/png" });

        const canShare =
          isMobile &&
          typeof navigator !== "undefined" &&
          "share" in navigator &&
          (!("canShare" in navigator) || (navigator as any).canShare?.({ files: [file] }));

        if (canShare) {
          try {
            await (navigator as any).share({
              files: [file],
              title: "Mi Estación Kairu",
              text: "¡Mira la estación que creé en EcoQuest Explorers!",
            });
            await finalizeDownload();
            return;
          } catch (error) {
            if ((error as DOMException).name === "AbortError") return;
            console.error("Error sharing image:", error);
          }
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "mi-estacion-kairu.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        await finalizeDownload();
      }, "image/png");
    } catch (e) {
      console.error("Error downloading image", e);
      toast({ title: "Error", description: "Ocurrió un problema al descargar la estación.", variant: "destructive" });
    }
  };

  // ------------------------------------------------------------------
  // Guardar lienzo escogido
  // ------------------------------------------------------------------
  const handleScenarioSelect = async (scenarioImageUrl: string) => {
    if (!user || !db) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { chosenScenario: scenarioImageUrl }, { merge: true });
      setChosenScenario(scenarioImageUrl);
      toast({ title: "Lienzo guardado", description: "Tu estación ahora tiene un fondo." });
    } catch (error) {
      console.error("Failed to save chosen scenario:", error);
      toast({ title: "Error", description: "No se pudo guardar tu selección de lienzo.", variant: "destructive" });
    }
  };

  // ------------------------------------------------------------------
  // Auxiliares
  // ------------------------------------------------------------------
  const unplacedPrizes = useMemo(
    () => collectedPrizes.filter((p) => !placedPrizes.some((pp) => pp.id === p.id)),
    [collectedPrizes, placedPrizes]
  );

  const allPrizesPlaced = collectedPrizes.length > 0 && unplacedPrizes.length === 0;

  // ------------------------------------------------------------------
  // Loading
  // ------------------------------------------------------------------
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        Cargando tu estación personalizada...
      </div>
    );
  }

  const yaraMessage = `${playerName}, ¡Ya eres un Guardián de la Naturaleza! Ahora es tiempo de armar tu Estación. Moverás tus Insignias por todo tu lienzo; para ello, debes arrastrarlas desde la barra lateral.`;

  // ------------------------------------------------------------------
  // Sidebar Content
  // ------------------------------------------------------------------
  const SidebarContent = () => (
    <>
      <div className="flex-grow w-full overflow-x-auto md:overflow-x-hidden md:overflow-y-auto">
        <div className="flex flex-row md:flex-col gap-2 p-1 h-full md:h-auto">
          {unplacedPrizes.map((prize) => (
            <div className="w-20 h-20 md:w-full md:aspect-square shrink-0" key={prize.id}>
              <DraggablePrize prize={prize} onDragEnd={(event, info) => handlePrizeDrop(prize.id, info)} />
            </div>
          ))}

          {unplacedPrizes.length === 0 && collectedPrizes.length > 0 && (
            <div className="w-full h-full flex items-center justify-center px-4">
              <p className="text-white/70 text-xs text-center">¡Todas colocadas!</p>
            </div>
          )}

          {collectedPrizes.length === 0 && (
            <div className="w-full h-full flex items-center justify-center px-4">
              <p className="text-white/70 text-xs text-center">No tienes insignias aún</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-full mt-auto flex flex-row md:flex-col gap-2 p-1">
        {!isStationConfirmed && allPrizesPlaced && (
          <Button onClick={handleSaveStation} className="flex-1 md:w-full text-xs md:text-sm" size="sm">
            <Check className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
            <span className="hidden md:inline">Confirmar estación</span>
            <span className="md:hidden">Confirmar</span>
          </Button>
        )}

        {isStationConfirmed && !isStationFinalized && (
          <Button onClick={handleUnlockStation} className="flex-1 md:w-full text-xs md:text-sm" variant="outline" size="sm">
            Modificar
          </Button>
        )}

        <Button
          onClick={handleDownloadImage}
          className="flex-1 md:w-full text-xs md:text-sm"
          disabled={!isStationConfirmed}
          variant={isStationFinalized ? "secondary" : "default"}
          size="sm"
        >
          <Download className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
          <span className="hidden md:inline">Descargar foto</span>
          <span className="md:hidden">Descargar</span>
        </Button>
      </div>

      {isStationFinalized && (
        <Button onClick={() => setIsCompletionDialogOpen(true)} className="mt-2 w-full text-xs" variant="secondary" size="sm">
          Finalizar
        </Button>
      )}
    </>
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  if (!chosenScenario) {
    return <ScenarioPicker onScenarioSelect={handleScenarioSelect} />;
  }

  return (
    <TooltipProvider>
      <div
        className="relative w-screen h-screen bg-background overflow-hidden"
        onClick={(e) => {
          if (!(e.target as HTMLElement).closest(".placed-prize-wrapper") && !(e.target as HTMLElement).closest(".prize-editor")) {
            setSelectedPrizeId(null);
            setResizePrizeId(null);
            setMoveModePrizeId(null);
          }
        }}
      >
        {/* LIENZO */}
        <div ref={canvasRef} className="absolute inset-0 z-10 overflow-hidden">
          {scenarioBackgrounds ? (
            <ResponsiveBackground
              desktopSrc={scenarioBackgrounds.desktopSrc}
              tabletSrc={scenarioBackgrounds.tabletSrc}
              mobileSrc={scenarioBackgrounds.mobileSrc}
            />
          ) : null}

          {/* INSIGNIAS COLOCADAS */}
          <div className="absolute inset-0 z-10">
            {placedPrizes.map((prize) => {
              const isSelected = selectedPrizeId === prize.id;
              const isEditing = resizePrizeId === prize.id;
              const isMoveMode = moveModePrizeId === prize.id;

              const leftPercent = normToPercent(prize.nx);
              const topPercent = normToPercent(prize.ny);

              // Drag solo si está en modo mover
              const canDrag = !isStationConfirmed && isMoveMode && !isEditing;

              return (
                <motion.div
                  key={prize.id}
                  drag={canDrag}
                  dragMomentum={false}
                  dragElastic={0}
                  dragTransition={{ power: 0, timeConstant: 100 }}
                  dragConstraints={canvasRef}
                  onDragStart={() => {
                    setSelectedPrizeId(prize.id);
                    // si está moviendo, cierro resize para no pelear
                    setResizePrizeId(null);
                  }}
                  onDragEnd={async (_event, info) => {
                    if (isStationConfirmed || !canvasRef.current) return;

                    const rect = canvasRef.current.getBoundingClientRect();

                    let nx = (info.point.x - rect.left) / rect.width;
                    let ny = (info.point.y - rect.top) / rect.height;

                    const clamped = clampNormByMargin(nx, ny, prize.scale || 1);
                    nx = clamped.nx;
                    ny = clamped.ny;

                    const updated = placedPrizes.map((p) => (p.id === prize.id ? { ...p, nx, ny } : p));
                    setPlacedPrizes(updated);
                    await savePrizesToDb(updated);
                  }}
                  className="placed-prize-wrapper absolute"
                  style={{
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    width: `calc(min(8vw, 8vh) * ${prize.scale || 1})`,
                    height: `calc(min(8vw, 8vh) * ${prize.scale || 1})`,
                    transform: "translate(-50%, -50%)",
                    touchAction: "none",
                    cursor: isStationConfirmed ? "default" : canDrag ? "grab" : "pointer",
                  }}
                  initial={false}
                  animate={{
                    boxShadow: isSelected ? "0px 0px 15px rgba(255,255,100,0.8)" : "0px 0px 0px rgba(0,0,0,0)",
                    zIndex: isSelected ? 40 : 20,
                  }}
                  transition={{ duration: 0.15 }}
                  // ✅ Click/tap: selecciona y abre editor (sin activar drag automático)
                  onClick={(e) => {
                    if (isStationConfirmed) return;
                    e.stopPropagation();
                    setSelectedPrizeId(prize.id);
                    setResizePrizeId((prev) => (prev === prize.id ? null : prize.id));
                    // al abrir editor, apaga mover
                    setMoveModePrizeId(null);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <div className="w-full h-full relative select-none">
                    <Image src={prize.imageUrl} alt={prize.name} fill style={{ objectFit: "contain" }} draggable={false} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR / BOTTOM SHEET */}
        {isMobile ? (
          <Sheet>
            <SheetTrigger asChild>
              <Button className="absolute bottom-4 left-4 z-40 bg-black/70 backdrop-blur-sm text-white hover:bg-black">
                <Gift className="mr-2 h-4 w-4" />
                Insignias
              </Button>
            </SheetTrigger>

            <SheetContent side="bottom" className="h-[40vh] bg-black/70 backdrop-blur-sm border-t-2 border-white/20 text-white">
              <SheetHeader>
                <SheetTitle className="text-white">Tus Insignias</SheetTitle>
              </SheetHeader>

              <div className="h-full flex flex-col pt-2">
                <div className="flex-grow w-full overflow-x-auto">
                  <div className="flex flex-row gap-2 p-1">
                    {unplacedPrizes.map((prize) => (
                      <div className="w-20 h-20 shrink-0" key={prize.id}>
                        <DraggablePrize prize={prize} onDragEnd={(event, info) => handlePrizeDrop(prize.id, info)} />
                      </div>
                    ))}

                    {unplacedPrizes.length === 0 && collectedPrizes.length > 0 && (
                      <div className="w-full h-full flex items-center justify-center px-4">
                        <p className="text-white/70 text-xs text-center">¡Todas colocadas!</p>
                      </div>
                    )}

                    {collectedPrizes.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center px-4">
                        <p className="text-white/70 text-xs text-center">No tienes insignias aún</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full mt-auto flex flex-row gap-2 p-1">
                  {!isStationConfirmed && allPrizesPlaced && (
                    <Button onClick={handleSaveStation} className="flex-1 text-xs" size="sm">
                      <Check className="h-3 w-3 mr-1" />
                      Confirmar
                    </Button>
                  )}

                  {isStationConfirmed && !isStationFinalized && (
                    <Button onClick={handleUnlockStation} className="flex-1 text-xs" variant="outline" size="sm">
                      Modificar
                    </Button>
                  )}

                  <Button
                    onClick={handleDownloadImage}
                    className="flex-1 text-xs"
                    disabled={!isStationConfirmed}
                    variant={isStationFinalized ? "secondary" : "default"}
                    size="sm"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Descargar
                  </Button>
                </div>

                {isStationFinalized && (
                  <Button onClick={() => setIsCompletionDialogOpen(true)} className="mt-2 w-full text-xs" variant="secondary" size="sm">
                    Finalizar
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        ) : (
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                className="absolute z-30 bg-black/60 backdrop-blur-sm p-2 flex items-center top-0 right-0 h-full w-32 flex-col"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <h3 className="text-white font-bold text-sm mb-2 text-center mt-12">Insignias</h3>
                <SidebarContent />
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* BOTÓN TOGGLE SIDEBAR (Desktop) */}
        {!isMobile && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute top-4 right-4 z-40 bg-white/80"
          >
            <AnimatePresence mode="wait" initial={false}>
              {isSidebarOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <X />
                </motion.div>
              ) : (
                <motion.div
                  key="open"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Gift />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        )}

        {/* PANEL EDITOR (resize + mover + eliminar) */}
        {resizePrizeId && !isStationConfirmed && (
          <div
            className={`
              prize-editor fixed z-50 max-w-lg w-[92vw]
              bg-background/95 p-3 rounded-xl shadow-xl 
              flex items-center gap-3
              ${isMobile ? "left-1/2 bottom-4 -translate-x-1/2" : "top-4 left-4"}
            `}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const prize = placedPrizes.find((p) => p.id === resizePrizeId);
              if (!prize) return null;

              const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;
              const isMoveMode = moveModePrizeId === prize.id;

              return (
                <>
                  <div className="w-10 h-10 relative shrink-0">
                    <Image src={prize.imageUrl} alt={prize.name} fill style={{ objectFit: "contain" }} />
                  </div>

                  {/* Botones +/- para móvil (rápido) */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => bumpScale(prize.id, -0.2)}
                    aria-label="Disminuir"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>

                  <Slider
                    value={[prize.scale || 1]}
                    min={0.5}
                    max={maxScale}
                    step={0.1}
                    onValueChange={(value) => handleScaleChange(prize.id, value)}
                    onValueCommit={(value) => handleScaleCommit(prize.id, value)}
                    className="flex-1"
                  />

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => bumpScale(prize.id, +0.2)}
                    aria-label="Aumentar"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  {/* Toggle mover (handle) */}
                  <Button
                    variant={isMoveMode ? "default" : "outline"}
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setMoveModePrizeId((prev) => (prev === prize.id ? null : prize.id))}
                    aria-label="Mover"
                    title="Mover"
                  >
                    <Move className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => handleDeletePrize(prize.id)}
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => {
                      setResizePrizeId(null);
                      setMoveModePrizeId(null);
                    }}
                    aria-label="Cerrar"
                  >
                    <X className="h-4 w-4" />
                  </Button>

                  {isMoveMode && (
                    <span className="ml-1 text-xs text-muted-foreground hidden md:inline">
                      Modo mover activo: arrastra la insignia
                    </span>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* DIÁLOGO YARA */}
        <AnimatePresence>
          {isYaraMessageVisible && yaraCharImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsYaraMessageVisible(false)}
            >
              <div className="relative flex flex-col md:flex-row items-center gap-4 max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
                <div className="w-32 h-auto md:w-48 shrink-0 order-first md:order-last">
                  <Image
                    src={yaraCharImage.imageUrl}
                    alt={yaraCharImage.description}
                    width={150}
                    height={187}
                    className="h-auto w-full select-none"
                  />
                </div>

                <div className="w-full">
                  <Card className="p-4 shadow-lg bg-white/95 relative">
                    <TypewriterText text={yaraMessage} className="text-base text-primary font-medium" />
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 md:left-auto md:right-[-10px] md:top-1/2 md:-translate-y-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white/95 md:border-t-[10px] md:border-t-transparent md:border-b-[10px] md:border-b-transparent md:border-l-[10px] md:border-l-white/95" />
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <CompletionDialog open={isCompletionDialogOpen} onOpenChange={setIsCompletionDialogOpen} />
      </div>
    </TooltipProvider>
  );
}