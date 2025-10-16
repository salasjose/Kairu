"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Lock, Upload } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const STORAGE_KEY_STATION2 = 'greenquest-station2-progress';

type DayStatus = 'locked' | 'unlocked' | 'completed';

interface DayState {
  status: DayStatus;
  unlockTime: number | null;
}

const initialDays: DayState[] = Array(7).fill(null).map((_, i) => ({
  status: i === 0 ? 'unlocked' : 'locked',
  unlockTime: i === 0 ? Date.now() : null,
}));


const PhotoUploadChallenge = ({ day, onComplete, onBack }: { day: number, onComplete: () => void, onBack: () => void }) => {
    
    const handleSimulateUpload = () => {
        toast({
            title: `Foto del Día ${day} subida`,
            description: "¡Has completado el reto de hoy!",
        });
        onComplete();
    }
    
    return (
      <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center h-full">
          <Button variant="ghost" onClick={onBack} className="mb-4 self-start">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a los retos
          </Button>
          <Card className="text-center w-full">
              <CardContent className="p-6">
                  <h3 className="font-bold text-2xl text-primary font-headline mb-4">Reto del Día {day}</h3>
                  <Image 
                    src="https://picsum.photos/seed/sustainability-day/400/300" 
                    alt="Sustainable practice" 
                    width={400} 
                    height={300} 
                    className="rounded-md mx-auto mb-4"
                    data-ai-hint="sustainable practice"
                  />
                  <p className="text-muted-foreground mb-6">Documenta una práctica sostenible que realices hoy subiendo una foto.</p>
                  <Button onClick={handleSimulateUpload} size="lg">
                      <Upload className="mr-2" />
                      Simular Subida de Foto
                  </Button>
              </CardContent>
          </Card>
      </div>
    );
};


export default function Station2() {
  const [days, setDays] = useState<DayState[]>(initialDays);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const updateAndSaveChanges = useCallback((newDays: DayState[]) => {
    setDays(newDays);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_STATION2, JSON.stringify(newDays));
    }
  }, []);
  
  useEffect(() => {
    const savedProgress = localStorage.getItem(STORAGE_KEY_STATION2);
    if (savedProgress) {
        try {
            const parsedProgress = JSON.parse(savedProgress) as DayState[];
            if(parsedProgress.length === 7) {
                setDays(parsedProgress);
            }
        } catch {
            // ignore parsing errors, use initial state
        }
    } else {
        localStorage.setItem(STORAGE_KEY_STATION2, JSON.stringify(initialDays));
    }
  }, []);

  const checkUnlocks = useCallback(() => {
    let changed = false;
    const now = Date.now();
    
    setDays(currentDays => {
      const newDays = [...currentDays];
      let hasChanged = false;
      newDays.forEach((day, index) => {
          if(day.status === 'locked' && day.unlockTime && now >= day.unlockTime) {
              newDays[index] = {...newDays[index], status: 'unlocked'};
              hasChanged = true;
          }
      });

      if (hasChanged) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY_STATION2, JSON.stringify(newDays));
        }
      }
      return hasChanged ? newDays : currentDays;
    });
  }, []);


  useEffect(() => {
    const interval = setInterval(checkUnlocks, 1000 * 60); // Check for unlocks every minute
    checkUnlocks();
    return () => clearInterval(interval);
  }, [checkUnlocks]);


  const handleDayComplete = (dayIndex: number) => {
    const newDays = [...days];
    newDays[dayIndex].status = 'completed';

    const nextDayIndex = dayIndex + 1;
    if (nextDayIndex < days.length) {
      if (newDays[nextDayIndex].status === 'locked') {
        newDays[nextDayIndex].unlockTime = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now
      }
    }
    
    updateAndSaveChanges(newDays);
    setSelectedDay(null);

    const allCompleted = newDays.every(d => d.status === 'completed');
    if (allCompleted) {
        toast({
            title: "¡Estación 2 Completada!",
            description: "¡Fantástico! Sigue con esos hábitos sostenibles.",
        });
        unlockStation(3);
        router.push("/");
    }
  };
  
  const handleCompleteAllDays = () => {
    const newDays = days.map(() => ({ status: 'completed', unlockTime: null })) as DayState[];
    updateAndSaveChanges(newDays);
    toast({
        title: "¡Estación 2 Completada!",
        description: "¡Has completado todos los retos de la semana!",
    });
    unlockStation(3);
    router.push("/");
  };


  if (selectedDay !== null) {
      return <PhotoUploadChallenge day={selectedDay} onComplete={() => handleDayComplete(selectedDay - 1)} onBack={() => setSelectedDay(null)} />
  }

  const dayPositions = [
      { top: '35%', left: '15%' }, { top: '30%', left: '40%' }, { top: '38%', left: '65%' },
      { top: '55%', left: '20%' }, { top: '60%', left: '45%' }, { top: '53%', left: '70%' },
      { top: '75%', left: '50%' },
  ];

  return (
    <div className="w-full flex-grow flex flex-col items-center p-4 relative overflow-hidden bg-blue-200">
      <Image 
        src="https://storage.googleapis.com/project-spark-34117.appspot.com/static/assets/15ae8e51-9f93-4a11-a806-df6b7f32997e.png"
        alt="City background"
        fill
        objectFit="cover"
        className="z-0 opacity-90"
        data-ai-hint="cartoon city"
      />
      <div className="relative z-10 flex flex-col items-center justify-start text-center w-full h-full pt-8">
         <div className="bg-[#D95E32] text-white font-kalam py-3 px-10 rounded-lg shadow-lg -rotate-3 mb-4">
            <h1 className="text-4xl md:text-5xl">Reto de la Semana</h1>
        </div>
        <p className="font-kalam text-2xl md:text-3xl text-green-700 font-bold">Estación 2</p>

        <div className="flex-grow w-full relative">
            {days.map((day, index) => (
              <button 
                key={index} 
                disabled={day.status === 'locked'}
                onClick={() => setSelectedDay(index + 1)}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform duration-300 disabled:cursor-not-allowed group"
                style={dayPositions[index]}
              >
                 <div className="relative w-28 h-20 md:w-32 md:h-24 bg-orange-500 rounded-lg shadow-lg flex items-center justify-center border-4 border-white/80 group-hover:scale-105 group-disabled:scale-100 group-disabled:bg-orange-500/60 transition-transform">
                    {day.status === 'locked' && <Lock className="w-10 h-10 text-white/70" />}
                    {day.status === 'unlocked' && <span className="font-kalam text-4xl text-white">Día {index + 1}</span>}
                    {day.status === 'completed' && <CheckCircle className="w-12 h-12 text-green-300" />}
                 </div>
              </button>
            ))}
        </div>

        <div className="pb-20 md:pb-4 w-full flex flex-col items-center gap-4">
            <Button onClick={handleCompleteAllDays}>Simular 7 Días</Button>
            <div className="bg-white/80 backdrop-blur-sm text-green-800 font-kalam py-3 px-10 rounded-lg shadow-lg rotate-2 max-w-sm mx-auto">
                <p className="text-2xl text-center">Yara habla...</p>
            </div>
        </div>

        <div className="absolute bottom-0 left-4 z-20 hidden md:block">
             <Image 
                  src="https://storage.googleapis.com/project-spark-34117.appspot.com/static/assets/9ac22228-5690-482c-9a4f-560447339d29.png"
                  alt="Friendly frog character Yara"
                  width={140}
                  height={140}
                  className="transform -scale-x-100"
                  data-ai-hint="frog character"
                />
        </div>
      </div>
    </div>
  );
}
