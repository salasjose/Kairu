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
  const mapBgImage = PlaceHolderImages.find((p) => p.id === "map-background");

  // Coordenadas precisas dentro de un sistema de 1000x1000 para el SVG
  const stationPositions = [
    { x: 230, y: 390 }, // 1
    { x: 420, y: 250 }, // 2
    { x: 670, y: 365 }, // 3
    { x: 505, y: 555 }, // 4
    { x: 810, y: 510 }, // 5
    { x: 700, y: 790 }, // 6
    { x: 380, y: 840 }, // 7
    { x: 190, y: 800 }, // 8
    { x: 480, y: 80 },  // 9
  ];

  return (
    <div className="hidden md:block w-full h-full relative">
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
      <svg viewBox="0 0 1000 1000" className="absolute inset-0 w-full h-full">
        {stations.map((station, index) => {
          const isUnlocked = unlockedStations.includes(station.id);
          const pos = stationPositions[index];
          return (
            <foreignObject key={station.id} x={pos.x - 32} y={pos.y - 32} width="64" height="64" className="overflow-visible">
               <div className="w-16 h-16">
                 <StationNode station={station} isUnlocked={isUnlocked} />
               </div>
            </foreignObject>
          );
        })}

        {yaraCharImage && (
            <foreignObject x="50" y="800" width="140" height="140">
                <Image
                    src={yaraCharImage.imageUrl}
                    alt={yaraCharImage.description}
                    width={140}
                    height={140}
                    data-ai-hint={yaraCharImage.imageHint}
                />
            </foreignObject>
        )}
      </svg>
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
  const mapBgImage = PlaceHolderImages.find((p) => p.id === "map-background");
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
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
        {mapBgImage && (
            <Image
                src={mapBgImage.imageUrl}
                alt={mapBgImage.description}
                layout="fill"
                objectFit="cover"
                className="z-0 opacity-50"
                priority
                data-ai-hint={mapBgImage.imageHint}
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
    <main className="min-h-screen w-full flex flex-col relative bg-black">
      {isMobile && mapBgImage && (
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
