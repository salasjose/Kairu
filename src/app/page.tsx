"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useStationProgress } from "@/hooks/use-station-progress";
import { stations } from "@/lib/data";
import StationNode from "@/app/components/StationNode";
import CompletionDialog from "@/app/components/CompletionDialog";
import Logo from "@/app/components/Logo";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import PrizeCart from "./components/PrizeCart";
import { useIsMobile } from "@/hooks/use-mobile";

const PLAYER_NAME_KEY = 'kairu-player-name';

const DesktopMap = () => {
  const { unlockedStations } = useStationProgress();
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");

  // Coordinates are percentages (top, left) for responsive positioning
  const stationPositions = [
    { top: '39%', left: '23%' }, // 1
    { top: '25%', left: '42%' }, // 2
    { top: '36.5%', left: '67%' }, // 3
    { top: '55.5%', left: '50.5%' }, // 4
    { top: '51%', left: '81%' }, // 5
    { top: '79%', left: '70%' }, // 6
    { top: '84%', left: '38%' }, // 7
    { top: '80%', left: '19%' }, // 8
    { top: '8%', left: '48%' },  // 9
  ];

  return (
    <div className="hidden md:block w-full h-full relative">
      {stations.map((station, index) => {
        const isUnlocked = unlockedStations.includes(station.id);
        const pos = stationPositions[index];
        return (
          <div 
            key={station.id} 
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ top: pos.top, left: pos.left }}
          >
            <StationNode station={station} isUnlocked={isUnlocked} />
          </div>
        );
      })}
      {yaraCharImage && (
        <div className="absolute bottom-[5%] left-[5%] w-[140px] h-[140px]">
          <Image
            src={yaraCharImage.imageUrl}
            alt={yaraCharImage.description}
            width={140}
            height={140}
            data-ai-hint={yaraCharImage.imageHint}
          />
        </div>
      )}
    </div>
  );
};


const MobileGrid = () => {
    const { unlockedStations } = useStationProgress();
    return (
        <div className="grid grid-cols-3 gap-x-2 gap-y-8 w-full p-4 sm:p-6 md:hidden z-10">
            {stations.map((station) => {
                const isUnlocked = unlockedStations.includes(station.id);
                return (
                    <div
                        key={station.id}
                        className="flex items-center justify-center"
                    >
                        <StationNode station={station} isUnlocked={isUnlocked} />
                    </div>
                );
            })}
        </div>
    );
};


export default function Home() {
  const {
    unlockedStations,
    isLoaded: isProgressLoaded,
    resetProgress,
  } = useStationProgress();
  const [clientLoaded, setClientLoaded] = useState(false);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [inputName, setInputName] = useState("");
  const mapBgImage = PlaceHolderImages.find((p) => p.id === "sostenibilidad-background");
  const isMobile = useIsMobile();

  useEffect(() => {
    setClientLoaded(true);
    try {
      const savedName = localStorage.getItem(PLAYER_NAME_KEY);
      if (savedName) {
        setPlayerName(savedName);
      }
    } catch (error) {
      console.error("Failed to load player name from localStorage", error);
    }
  }, []);

  const handleSaveName = () => {
    if (inputName.trim()) {
      const name = inputName.trim();
      try {
        localStorage.setItem(PLAYER_NAME_KEY, name);
        setPlayerName(name);
      } catch (error) {
        console.error("Failed to save player name to localStorage", error);
      }
    }
  };

  const handleReset = () => {
    resetProgress();
    try {
      localStorage.removeItem(PLAYER_NAME_KEY);
      setPlayerName(null);
      setInputName("");
    } catch (error) {
      console.error("Failed to clear localStorage", error);
    }
  };

  const allStationsCompleted = unlockedStations.length >= stations.length;

  if (!clientLoaded || !isProgressLoaded) {
    return (
      <main className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen w-full bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2 flex flex-col items-center">
            <Skeleton className="h-6 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
          <Skeleton className="relative w-[300px] h-[225px] sm:w-[400px] sm:h-[300px] md:w-[700px] md:h-[525px] mt-8" />
        </div>
      </main>
    );
  }

  if (!playerName) {
    const welcomeBgImage = PlaceHolderImages.find((p) => p.id === "forest-background");
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        {welcomeBgImage && (
            <Image
                src={welcomeBgImage.imageUrl}
                alt={welcomeBgImage.description}
                layout="fill"
                objectFit="cover"
                className="z-0 opacity-50"
                priority
                data-ai-hint={welcomeBgImage.imageHint}
            />
        )}
        <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center gap-2 md:gap-4 mb-6 bg-background/80 p-4 rounded-xl">
              <Logo className="h-10 w-10 md:h-12 md:w-12" />
              <div>
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
                  Kairu
                </h1>
                <p className="text-sm md:text-base text-muted-foreground">
                  Una aventura interactiva de educación ambiental
                </p>
              </div>
            </div>
            <Card className="w-full max-w-sm shadow-2xl">
              <CardHeader>
                <CardTitle>¡Bienvenido Explorador!</CardTitle>
                <CardDescription>
                  Escribe tu nombre para comenzar la aventura.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Input
                  placeholder="Tu nombre"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                />
                <Button onClick={handleSaveName}>Comenzar Aventura</Button>
              </CardContent>
            </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full flex flex-col relative bg-background">
      {mapBgImage && (
         <Image
            src={mapBgImage.imageUrl}
            alt={mapBgImage.description}
            layout="fill"
            objectFit="cover"
            className="z-0"
            data-ai-hint={mapBgImage.imageHint}
            priority
        />
      )}
      <header className="w-full max-w-7xl mx-auto flex justify-between items-center p-4 sm:p-6 md:p-8 z-20">
        <div className="flex items-center gap-2 md:gap-4 bg-background/70 backdrop-blur-sm p-2 rounded-md">
          <Logo className="h-10 w-10 md:h-12 md:w-12" />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
              Kairu
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              ¡Bienvenido, {playerName}!
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset}>
            Reiniciar
          </Button>
          <PrizeCart />
        </div>
      </header>

      <div className="flex-grow w-full flex items-center justify-center relative z-10">
          <MobileGrid />
          <DesktopMap />
      </div>

      <CompletionDialog open={allStationsCompleted} onReset={handleReset} />
    </main>
  );
}
