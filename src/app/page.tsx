
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
      case 1: // Yara's Intro & Auth Selection
        return (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
            {yaraCharImage && <Image src={yaraCharImage.imageUrl} alt="Yara" width={150} height={150} data-ai-hint={yaraCharImage.imageHint}/>}
            <div className="bg-white/90 p-4 rounded-lg shadow-xl mt-4 max-w-sm">
                <p className="font-bold text-lg text-primary">¡Hola! Soy Yara. ¿Ya tienes una cuenta o eres nuevo por aquí?</p>
            </div>
            <div className="flex gap-4 mt-6">
                <Button onClick={() => { setAuthAction('login'); setStep(2); }} size="lg">Iniciar Sesión</Button>
                <Button onClick={() => { setAuthAction('signup'); setStep(2); }} size="lg" variant="secondary">Crear Cuenta</Button>
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
                        onClick={() => handleAvatarSelect(avatar.imageUrl)}
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
                    <div className="bg-white/90 p-6 rounded-lg shadow-xl">
                        <h2 className="text-2xl font-bold text-primary mb-2">¡Hola, {formData.nombre}!</h2>
                        <p className="text-muted-foreground space-y-2">
                           <span>Soy Yara, una rana muy curiosa y estaré contigo en este emocionante recorrido por Kairu.</span><br/>
                           <span>A lo largo del camino conocerás 8 estaciones sorprendentes donde cada desafío superado abrirá nuevas etapas llenas de descubrimientos, aprendizajes y diversión. En el siguiente paso tendrás la oportunidad de escoger el lienzo que te permitirá crear tu propia estación.</span><br/>
                           <span>En cada avance ganaras recompensas especiales que tú mismo elegirás para completar la estación ideal que elijas.</span><br/>
                           <span>Cada paso te conectará más a la naturaleza y te mostrará cómo tus acciones pueden transformar el mundo que te rodea.</span>
                        </p>
                    </div>
                </motion.div>
            );
      default:
        return null;
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      {welcomeBgImage && (
        <Image
          src={welcomeBgImage.imageUrl}
          alt={welcomeBgImage.description}
          fill
          style={{objectFit: 'cover'}}
          className="z-0 opacity-50"
          priority
          data-ai-hint={welcomeBgImage.imageHint}
        />
      )}
      <div className="relative z-10 flex flex-col items-center">
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
    // Delay setting player data to allow welcome animation to finish
    if (data.name) { // This check is for when login happens
        setTimeout(() => {
            setPlayerData(data);
        }, 5000); // Wait 5 seconds to show welcome message before showing map
    } else {
        setPlayerData(data);
    }
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
    { top: "65%", left: "18%" }, // 1
    { top: "55%", left: "32%" }, // 2
    { top: "40%", left: "25%" }, // 3
    { top: "30%", left: "45%" }, // 4
    { top: "50%", left: "55%" }, // 5
    { top: "35%", left: "70%" }, // 6
    { top: "60%", left: "80%" }, // 7
    { top: "80%", left: "70%" }, // 8
    { top: "85%", left: "90%" }, // 9
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
    <main className="min-h-screen w-full flex flex-col relative">
       {mapBgImage && (
         <Image
            src={mapBgImage.imageUrl}
            alt={mapBgImage.description}
            fill
            style={{objectFit: 'cover'}}
            className="z-0"
            data-ai-hint={mapBgImage.imageHint}
            priority
        />
      )}
      
      <header className="absolute top-0 left-0 right-0 p-2 sm:p-4 z-20">
        <div className="container mx-auto flex items-start justify-between gap-2">
            <div className="bg-cyan-100/90 backdrop-blur-sm p-2 rounded-2xl flex items-center gap-2 shadow-md">
                <Logo className="h-8 w-8 text-green-800" />
                <div className="pr-2">
                    <h1 className="font-bold text-green-900 leading-tight">Kairu</h1>
                    <p className="text-xs text-green-800/80 leading-tight">
                        ¡Bienvenido, {playerData.name}!
                    </p>
                </div>
                <Avatar className="h-10 w-10 border-2 border-white">
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

      <div className="flex-grow w-full flex items-center justify-center relative z-10">
          <div className="w-full h-full relative">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute top-0 left-0">
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
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-24 md:h-24"
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
