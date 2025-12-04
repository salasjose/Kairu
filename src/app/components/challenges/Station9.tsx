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

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------

type PlacedPrize = {
  id: string;
  imageUrl: string;
  name: string;
  x: number; // porcentaje 0-100 del ancho del lienzo
  y: number; // porcentaje 0-100 del alto del lienzo
  scale: number;
  stationId: number;
};

// ------------------------------------------------------------------
// Utils
// ------------------------------------------------------------------

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// Algunas insignias pueden escalarse más (ej: íconos grandes del escenario)
const isSpecialPrize = (imageUrl: string) => {
  return (
    imageUrl.includes("Molinos.png") ||
    imageUrl.includes("Ciudad.png")
    // aquí puedes agregar más patrones si lo necesitas
  );
};

// ------------------------------------------------------------------
// Componente: DraggablePrize (INSIGNIAS EN EL SIDEBAR)
// ------------------------------------------------------------------

const DraggablePrize = ({
  prize,
  onDragEnd,
}: {
  prize: Prize;
  onDragEnd: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => void;
}) => {
  return (
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
  );
};

// ------------------------------------------------------------------
// Componente: ScenarioPicker (ELEGIR LIENZO)
// ------------------------------------------------------------------

const ScenarioPicker = ({
  onScenarioSelect,
}: {
  onScenarioSelect: (url: string) => void;
}) => {
  const scenarios = useMemo(
    () =>
      [
        {
          name: "Terral",
          ...PlaceHolderImages.find((p) => p.id === "scenario-bosque-seco"),
        },
        {
          name: "Civika",
          ...PlaceHolderImages.find((p) => p.id === "scenario-ciudad"),
        },
        {
          name: "Mareva",
          ...PlaceHolderImages.find((p) => p.id === "scenario-mar-costero"),
        },
        {
          name: "Manglia",
          ...PlaceHolderImages.find((p) => p.id === "scenario-manglares"),
        },
      ].filter((s) => s.imageUrl) as any[],
    []
  );

  return (
    <div className="w-full h-full bg-background/80 backdrop-blur-sm flex items-center justify-center p-8 text-center">
      <Card className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold text-primary mb-4">Elige tu Lienzo</h2>
        <p className="text-muted-foreground mb-6">
          Parece que no tienes un lienzo asignado. Por favor, selecciona uno
          para continuar y crear tu estación.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {scenarios.map((scenario) => (
            <Card
              key={scenario.id}
              onClick={() => onScenarioSelect(scenario.imageUrl)}
              className="p-2 cursor-pointer hover:border-primary hover:scale-105 transition-transform duration-300"
            >
              <Image
                src={scenario.imageUrl}
                alt={scenario.description}
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
};

// ------------------------------------------------------------------
// Componente principal: Station9
// ------------------------------------------------------------------

export default function Station9() {
  const [chosenScenario, setChosenScenario] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);

  const [placedPrizes, setPlacedPrizes] = useState<PlacedPrize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string | null>(null);

  const [isCompletionDialogOpen, setIsCompletionDialogOpen] = useState(false);
  const [isYaraMessageVisible, setIsYaraMessageVisible] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isStationConfirmed, setIsStationConfirmed] = useState(false);
  const [isStationFinalized, setIsStationFinalized] = useState(false);

  const { user } = useUser();
  const db = useFirestore();
  const { prizes: collectedPrizes } = usePrizeCart();

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const yaraCharImage = PlaceHolderImages.find(
    (p) => p.id === "char-yara-final"
  );
  const yaraTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMobile = useIsMobile();

  const scenarioImageUrl = useMemo(() => {
    if (!chosenScenario) return null;
    if (chosenScenario.includes("Bosque_Seco_Tropical"))
      return "/backgrounds/Terral1366_X_768.png";
    if (chosenScenario.includes("Ciudad_Sostenible"))
      return "/backgrounds/Civika1366_X_768.png";
    if (chosenScenario.includes("Mar_Costero"))
      return "/backgrounds/Mareva1366_X_768.png";
    if (chosenScenario.includes("Manglares"))
      return "/backgrounds/Manglia1366_X_768.png";
    return null;
  }, [chosenScenario]);

  // ------------------------------------------------------------------
  // Carga de datos de usuario
  // ------------------------------------------------------------------

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

          setPlacedPrizes(
            (data.placedPrizes || []).map((p: any) => ({
              ...p,
              scale: p.scale || 1,
            }))
          );

          const fullName =
            data.usuario || `${data.nombre || ""} ${data.apellido || ""}`.trim();
          setPlayerName(fullName || "Guardián");

          const confirmed = data.station9Confirmed || false;
          const finalized = data.station9Finalized || false;

          setIsStationConfirmed(confirmed || finalized);
          setIsStationFinalized(finalized);
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
  // Mensaje de Yara programado
  // ------------------------------------------------------------------

  const scheduleYaraDialog = useCallback(() => {
    if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    if (!chosenScenario) return;

    const showTimer = setTimeout(() => {
      setIsYaraMessageVisible(true);
      const hideTimer = setTimeout(() => setIsYaraMessageVisible(false), 15000);
      yaraTimerRef.current = hideTimer;
    }, 1000);

    yaraTimerRef.current = showTimer;
  }, [chosenScenario]);

  useEffect(() => {
    if (!isLoading) {
      scheduleYaraDialog();
    }
    return () => {
      if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    };
  }, [isLoading, scheduleYaraDialog]);

  // ------------------------------------------------------------------
  // Guardar insignias en Firestore (posición + escala)
  // ------------------------------------------------------------------

  const savePrizesToDb = useCallback(
    async (prizesToSave: PlacedPrize[]) => {
      if (!user || !db) return;
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(
          userDocRef,
          { placedPrizes: prizesToSave },
          { merge: true }
        );
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
  // Colocar insignia desde el sidebar al lienzo
  // ------------------------------------------------------------------

  const handlePrizeDrop = async (
    prizeId: string,
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (isStationConfirmed || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();

    // 👉 Centro visual de la insignia que se está soltando
    const target = event.target as HTMLElement;
    const prizeRect = target.getBoundingClientRect();
    const centerX = prizeRect.left + prizeRect.width / 2;
    const centerY = prizeRect.top + prizeRect.height / 2;

    // Verificar que el centro esté dentro del canvas
    if (
      centerX < canvasRect.left ||
      centerX > canvasRect.right ||
      centerY < canvasRect.top ||
      centerY > canvasRect.bottom
    ) {
      toast({
        title: "Fuera del lienzo",
        description: "Arrastra la insignia dentro del área del lienzo.",
        variant: "destructive",
      });
      return;
    }

    // Convertir el centro a porcentaje del lienzo
    let x = ((centerX - canvasRect.left) / canvasRect.width) * 100;
    let y = ((centerY - canvasRect.top) / canvasRect.height) * 100;

    x = clamp(x, 2, 98);
    y = clamp(y, 2, 98);

    const prizeData = collectedPrizes.find((p) => p.id === prizeId);
    if (!prizeData) return;

    const newPlacedPrize: PlacedPrize = {
      ...prizeData,
      x,
      y,
      scale: 1,
    };

    const newPlacedPrizes = [
      ...placedPrizes.filter((p) => p.id !== prizeId),
      newPlacedPrize,
    ];

    setPlacedPrizes(newPlacedPrizes);
    await savePrizesToDb(newPlacedPrizes);
  };

  // ------------------------------------------------------------------
  // Escala de insignias
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

  const handleScaleChangeCommit = async (
    prizeId: string,
    newScale: number[]
  ) => {
    if (isStationConfirmed) return;

    const prize = placedPrizes.find((p) => p.id === prizeId);
    if (!prize) return;

    const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;
    const scale = clamp(newScale[0], 0.5, maxScale);

    const updated = placedPrizes.map((p) =>
      p.id === prizeId ? { ...p, scale } : p
    );
    setPlacedPrizes(updated);
    await savePrizesToDb(updated);
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
  };

  // ------------------------------------------------------------------
  // GUARDAR / DESBLOQUEAR ESTACIÓN
  // ------------------------------------------------------------------

  const handleSaveStation = async () => {
    if (!user || !db) return;
    if (isStationConfirmed) return;

    const unplaced = collectedPrizes.filter(
      (p) => !placedPrizes.some((pp) => pp.id === p.id)
    );
    if (collectedPrizes.length === 0 || unplaced.length > 0) {
      toast({
        title: "Insignias incompletas",
        description:
          "Debes colocar todas las insignias antes de guardar la estación.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        { station9Confirmed: true },
        { merge: true }
      );

      setIsStationConfirmed(true);
      setSelectedPrizeId(null);

      toast({
        title: "Estación guardada",
        description:
          "Tus insignias han sido bloqueadas y la estación quedó lista para descargar.",
      });
    } catch (e) {
      console.error("Error saving station", e);
      toast({
        title: "Error",
        description: "Ocurrió un problema al guardar la estación.",
        variant: "destructive",
      });
    }
  };

  const handleUnlockStation = async () => {
    if (!user || !db) return;

    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        { station9Confirmed: false, station9Finalized: false },
        { merge: true }
      );

      setIsStationConfirmed(false);
      setIsStationFinalized(false);
      setSelectedPrizeId(null);

      toast({
        title: "Estación desbloqueada",
        description:
          "Ahora puedes mover y escalar nuevamente tus insignias.",
      });
    } catch (e) {
      console.error("Error unlocking station", e);
      toast({
        title: "Error",
        description: "No se pudo desbloquear la estación.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // DESCARGAR IMAGEN
  // ------------------------------------------------------------------

  const handleDownloadImage = async () => {
    if (!user || !db || !canvasRef.current) return;

    if (!isStationConfirmed) {
      toast({
        title: "Primero guarda tu estación",
        description:
          "Debes pulsar 'Guardar estación' antes de descargar la imagen.",
        variant: "destructive",
      });
      return;
    }

    try {
      const userDocRef = doc(db, "users", user.uid);

      setSelectedPrizeId(null);
      await new Promise((resolve) => setTimeout(resolve, 200));

      const canvas = await html2canvas(canvasRef.current, {
        useCORS: true,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "mi-estacion-kairu.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await setDoc(
        userDocRef,
        { station9Finalized: true },
        { merge: true }
      );
      setIsStationFinalized(true);

      toast({
        title: "Imagen descargada",
        description: "Tu estación fue descargada correctamente.",
      });

      setTimeout(() => {
        setIsCompletionDialogOpen(true);
      }, 1000);
    } catch (e) {
      console.error("Error downloading image", e);
      toast({
        title: "Error",
        description: "Ocurrió un problema al descargar la estación.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // Guardar lienzo elegido
  // ------------------------------------------------------------------

  const handleScenarioSelect = async (scenarioUrl: string) => {
    if (!user || !db) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, { chosenScenario: scenarioUrl }, { merge: true });
      setChosenScenario(scenarioUrl);
      toast({
        title: "Lienzo guardado",
        description: "Tu estación ahora tiene un fondo.",
      });
    } catch (error) {
      console.error("Failed to save chosen scenario:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu selección de lienzo.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // Auxiliares
  // ------------------------------------------------------------------

  const unplacedPrizes = useMemo(
    () =>
      collectedPrizes.filter(
        (p) => !placedPrizes.some((pp) => pp.id === p.id)
      ),
    [collectedPrizes, placedPrizes]
  );

  const allPrizesPlaced =
    collectedPrizes.length > 0 && unplacedPrizes.length === 0;

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
  // Render
  // ------------------------------------------------------------------

  return (
    <div
      className="relative w-screen h-screen bg-background overflow-hidden"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest(".placed-prize-wrapper")) {
          setSelectedPrizeId(null);
        }
      }}
    >
      {!chosenScenario ? (
        <ScenarioPicker onScenarioSelect={handleScenarioSelect} />
      ) : (
        <>
          {/* LIENZO A PANTALLA COMPLETA */}
          <div
            ref={canvasRef}
            className="absolute inset-0 z-10 overflow-hidden"
          >
            {scenarioImageUrl && (
              <Image
                src={scenarioImageUrl}
                alt="Fondo del lienzo"
                fill
                className="object-cover"
                priority
              />
            )}

            {/* INSIGNIAS COLOCADAS */}
            <div className="absolute inset-0 z-10">
              {placedPrizes.map((prize) => {
                const isSelected = selectedPrizeId === prize.id;
                const maxScale = isSpecialPrize(prize.imageUrl) ? 7 : 5;

                return (
                  <motion.div
                    key={prize.id}
                    drag={!isStationConfirmed}
                    dragMomentum={false}
                    dragElastic={0}
                    whileDrag={{ scale: 1.05, zIndex: 50 }}
                    onDragStart={(event) => {
                      if (!isStationConfirmed) {
                        event.stopPropagation();
                        setSelectedPrizeId(prize.id);
                      }
                    }}
                    onDragEnd={async (event, info) => {
                      if (isStationConfirmed || !canvasRef.current) return;

                      const rect = canvasRef.current.getBoundingClientRect();

                      const prevXPx = (prize.x / 100) * rect.width;
                      const prevYPx = (prize.y / 100) * rect.height;

                      const newXPx = prevXPx + info.offset.x;
                      const newYPx = prevYPx + info.offset.y;

                      let newXPercent = (newXPx / rect.width) * 100;
                      let newYPercent = (newYPx / rect.height) * 100;

                      newXPercent = clamp(newXPercent, 2, 98);
                      newYPercent = clamp(newYPercent, 2, 98);

                      const updated = placedPrizes.map((p) =>
                        p.id === prize.id
                          ? { ...p, x: newXPercent, y: newYPercent }
                          : p
                      );
                      setPlacedPrizes(updated);
                      await savePrizesToDb(updated);
                    }}
                    className="placed-prize-wrapper absolute"
                    style={{
                      left: `${prize.x}%`,
                      top: `${prize.y}%`,
                      width: `calc(64px * ${prize.scale || 1})`,
                      height: `calc(64px * ${prize.scale || 1})`,
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
                      if (isStationConfirmed) return;
                      e.stopPropagation();
                      setSelectedPrizeId(prize.id);
                    }}
                    onPointerDown={(e) => {
                      if (isStationConfirmed) return;
                      e.stopPropagation();
                    }}
                  >
                    <div className="w-full h-full relative select-none">
                      <Image
                        src={prize.imageUrl}
                        alt={prize.name}
                        fill
                        style={{ objectFit: "contain" }}
                        draggable={false}
                      />
                    </div>

                    {/* CONTROLES DE ESCALA Y ELIMINAR */}
                    {isSelected && !isStationConfirmed && (
                      <div
                        className={`
                          fixed md:absolute z-50
                          ${
                            isMobile
                              ? "bottom-44 left-1/2 -translate-x-1/2"
                              : prize.y < 50
                              ? "top-full mt-2 left-1/2 -translate-x-1/2"
                              : "bottom-full mb-2 left-1/2 -translate-x-1/2"
                          }
                          w-40 max-w-[90vw]
                          bg-background/95 p-2 rounded-lg shadow-xl 
                          flex items-center gap-2
                        `}
                        onPointerDown={(e) => {
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        onTouchStart={(e) => {
                          e.stopPropagation();
                        }}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Slider
                          value={[prize.scale || 1]}
                          min={0.5}
                          max={maxScale}
                          step={0.1}
                          onValueChange={(value) =>
                            handleScaleChange(prize.id, value)
                          }
                          onValueCommit={(value) =>
                            handleScaleChangeCommit(prize.id, value)
                          }
                          className="flex-1"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrize(prize.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* BOTÓN PARA ABRIR/CERRAR SIDEBAR */}
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

          {/* SIDEBAR/BOTTOM BAR DE INSIGNIAS */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div
                className="absolute z-30 bg-black/60 backdrop-blur-sm p-2 flex items-center
                          md:top-0 md:right-0 md:h-full md:w-32 md:flex-col
                          bottom-0 left-0 right-0 h-40 flex-row"
                initial={isMobile ? { y: "100%" } : { x: "100%" }}
                animate={isMobile ? { y: 0 } : { x: 0 }}
                exit={isMobile ? { y: "100%" } : { x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <h3 className="text-white font-bold text-sm mb-2 text-center md:mt-2 hidden md:block">
                  Insignias
                </h3>

                {/* Scroll horizontal en móvil, vertical en desktop */}
                <div className="flex-grow w-full overflow-x-auto md:overflow-x-hidden md:overflow-y-auto">
                  <div className="flex flex-row md:flex-col gap-2 p-1 h-full md:h-auto">
                    {unplacedPrizes.map((prize) => (
                      <div
                        className="w-20 h-20 md:w-full md:aspect-square shrink-0"
                        key={prize.id}
                      >
                        <DraggablePrize
                          prize={prize}
                          onDragEnd={(event, info) =>
                            handlePrizeDrop(prize.id, event, info)
                          }
                        />
                      </div>
                    ))}
                    {unplacedPrizes.length === 0 && (
                      <div className="w-full h-full flex items-center justify-center px-4">
                        <p className="text-white/70 text-xs text-center">
                          ¡Todas colocadas!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div className="w-full mt-auto flex flex-row md:flex-col gap-2 p-1">
                  <Button
                    onClick={handleSaveStation}
                    className="flex-1 md:w-full text-xs md:text-sm"
                    disabled={!allPrizesPlaced || isStationConfirmed}
                    size="sm"
                  >
                    <Check className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                    <span className="hidden md:inline">Guardar</span>
                  </Button>
                  <Button
                    onClick={handleDownloadImage}
                    className="flex-1 md:w-full text-xs md:text-sm"
                    disabled={!isStationConfirmed}
                    variant={isStationFinalized ? "secondary" : "default"}
                    size="sm"
                  >
                    <Download className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                    <span className="hidden md:inline">Descargar</span>
                  </Button>

                  {/* Botón de debug / admin para desbloquear */}
                  <Button
                    onClick={handleUnlockStation}
                    className="flex-1 md:w-full text-xs md:text-sm"
                    variant="outline"
                    size="sm"
                  >
                    Desbloquear
                  </Button>
                </div>

                {isStationFinalized && (
                  <Button
                    onClick={() => setIsCompletionDialogOpen(true)}
                    className="mt-2 w-full text-xs"
                    variant="secondary"
                    size="sm"
                  >
                    Finalizar
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

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
                <div
                  className="relative flex flex-col md:flex-row items-center gap-4 max-w-2xl mx-auto"
                  onClick={(e) => e.stopPropagation()}
                >
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
                      <TypewriterText
                        text={yaraMessage}
                        className="text-base text-primary font-medium"
                      />
                      <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 md:left-auto md:right-[-10px] md:top-1/2 md:-translate-y-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-white/95 md:border-t-[10px] md:border-t-transparent md:border-b-[10px] md:border-b-transparent md:border-l-[10px] md:border-l-white/95" />
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <CompletionDialog
        open={isCompletionDialogOpen}
        onOpenChange={setIsCompletionDialogOpen}
      />
    </div>
  );
}
```