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

const PLAYER_NAME_KEY = "kairu-player-name";

const DesktopMap = () => {
  const { unlockedStations } = useStationProgress();
  const mapBgImage = PlaceHolderImages.find((p) => p.id === "map-background");
  const yaraCharImage = PlaceHolderImages.find((p) => p.id === "char-yara");

  const stationPositions = [
    { top: "80%", left: "19%" }, // 1. Bionexus
    { top: "88%", left: "37%" }, // 2. ImpacTrack
    { top: "82%", left: "55%" }, // 3. ReNova
    { top: "88%", left: "73%" }, // 4. TerrAzul
    { top: "60%", left: "89%" }, // 5. ZonaCreativa
    { top: "37%", left: "75%" }, // 6. ReGira
    { top: "50%", left: "44%" }, // 7. VerdeLAb
    { top: "30%", left: "60%" }, // 8. Vitalia
    { top: "15%", left: "48%" }, // 9. Final Puzzle
  ];

  return (
    <div className="absolute inset-0 w-full h-full z-0">
      {mapBgImage && (
        <Image
          src={mapBgImage.imageUrl}
          alt={mapBgImage.description}
          fill
          priority
          className="object-cover"
          data-ai-hint={mapBgImage.imageHint}
        />
      )}
      <div className="relative w-full h-full">
        {stations.map((station, index) => {
          const isUnlocked = unlockedStations.includes(station.id);
          const position = stationPositions[index];
          return (
            <div
              key={station.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ top: position.top, left: position.left }}
            >
              <StationNode station={station} isUnlocked={isUnlocked} />
            </div>
          );
        })}
        {yaraCharImage && (
          <div className="absolute bottom-[8%] left-[8%] transform -translate-x-1/2 -translate-y-1/2">
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
    </div>
  );
};

const MobileGrid = () => {
    const { unlockedStations } = useStationProgress();
    return (
        <div className="grid grid-cols-3 gap-x-2 gap-y-8 w-full p-4 sm:p-6">
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
        <div className="flex items-center gap-2 md:gap-4 mb-6">
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
      </main>
    );
  }

  return (
    <main className="min-h-screen w-full bg-background flex flex-col">
       {!isMobile && <DesktopMap />}
      <div className="relative z-10 flex-grow flex flex-col">
        <header className="w-full max-w-5xl mx-auto flex justify-between items-center p-4 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 md:gap-4">
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

        <div className="flex-grow w-full flex items-center justify-center">
            {isMobile && <MobileGrid />}
        </div>
      </div>
      <CompletionDialog open={allStationsCompleted} onReset={handleReset} />
    </main>
  );
}
