"use client";

import Link from "next/link";
import { useStationProgress } from "@/hooks/use-station-progress";
import { stations } from "@/lib/data";
import StationNode from "@/app/components/StationNode";
import CompletionDialog from "@/app/components/CompletionDialog";
import Logo from "@/app/components/Logo";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { unlockedStations, isLoaded, resetProgress } = useStationProgress();
  const allStationsCompleted = unlockedStations.length > stations.length;

  return (
    <main className="flex flex-col items-center p-4 sm:p-6 md:p-8 min-h-screen w-full">
      <header className="w-full max-w-5xl flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Logo className="h-12 w-12" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-primary">
              EcoQuest Explorers
            </h1>
            <p className="text-muted-foreground">Your journey to becoming a Guardian of Nature</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={resetProgress}>Reset Progress</Button>
      </header>

      <div className="flex-grow w-full flex items-center justify-center">
        {!isLoaded ? (
          <div className="text-lg text-primary">Loading your adventure...</div>
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
                  "md:top-auto md:left-auto md:col-start-2 md:self-center",
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
                  <div key={station.id} className={`flex justify-center items-center h-24 ${positionClasses[index % 9]}`}>
                    <StationNode station={station} isUnlocked={isUnlocked} />
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
