
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import PrizeDialog from "../PrizeDialog";
import { useRouter } from "next/navigation";
import { useUser, useFirestore } from "@/firebase/hooks";
import { doc, getDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { usePrizeCart } from "@/hooks/use-prize-cart";
import { allPrizes } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

export default function Station9() {
  const stationId = 9;
  const [chosenScenario, setChosenScenario] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMessages, setShowMessages] = useState(true);
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { unlockStation } = useStationProgress();
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { prizes: prizeIds } = usePrizeCart();

  const collectedPrizes = allPrizes.filter(p => prizeIds.includes(p.id));

  useEffect(() => {
    const fetchPlayerData = async () => {
      if (!user || !db) {
        setIsLoading(false);
        return;
      }
      try {
        const userDocRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().chosenScenario) {
          setChosenScenario(docSnap.data().chosenScenario);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlayerData();
  }, [user, db]);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMessages(false);
    }, 60000); // 60 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    unlockStation(stationId); // Technically station 9 is the last one
    toast({
      title: "¡Aventura Completada!",
      description: "Has finalizado todos los retos de Kairu. ¡Gracias por jugar!",
    });
    // This will trigger the main completion dialog in GameClient
  };

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    router.push("/");
  };
  
   const handleSimulateComplete = () => {
    unlockStation(stationId + 1); // Unlock a virtual "10" to trigger completion
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: "Has simulado la finalización. ¡Escoge tu premio!",
    });
    setIsPrizeModalOpen(true);
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        Cargando tu estación personalizada...
      </div>
    );
  }

  return (
    <>
      <div className="w-full min-h-screen flex flex-col items-center justify-center relative overflow-hidden">
        {chosenScenario && (
          <Image
            src={chosenScenario}
            alt="Lienzo de estación personalizada"
            fill
            style={{objectFit: 'cover'}}
            className="z-0"
          />
        )}
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full p-4">
            <AnimatePresence>
            {showMessages && (
                 <motion.div
                    key="messages"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.5 } }}
                    className="flex flex-col items-center"
                 >
                    <div className="bg-primary text-white font-headline py-3 px-10 rounded-lg shadow-lg -rotate-3 mb-8">
                        <h1 className="text-4xl md:text-5xl">Tu Estación Final</h1>
                    </div>

                    <div className="max-w-xl mx-auto bg-black/50 text-white p-4 rounded-xl mb-8">
                        <p className="font-bold text-lg">
                        YARA: "¡Lo lograste! Bienvenido a tu propia estación, el lienzo
                        que escogiste al empezar tu viaje. Este es tu espacio para crear y
                        aplicar todo lo que has aprendido. ¡Haz de él un verdadero
                        santuario para la naturaleza!"
                        </p>
                    </div>
                    
                    <div className="mt-4 max-w-md mx-auto space-y-4">
                        <p className="bg-background/80 p-4 rounded-md text-center">
                            ¡Coloca aquí las insignias que has ganado! (Funcionalidad próximamente)
                        </p>
                        <Button onClick={handleSimulateComplete} size="lg">Completar Aventura</Button>
                    </div>
                 </motion.div>
            )}
            </AnimatePresence>
            <AnimatePresence>
            {!showMessages && (
                <motion.div
                    key="prizes"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { duration: 0.5, delay: 0.5 } }}
                    className="w-full max-w-2xl"
                >
                     <Card className="bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <h2 className="text-2xl font-bold text-primary text-center mb-4">Tus Insignias Ganadas</h2>
                             {collectedPrizes.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                                {collectedPrizes.map(prize => {
                                    const Icon = prize.icon;
                                    return (
                                        <div key={prize.id} className="flex flex-col items-center justify-center p-2 border rounded-lg bg-card/50">
                                            <Icon className="h-10 w-10 mb-1 text-primary" />
                                            <span className="text-xs text-center font-medium">{prize.name}</span>
                                        </div>
                                    )
                                })}
                                </div>
                             ) : (
                                <p className="text-center text-muted-foreground">Aún no has ganado insignias. ¡Completa estaciones para coleccionarlas!</p>
                             )}
                        </CardContent>
                     </Card>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </div>
      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={stationId}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
