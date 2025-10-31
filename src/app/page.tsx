
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useStationProgress } from "@/hooks/use-station-progress";
import { stations } from "@/lib/data";
import StationNode from "@/app/components/StationNode";
import CompletionDialog from "@/app/components/CompletionDialog";
import Logo from "@/app/components/Logo";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import PrizeCart from "./components/PrizeCart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SignUpForm from "./components/auth/SignUpForm";
import LoginForm from "./components/auth/LoginForm";
import { motion, AnimatePresence } from "framer-motion";

const PLAYER_DATA_KEY = 'kairu-player-data';

interface PlayerData {
  name: string;
  avatar: string;
}

const OnboardingFlow = ({ onComplete }: { onComplete: (data: PlayerData) => void }) => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<any>(null);
  const [authAction, setAuthAction] = useState<'login' | 'signup' | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");
  const welcomeBgImage = PlaceHolderImages.find((p) => p.id === "map-background");

  const avatarOptions = [
    PlaceHolderImages.find((p) => p.id === "avatar-1"),
    PlaceHolderImages.find((p) => p.id === "avatar-2"),
    PlaceHolderImages.find((p) => p.id === "avatar-3"),
    PlaceHolderImages.find((p) => p.id === "avatar-4"),
  ].filter(Boolean) as any[];

  useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => setStep(1), 2500);
      return () => clearTimeout(timer);
    }
    if (step === 1) {
        const messageTimer = setTimeout(() => setShowMessage(true), 500);
        const fadeoutTimer = setTimeout(() => {
            setShowMessage(false);
            // After message fades, show buttons
            setTimeout(() => {
                 setStep(1.5); // A temporary state to trigger button animation
            }, 500);
        }, 4500); // show message for 4s
        return () => {
            clearTimeout(messageTimer);
            clearTimeout(fadeoutTimer);
        }
    }
  }, [step]);
  
  const handleFormSubmit = (data: any) => {
    setFormData(data);
    setStep(3);
  };

  const handleLoginSubmit = (data: any) => {
    // For now, we'll just simulate a login and create dummy data
    const finalData = { name: data.usuario, avatar: avatarOptions[0].imageUrl };
    onComplete(finalData);
  }

  const handleAvatarSelect = (avatarUrl: string) => {
    const finalData = { name: formData.nombre, avatar: avatarUrl };
    onComplete(finalData);
    setStep(4);
  };

  const handleStartJourney = () => {
     if (formData) {
        const finalData = { name: formData.nombre, avatar: formData.avatar };
        onComplete(finalData);
     }
  }


  const renderStep = () => {
    switch (step) {
      case 0: // Splash Screen
        return (
          <motion.div
            key="step0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center text-center"
          >
            <Logo className="h-24 w-24 md:h-32 md:w-32 text-primary" />
            <h1 className="text-4xl md:text-6xl font-bold text-primary mt-4 font-headline">KAIRU</h1>
          </motion.div>
        );
      case 1: // Yara's Intro
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            {yaraCharImage && <Image src={yaraCharImage.imageUrl} alt="Yara" width={150} height={150} data-ai-hint={yaraCharImage.imageHint}/>}
            
            <AnimatePresence>
              {showMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white/90 p-4 rounded-lg shadow-xl mt-4 max-w-sm"
                >
                  <p className="font-bold text-lg text-primary">¡Hola! Soy Yara. si tiene una cuenta dale al boton inicio de Sesion si no te invito a crear tu usuario</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      case 1.5: // Auth Selection
        return (
            <motion.div
                key="step1.5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                className="flex flex-col items-center"
            >
                {yaraCharImage && <Image src={yaraCharImage.imageUrl} alt="Yara" width={150} height={150} data-ai-hint={yaraCharImage.imageHint}/>}
                <div className="flex gap-4 mt-6">
                    <Button onClick={() => { setAuthAction('login'); setStep(2); }} size="lg">Iniciar Sesión</Button>
                    <Button onClick={() => { setAuthAction('signup'); setStep(2); }} size="lg" variant="secondary">Crear Usuario</Button>
                </div>
            </motion.div>
        );
      case 2: // Login or Sign Up Form
        return (
           <motion.div
            key="step2"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md"
           >
            {authAction === 'login' ? (
                <LoginForm onSubmit={handleLoginSubmit} onSwitchToSignUp={() => setAuthAction('signup')} />
            ) : (
                <SignUpForm onSubmit={handleFormSubmit} onSwitchToLogin={() => setAuthAction('login')} />
            )}
          </motion.div>
        );
      case 3: // Avatar Selection
        return (
          <motion.div
            key="step3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
             <h2 className="text-2xl font-bold text-primary mb-6">Elige tu Avatar</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {avatarOptions.map((avatar, index) => (
                    <motion.button
                        key={index}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                            setFormData({...formData, avatar: avatar.imageUrl });
                            setStep(4);
                        }}
                        className="border-4 border-transparent hover:border-primary rounded-full transition-colors"
                    >
                        <Avatar className="w-24 h-24 md:w-32 md:h-32">
                            <AvatarImage src={avatar.imageUrl} alt={avatar.description} data-ai-hint={avatar.imageHint} />
                            <AvatarFallback>AV</AvatarFallback>
                        </Avatar>
                    </motion.button>
                ))}
             </div>
          </motion.div>
        );
        case 4: // Final Welcome
            return (
                <motion.div
                    key="step4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row items-center text-center md:text-left gap-6 max-w-2xl"
                >
                    {yaraCharImage && <Image src={yaraCharImage.imageUrl} alt="Yara" width={180} height={180} className="flex-shrink-0" data-ai-hint={yaraCharImage.imageHint} />}
                    <div className="bg-white/90 p-6 rounded-lg shadow-xl space-y-4">
                        <h2 className="text-2xl font-bold text-primary">¡Hola, {formData.nombre}! ¡Me emociona que te unas a nosotros!</h2>
                        <div className="text-muted-foreground space-y-2">
                           <p>Soy Yara, una rana muy curiosa y estaré contigo en este emocionante recorrido por Kairu. A lo largo del camino, conocerás 8 estaciones sorprendentes donde cada desafío superado abrirá nuevas etapas llenas de descubrimientos, aprendizajes y diversión.</p>
                           <p>En el siguiente paso, tendrás la oportunidad de escoger el lienzo que te permitirá crear tu propia estación, tu refugio final de la sostenibilidad.</p>
                           <p>Recuerda: En cada avance, ganarás recompensas especiales que tú mismo elegirás para completar la estación ideal que diseñes. Cada paso te conectará más a la naturaleza y te mostrará cómo tus acciones pueden transformar el mundo que te rodea.</p>
                           <p className="font-bold text-primary">¿Listo para comenzar este viaje conmigo?</p>
                        </div>
                        <Button onClick={handleStartJourney} size="lg">¡Sí!</Button>
                    </div>
                </motion.div>
            );
      default:
        return null;
    }
  };

  return (
    <main className="relative w-full min-h-screen flex flex-col overflow-hidden">
      {welcomeBgImage && (
        <Image
          src={welcomeBgImage.imageUrl}
          alt={welcomeBgImage.description}
          fill
          className="object-cover object-center w-full h-full z-0"
          priority
          data-ai-hint={welcomeBgImage.imageHint}
        />
      )}
      <div className="relative z-10 flex flex-col items-center justify-center flex-grow p-4">
        <AnimatePresence mode="wait">
            {renderStep()}
        </AnimatePresence>
      </div>
    </main>
  );
};


