"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useStationProgress } from "@/hooks/use-station-progress";
import { stations } from "@/lib/data";
import StationNode from "@/app/components/StationNode";
import CompletionDialog from "@/app/components/CompletionDialog";
import Logo from "@/app/components/Logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Play } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const { unlockedStations, isLoaded, resetProgress } = useStationProgress();
  const allStationsCompleted = unlockedStations.length > stations.length;
  const [playerCreated, setPlayerCreated] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playerName, setPlayerName] = useState("");

  const handleCreatePlayer = () => {
    if (playerName.trim()) {
      setPlayerCreated(true);
      setIsModalOpen(false);
    }
  };

  const stationPositions = [
    // Corresponds to station ID 1-9
    { top: "72%", left: "18%" },
    { top: "85%", left: "40%" },
    { top: "70%", left: "55%" },
    { top: "80%", left: "75%" },
    { top: "58%", left: "85%" },
    { top: "35%", left: "70%" },
    { top: "45%", left: "40%" },
    { top: "25%", left: "55%" },
    { top: "10%", left: "45%" },
  ];


  if (!playerCreated) {
    return (
      <main className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen w-full bg-background text-foreground">
        <div className="text-center">
          <div className="relative inline-block">
            <Image
              src="https://picsum.photos/seed/adventure/800/300"
              alt="Aventura Interactiva"
              width={800}
              height={300}
              className="rounded-lg shadow-2xl"
              data-ai-hint="interactive adventure"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 rounded-lg">
                <div className="bg-orange-500 text-white font-bold text-3xl md:text-5xl px-6 py-2 rounded-md -rotate-3 shadow-lg">
                    Aventura
                </div>
                <div className="bg-green-600 text-white font-black text-4xl md:text-6xl px-8 py-3 rounded-lg mt-2 rotate-2 shadow-lg">
                    INTERACTIVA
                </div>
            </div>
          </div>
          <Button
            size="lg"
            className="mt-8 animate-bounce"
            onClick={() => setIsModalOpen(true)}
          >
            <Play className="mr-2" />
            Empezar Aventura
          </Button>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-2xl">Crea tu Jugador</DialogTitle>
              <DialogDescription>
                Ingresa tus datos para comenzar la aventura.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="col-span-3"
                  placeholder="Aventurero Verde"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreatePlayer} disabled={!playerName.trim()}>
                <User className="mr-2" /> Crear y Jugar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center p-4 sm:p-6 md:p-8 min-h-screen w-full">
      <header className="w-full max-w-5xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Logo className="h-12 w-12" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              GreenQuest
            </h1>
            <p className="text-muted-foreground">Bienvenido, {playerName}!</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={resetProgress}>
          Reset Progress
        </Button>
      </header>

      <div className="flex-grow w-full flex items-center justify-center">
        {!isLoaded ? (
          <div className="text-lg text-primary">Cargando tu aventura...</div>
        ) : (
          <div className="relative w-full max-w-5xl aspect-[4/3]">
            <Image
              src="https://storage.googleapis.com/project-spark-34117.appspot.com/static/assets/a2e24505-f375-4cf5-9430-a35c5c93c1f0.png"
              alt="Game map with a winding path"
              layout="fill"
              objectFit="contain"
              className="z-0"
              data-ai-hint="game map"
            />
            
            <div className="absolute inset-0 z-10">
              {stations.map((station, index) => {
                const isUnlocked = unlockedStations.includes(station.id);
                const position = stationPositions[index];
                return (
                  <div
                    key={station.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ top: position.top, left: position.left }}
                  >
                    <StationNode
                      station={station}
                      isUnlocked={isUnlocked}
                    />
                  </div>
                );
              })}
               <div className="absolute bottom-[8%] left-[8%] transform -translate-x-1/2 -translate-y-1/2">
                <Image 
                  src="https://storage.googleapis.com/project-spark-34117.appspot.com/static/assets/9ac22228-5690-482c-9a4f-560447339d29.png"
                  alt="Friendly frog character"
                  width={140}
                  height={140}
                  className="hidden md:block"
                  data-ai-hint="frog character"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <CompletionDialog open={allStationsCompleted} onReset={resetProgress} />
    </main>
  );
}
