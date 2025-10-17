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
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { User as AuthUser } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useFirestore, useDoc } from "@/firebase";
import type { User } from "@/lib/types";

export default function Home() {
  const { unlockedStations, isLoaded: isProgressLoaded, resetProgress } = useStationProgress();
  const { user: authUser, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = authUser ? doc(firestore, `users/${authUser.uid}`) : null;
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<User>(userDocRef);

  useEffect(() => {
    if (!isUserLoading && !authUser) {
      router.push('/login');
    }
  }, [authUser, isUserLoading, router]);

  const handleReset = () => {
    // Note: This should also sign the user out.
    // For now, it just resets local progress.
    // Full sign out logic would be in a header/profile button.
    resetProgress();
    // Potentially add Firebase sign out logic here.
  }

  const allStationsCompleted = unlockedStations.length >= stations.length;

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

  if (isUserLoading || !isProgressLoaded || (authUser && isProfileLoading)) {
    return (
      <main className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen w-full bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex flex-col items-center">
                <Skeleton className="h-6 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
             <Skeleton className="relative w-[300px] h-[225px] md:w-[700px] md:h-[525px] mt-8" />
        </div>
      </main>
    );
  }

  if (!authUser) {
     // This is a fallback while redirecting
     return (
        <main className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 min-h-screen w-full bg-background text-foreground">
            <p>Redirigiendo a la página de inicio de sesión...</p>
        </main>
     );
  }


  return (
    <main className="flex flex-col items-center p-4 sm:p-6 md:p-8 min-h-screen w-full">
      <header className="w-full max-w-5xl flex justify-between items-center mb-4 md:mb-6">
        <div className="flex items-center gap-2 md:gap-4">
          <Logo className="h-10 w-10 md:h-12 md:w-12" />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">
              Kairu
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">¡Bienvenido, {userProfile?.firstName || authUser.email}!</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleReset}>
          Reiniciar
        </Button>
      </header>

      <div className="flex-grow w-full flex items-center justify-center">
        <div className="relative w-full max-w-5xl aspect-[4/3]">
          <Image
            src="https://storage.googleapis.com/project-spark-34117.appspot.com/static/assets/a2e24505-f375-4cf5-9430-a35c5c93c1f0.png"
            alt="Game map with a winding path"
            fill
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
      </div>
      <CompletionDialog open={allStationsCompleted} onReset={handleReset} />
    </main>
  );
}