export default function Home() {
  const { unlockedStations, isLoaded: isProgressLoaded, resetProgress } = useStationProgress();
  const [clientLoaded, setClientLoaded] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData | null>(null);

  useEffect(() => {
    setClientLoaded(true);
    try {
      const savedData = localStorage.getItem(PLAYER_DATA_KEY);
      if (savedData) {
        setPlayerData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error("Failed to load player data from localStorage", error);
    }
  }, []);

  const handleOnboardingComplete = (data: PlayerData) => {
    try {
      localStorage.setItem(PLAYER_DATA_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save player data to localStorage", error);
    }
    setPlayerData(data);
  };

  const handleReset = () => {
    resetProgress();
    try {
      localStorage.removeItem(PLAYER_DATA_KEY);
      setPlayerData(null);
    } catch (error) {
      console.error("Failed to clear localStorage", error);
    }
  };

  const allStationsCompleted = unlockedStations.length >= stations.length;

  if (!clientLoaded || !isProgressLoaded) {
    return (
      <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background">
        <Logo className="h-24 w-24 animate-pulse" />
      </main>
    );
  }

  const mapBgImage = PlaceHolderImages.find((p) => p.id === "mapa-juego-background");
  const stationPositions = [
    { top: "65%", left: "12%" }, // 1
    { top: "60%", left: "32%" }, // 2
    { top: "48%", left: "38%" }, // 3
    { top: "42%", left: "55%" }, // 4
    { top: "60%", left: "65%" }, // 5
    { top: "70%", left: "80%" }, // 6
    { top: "55%", left: "88%" }, // 7
    { top: "35%", left: "75%" }, // 8
    { top: "25%", left: "90%" }, // 9
  ];
  const generatePath = (positions: { top: string; left: string }[]) => {
    if (positions.length < 2) return "";
    return positions.map((pos, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${pos.left.replace('%','')} ${pos.top.replace('%','')}`;
    }).join(' ');
  };
  const pathD = generatePath(stations.map(s => stationPositions[s.id - 1]));


  if (!playerData) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  return (
    <main className="relative w-full min-h-screen flex flex-col overflow-hidden">
      {mapBgImage && (
        <Image
          src={mapBgImage.imageUrl}
          alt={mapBgImage.description}
          fill
          className="object-cover object-center w-full h-full z-0 pointer-events-none select-none"
          priority
          data-ai-hint={mapBgImage.imageHint}
        />
      )}
      
      <header className="absolute top-0 left-0 right-0 p-2 sm:p-4 z-20">
        <div className="container mx-auto flex items-start justify-between gap-2">
            <div className="bg-white/90 backdrop-blur-sm p-2 rounded-2xl flex items-center gap-3 shadow-md">
                <Logo className="h-8 w-8 text-green-800" />
                <div className="pr-2">
                    <h1 className="font-bold text-green-900 leading-tight">Kairu</h1>
                    <p className="text-xs text-green-800/80 leading-tight">
                        ¡Bienvenido, {playerData.name}!
                    </p>
                </div>
                <Avatar className="h-12 w-12 border-2 border-white">
                    <AvatarImage src={playerData.avatar} alt="Player Avatar" />
                    <AvatarFallback>{playerData.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleReset} className="rounded-full bg-white/90 shadow-md h-10 w-auto px-4">
                  Reiniciar
                </Button>
                <PrizeCart />
            </div>
        </div>
      </header>

      <div className="relative flex-1 w-full h-screen overflow-hidden z-10">
        <div className="absolute inset-0">
            <svg
                width="100%"
                height="100%"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute top-0 left-0"
            >
                <path
                    d={pathD}
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                    strokeDasharray="2 3"
                    strokeLinecap="round"
                />
            </svg>
            {stations.map((station) => {
                const isUnlocked = unlockedStations.includes(station.id);
                const pos = stationPositions[station.id - 1];
                return (
                <div 
                    key={station.id} 
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-16 h-16 md:w-20 md:h-20"
                    style={{ 
                    top: pos.top,
                    left: pos.left,
                    }}
                >
                    <StationNode station={station} isUnlocked={isUnlocked} />
                </div>
                );
            })}
        </div>
      </div>

      <CompletionDialog open={allStationsCompleted} onReset={handleReset} />
    </main>
  );
}
