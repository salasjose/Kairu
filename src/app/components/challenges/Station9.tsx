'use client';

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
import { Trash2, Gift, X, Edit, Check, Download } from "lucide-react";
import ResponsiveBackground from "../ResponsiveBackground";

// ------------------------------------------------------------------
// Tipos
// ------------------------------------------------------------------

type PlacedPrize = {
  id: string;
  imageUrl: string;
  name: string;
  x: number;      // porcentaje 0–100 relativo al ancho del lienzo
  y: number;      // porcentaje 0–100 relativo al alto del lienzo
  scale: number;  // tamaño relativo
  stationId: number;
};

// ------------------------------------------------------------------
// Utils
// ------------------------------------------------------------------

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

// ------------------------------------------------------------------
// Componente: DraggablePrize (INSIGNIAS EN EL SIDEBAR)
// ------------------------------------------------------------------

const DraggablePrize = ({
  prize,
  onDragEnd,
}: {
  prize: Prize;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}) => {
  return (
    <motion.div
      key={prize.id}
      drag
      dragMomentum={false}
      onDragEnd={onDragEnd}
      className="w-full aspect-square bg-white/20 rounded-md p-1 cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }} // mejora drag en móviles
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
        { name: "Terral", ...PlaceHolderImages.find((p) => p.id === "scenario-bosque-seco") },
        { name: "Civika", ...PlaceHolderImages.find((p) => p.id === "scenario-ciudad") },
        { name: "Mareva", ...PlaceHolderImages.find((p) => p.id === "scenario-mar-costero") },
        { name: "Manglia", ...PlaceHolderImages.find((p) => p.id === "scenario-manglares") },
      ].filter((s) => s.imageUrl) as any[],
    []
  );

  return (
    <div className="w-full h-full bg-background/80 backdrop-blur-sm flex items-center justify-center p-8 text-center">
      <Card className="p-8 max-w-4xl">
        <h2 className="text-2xl font-bold text-primary mb-4">Elige tu Lienzo</h2>
        <p className="text-muted-foreground mb-6">
          Parece que no tienes un lienzo asignado. Por favor, selecciona uno para continuar
          y crear tu estación.
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

  const [isStationLocked, setIsStationLocked] = useState(false);
  const [isStationFinalized, setIsStationFinalized] = useState(false);

  const { user } = useUser();
  const db = useFirestore();
  const { prizes: collectedPrizes } = usePrizeCart();
  const collectedPrizesFromStations1to8 = useMemo(
    () => collectedPrizes.filter((p) => p.stationId >= 1 && p.stationId <= 8),
    [collectedPrizes]
  );

  // Lienzo principal: TODO lo que se descarga y donde se colocan insignias
  const canvasRef = useRef<HTMLDivElement | null>(null);

  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara-final");
  const yaraTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mapeo de fondos responsivos
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
  // Carga de datos desde Firestore
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
          const fullName = `${data.nombre || ""} ${data.apellido || ""}`.trim();
          setPlayerName(fullName || "Guardián");
          setIsStationLocked(data.station9Locked || false);
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
  // Mensaje de Yara (aparece automáticamente)
  // ------------------------------------------------------------------

  const scheduleYaraDialog = useCallback(() => {
    if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    if (!chosenScenario) return;

    // Espera 1 segundo y muestra mensaje
    const showTimer = setTimeout(() => {
      setIsYaraMessageVisible(true);
      // Lo oculta luego de 15 segundos
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
  // Guardar insignias en Firestore
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

  const handlePrizeDrop = async (prizeId: string, info: PanInfo) => {
    if (!canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const pointerX = info.point.x;
    const pointerY = info.point.y;

    // posición relativa en porcentaje
    let x = ((pointerX - canvasRect.left) / canvasRect.width) * 100;
    let y = ((pointerY - canvasRect.top) / canvasRect.height) * 100;

    // Clampear para que nunca queden pegadas a los bordes
    x = clamp(x, 5, 95);
    y = clamp(y, 5, 95);

    const prizeData = collectedPrizesFromStations1to8.find(
      (p) => p.id === prizeId
    );
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
  // Cambio de escala (tamaño) de una insignia en el lienzo
  // ------------------------------------------------------------------

  const handleScaleChange = (prizeId: string, newScale: number[]) => {
    const updated = placedPrizes.map((p) =>
      p.id === prizeId ? { ...p, scale: newScale[0] } : p
    );
    setPlacedPrizes(updated);
  };

  const handleScaleChangeCommit = async (prizeId: string, newScale: number[]) => {
    const updated = placedPrizes.map((p) =>
      p.id === prizeId ? { ...p, scale: newScale[0] } : p
    );
    setPlacedPrizes(updated);
    await savePrizesToDb(updated);
  };

  // ------------------------------------------------------------------
  // Quitar insignia del lienzo (y regresa al sidebar, NO se elimina)
  // ------------------------------------------------------------------

  const handleDeletePrize = async (prizeId: string) => {
    const newPlacedPrizes = placedPrizes.filter((p) => p.id !== prizeId);
    setPlacedPrizes(newPlacedPrizes);
    await savePrizesToDb(newPlacedPrizes);
    setSelectedPrizeId(null);
  };

  // ------------------------------------------------------------------
  // Confirmar estación (bloquear edición pero aún permitir "Modificar")
  // ------------------------------------------------------------------

  const handleConfirmStation = async () => {
    if (!user || !db) return;
    setIsStationLocked(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          station9Locked: true,
        },
        { merge: true }
      );
      toast({
        title: "Estación confirmada",
        description: "¡Tu diseño ha sido guardado!",
      });
    } catch (e) {
      console.error("Error confirming station", e);
      setIsStationLocked(false);
      toast({
        title: "Error",
        description: "No se pudo confirmar la estación.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // Desbloquear estación (permitir modificar nuevamente)
  // ------------------------------------------------------------------

  const handleModifyStation = async () => {
    if (!user || !db) return;
    setIsStationLocked(false);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          station9Locked: false,
        },
        { merge: true }
      );
    } catch (e) {
      console.error("Error unlocking station", e);
      setIsStationLocked(true);
      toast({
        title: "Error",
        description: "No se pudo desbloquear la estación.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // Guardar completo + descargar imagen (finalizar estación)
  // ------------------------------------------------------------------

  const handleSaveAndDownload = async () => {
    if (!user || !db || !canvasRef.current) return;

    try {
      // Marcar como finalizada y bloqueada
      setIsStationLocked(true);
      setIsStationFinalized(true);

      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        {
          station9Locked: true,
          station9Finalized: true,
          placedPrizes,
        },
        { merge: true }
      );

      // Descargar como imagen
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(canvasRef.current, {
        useCORS: true,
        backgroundColor: null,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "mi-estacion-guardian.png";
      link.click();

      toast({
        title: "Estación finalizada",
        description:
          "Tu estación ha sido guardada y descargada como imagen. Ya no se puede modificar.",
      });
    } catch (e) {
      console.error("Error saving and downloading station", e);
      toast({
        title: "Error",
        description:
          "Ocurrió un problema al guardar o descargar la estación. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  // ------------------------------------------------------------------
  // Completar reto (abre diálogo final)
  // ------------------------------------------------------------------

  const handleCompleteChallenge = () => {
    setIsCompletionDialogOpen(true);
  };

  // ------------------------------------------------------------------
  // Guardar elección de escenario
  // ------------------------------------------------------------------

  const handleScenarioSelect = async (scenarioUrl: string) => {
    if (!user || !db) {
      toast({
        title: "Error",
        description:
          "No se puede guardar la selección. Intenta iniciar sesión de nuevo.",
        variant: "destructive",
      });
      return;
    }
    try {
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(
        userDocRef,
        { chosenScenario: scenarioUrl },
        { merge: true }
      );
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
  // Derivados: insignias no colocadas y estado de completitud
  // ------------------------------------------------------------------

  const unplacedPrizes = useMemo(
    () =>
      collectedPrizesFromStations1to8.filter(
        (p) => !placedPrizes.some((pp) => pp.id === p.id)
      ),
    [collectedPrizesFromStations1to8, placedPrizes]
  );

  const allPrizesPlaced =
    collectedPrizesFromStations1to8.length > 0 &&
    unplacedPrizes.length === 0;

  // ------------------------------------------------------------------
  // UI de carga
  // ------------------------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-background">
        Cargando tu estación personalizada...
      </div>
    );
  }

  const yaraMessage = `${playerName}, ¡Ya eres un Guardián de la Naturaleza! Ahora es tiempo de armar tu Estación. Moverás tus Insignias por todo tu lienzo; para ello, debes hacer doble clic y sostener tu insignia sin soltarla hasta el lugar donde la quieras tener.`;

  // ------------------------------------------------------------------
  // Render principal
  // ------------------------------------------------------------------

  return (
    <>
      <div
        className="relative w-screen min-h-screen bg-background overflow-x-hidden"
        onClick={(e) => {
          if ((e.target as HTMLElement).closest(".placed-prize-wrapper")) return;
          setSelectedPrizeId(null);
        }}
      >
        {/* Fondo de escenario o selector de escenario */}
        {chosenScenario && scenarioBackgrounds ? (
          <ResponsiveBackground
            desktopSrc={scenarioBackgrounds.desktopSrc}
            tabletSrc={scenarioBackgrounds.tabletSrc}
            mobileSrc={scenarioBackgrounds.mobileSrc}
          />
        ) : (
          <ScenarioPicker onScenarioSelect={handleScenarioSelect} />
        )}

        {/* Lienzo principal (zona que se descarga como imagen) */}
        {chosenScenario && (
          <div className="absolute inset-0 flex items-center justify-center z-20 px-2 md:px-4">
            <div
              ref={canvasRef}
              className="
                relative 
                w-full 
                max-w-5xl 
                aspect-[16/9] 
                bg-black/40 
                rounded-xl 
                overflow-hidden 
                shadow-xl
                max-h-[80vh]   /* asegura que no se salga de la pantalla en móvil */
              "
            >
              {/* Capa de fondo dentro del lienzo para asegurar visual consistente */}
              {scenarioBackgrounds && (
                <div className="absolute inset-0">
                  <ResponsiveBackground
                    desktopSrc={scenarioBackgrounds.desktopSrc}
                    tabletSrc={scenarioBackgrounds.tabletSrc}
                    mobileSrc={scenarioBackgrounds.mobileSrc}
                  />
                </div>
              )}

              {/* Insignias colocadas */}
              <div className="absolute inset-0">
                {placedPrizes.map((prize) => {
                  const isSelected = selectedPrizeId === prize.id;
                  const isSpecialPrize =
                    prize.imageUrl.includes("Molinos.png") ||
                    prize.imageUrl.includes("Ciudad.png");

                  return (
                    <motion.div
                      key={prize.id}
                      drag={!isStationLocked && !isStationFinalized}
                      dragMomentum={false}
                      onDragStart={() => {
                        if (!isStationLocked && !isStationFinalized) {
                          setSelectedPrizeId(prize.id);
                        }
                      }}
                      onDragEnd={async (e, info) => {
                        if (isStationLocked || isStationFinalized) return;
                        if (!canvasRef.current) return;

                        const rect = canvasRef.current.getBoundingClientRect();

                        // posición previa en px
                        const prevX = (prize.x / 100) * rect.width + rect.left;
                        const prevY = (prize.y / 100) * rect.height + rect.top;

                        // nueva posición sumando offset del drag
                        let newX =
                          ((prevX + info.offset.x - rect.left) / rect.width) * 100;
                        let newY =
                          ((prevY + info.offset.y - rect.top) / rect.height) * 100;

                        newX = clamp(newX, 5, 95);
                        newY = clamp(newY, 5, 95);

                        const updated = placedPrizes.map((p) =>
                          p.id === prize.id ? { ...p, x: newX, y: newY } : p
                        );
                        setPlacedPrizes(updated);
                        await savePrizesToDb(updated);
                      }}
                      className="placed-prize-wrapper absolute cursor-grab active:cursor-grabbing"
                      style={{
                        left: `${prize.x}%`,
                        top: `${prize.y}%`,
                        // tamaño responsivo: mínimo 48px, máximo 96px aprox
                        width: `calc(clamp(48px, 10vw, 96px) * ${prize.scale || 1})`,
                        height: `calc(clamp(48px, 10vw, 96px) * ${prize.scale || 1})`,
                        transform: "translate(-50%, -50%)",
                        touchAction: "none",
                      }}
                      initial={false}
                      animate={{
                        boxShadow: isSelected
                          ? "0px 0px 15px rgba(255,255,100,0.8)"
                          : "0px 0px 0px rgba(0,0,0,0)",
                      }}
                      transition={{ duration: 0.15 }}
                      onClick={(e) => {
                        if (isStationLocked || isStationFinalized) return;
                        e.stopPropagation();
                        setSelectedPrizeId(prize.id);
                      }}
                    >
                      <div className="w-full h-full relative">
                        <Image
                          src={prize.imageUrl}
                          alt={prize.name}
                          fill
                          style={{ objectFit: "contain" }}
                        />
                      </div>

                      {/* Panel de controles (escala + quitar del lienzo) */}
                      {isSelected && !isStationLocked && !isStationFinalized && (
                        <div
                          className={`
                            absolute 
                            ${prize.y < 70 ? "top-full mt-2" : "bottom-full mb-2"} 
                            left-1/2 -translate-x-1/2 
                            w-44 bg-background/90 p-2 rounded-lg shadow-lg 
                            flex items-center gap-2
                          `}
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Slider
                            value={[prize.scale || 1]}
                            min={0.5}
                            max={isSpecialPrize ? 7 : 2.5}
                            step={0.1}
                            onValueChange={(value) =>
                              handleScaleChange(prize.id, value)
                            }
                            onValueCommit={(value) =>
                              handleScaleChangeCommit(prize.id, value)
                            }
                          />
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleDeletePrize(prize.id)}
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
          </div>
        )}

        {/* Sidebar de insignias y controles (solo si hay escenario) */}
        {chosenScenario && (
          <>
            {/* Botón para abrir/cerrar sidebar */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute top-4 right-4 z-40 bg-white/80"
            >
              <AnimatePresence initial={false}>
                {isSidebarOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                  >
                    <X />
                  </motion.div>
                ) : (
                  <motion.div
                    key="open"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                  >
                    <Gift />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>

            {/* Panel lateral */}
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div
                  className="absolute top-0 right-0 h-full w-24 md:w-32 bg-black/60 backdrop-blur-sm p-2 z-30 flex flex-col items-center"
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <h3 className="text-white font-bold text-sm mt-12 mb-2 text-center">
                    Insignias
                  </h3>
                  <div className="flex-grow overflow-y-auto space-y-2 w-full">
                    {unplacedPrizes.map((prize) => (
                      <DraggablePrize
                        key={prize.id}
                        prize={prize}
                        onDragEnd={(event, info) =>
                          handlePrizeDrop(prize.id, info)
                        }
                      />
                    ))}
                    {unplacedPrizes.length === 0 && (
                      <p className="text-white/70 text-xs text-center pt-4">
                        ¡Todas las insignias colocadas!
                      </p>
                    )}
                  </div>

                  {/* Botones de flujo (Confirmar / Modificar / Guardar completo / Descargar) */}
                  {allPrizesPlaced && !isStationFinalized && (
                    <>
                      {!isStationLocked ? (
                        <Button
                          onClick={handleConfirmStation}
                          className="mt-4 w-full"
                        >
                          <Check className="mr-2 h-4 w-4" />
                          Confirmar
                        </Button>
                      ) : (
                        <>
                          <Button
                            onClick={handleModifyStation}
                            className="mt-4 w-full"
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Modificar
                          </Button>
                          <Button
                            onClick={handleSaveAndDownload}
                            className="mt-2 w-full"
                            variant="secondary"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Guardar completo
                          </Button>
                        </>
                      )}
                    </>
                  )}

                  {isStationFinalized && (
                    <Button
                      onClick={handleSaveAndDownload}
                      className="mt-4 w-full"
                      variant="secondary"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Descargar
                    </Button>
                  )}

                  {isStationLocked && (
                    <Button
                      onClick={handleCompleteChallenge}
                      className="mt-2 w-full"
                      variant="outline"
                    >
                      Completar
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mensaje de Yara */}
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
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Diálogo de completitud */}
      <CompletionDialog
        open={isCompletionDialogOpen}
        onOpenChange={setIsCompletionDialogOpen}
      />
    </>
  );
}
