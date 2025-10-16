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
          <div className="relative w-full max-w-5xl p-4">
            {/* Desktop Path SVG */}
            <svg
              className="absolute top-0 left-0 w-full h-full hidden md:block"
              preserveAspectRatio="none"
              viewBox="0 0 1000 400"
            >
              <path
                d="M50,350 Q150,250 250,250 T450,250 Q550,250 600,150 T750,50 T950,50"
                stroke="hsl(var(--border))"
                strokeWidth="4"
                fill="none"
                strokeDasharray="10 5"
              />
            </svg>

            {/* Mobile Path Divs */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 h-full w-1 border-l-4 border-dashed border-border md:hidden" />

            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-y-24 md:gap-y-0 md:gap-x-8">
              {stations.map((station, index) => {
                const isUnlocked = unlockedStations.includes(station.id);
                const positionClasses = [
                  // Row 1
                  "md:top-auto md:left-auto md:col-start-1 md:self-end",
                  "md:top-auto md_left-auto md:col-start-2 md:self-center",
                  "md:top-auto md:left-auto md:col-start-3 md:self-center",
                  // Row 2
                  "md:top-auto md:left-auto md:col-start-3 md:self-start",
                  "md:top-auto md:left-auto md:col-start-2 md:self-start",
                  "md:top-auto md:left-auto md:col-start-1 md:self-start",
                  // Row 3
                  "md:top-auto md:left-auto md:col-start-1 md:self-end",
                  "md:top-auto md:left-auto md:col-start-2 md:self-center",
                  "md:top-auto md:left-auto md:col-start-3 md:self-end",
                ];
                return (
                  <div
                    key={station.id}
                    className={`flex justify-center items-center h-24 ${
                      positionClasses[index % 9]
                    }`}
                  >
                    <StationNode
                      station={station}
                      isUnlocked={isUnlocked}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <CompletionDialog open={allStationsCompleted} onReset={resetProgress} />
    </main>
  );
}
