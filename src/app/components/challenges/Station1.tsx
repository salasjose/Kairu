"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";


const ChallengeDetail = ({ title, description, onComplete, onBack, image, imageHint }: { title: string, description: string, onComplete: () => void, onBack: () => void, image: string, imageHint: string }) => (
  <div className="w-full max-w-2xl mx-auto">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a los retos
      </Button>
      <Card className="text-center">
          <CardContent className="p-6">
              <h3 className="font-bold text-2xl text-primary font-headline mb-4">{title}</h3>
              <Image 
                src={image} 
                alt={description} 
                width={400} 
                height={300} 
                className="rounded-md mx-auto mb-4"
                data-ai-hint={imageHint}
              />
              <p className="text-muted-foreground mb-6">{description}</p>
              <Button onClick={onComplete} size="lg">
                  <CheckCircle className="mr-2" />
                  Simular Completado
              </Button>
          </CardContent>
      </Card>
  </div>
);


export default function Station1() {
  const [selectedChallenge, setSelectedChallenge] = useState<string | null>(null);
  const [completedChallenge, setCompletedChallenge] = useState<string | null>(null);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const handleComplete = () => {
    if (!completedChallenge) {
      toast({
        title: "Reto no completado",
        description: "Por favor, completa uno de los retos para continuar.",
        variant: "destructive",
      });
      return false;
    }
    toast({
      title: "¡Estación 1 Completada!",
      description: "¡Buen trabajo en el reto de biodiversidad!",
    });
    unlockStation(2);
    router.push("/");
    return true;
  };
  
  const completeAndGoBack = (challenge: string) => {
    setCompletedChallenge(challenge);
    setSelectedChallenge(null);
     toast({
      title: `Reto '${challenge}' completado`,
      description: "¡Has marcado este reto como finalizado!",
    });
  }

  if (selectedChallenge) {
    const challenges = {
        "Reto 1": {
            title: "Reto 1: Identificar Especies",
            description: "¡Próximamente un divertido juego para identificar la flora y fauna local!",
            image: "https://picsum.photos/seed/fauna/400/300",
            imageHint: "local fauna"
        },
        "Reto 2": {
            title: "Reto 2: Crear un Hábitat",
            description: "¡Próximamente podrás subir fotos de cómo construyes un hogar para la vida silvestre!",
            image: "https://picsum.photos/seed/habitat/400/300",
            imageHint: "wildlife habitat"
        }
    }
    const challengeData = challenges[selectedChallenge as keyof typeof challenges];

     return <ChallengeDetail {...challengeData} onComplete={() => completeAndGoBack(selectedChallenge)} onBack={() => setSelectedChallenge(null)} />;
  }


  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center p-4 bg-[#A1C589] relative overflow-hidden">
      <Image 
        src="https://storage.googleapis.com/project-spark-34117.appspot.com/static/assets/a76b7e0e-c765-4113-8991-89787e99b369.png"
        alt="Forest background"
        fill
        objectFit="cover"
        className="z-0 opacity-80"
        data-ai-hint="forest background"
      />
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
         <div className="bg-[#D95E32] text-white font-kalam py-3 px-10 rounded-lg shadow-lg -rotate-3 mb-8">
            <h1 className="text-5xl">Estación 1</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8 md:gap-16 mb-8">
            {["Reto 1", "Reto 2"].map((reto, index) => (
              <button key={reto} onClick={() => setSelectedChallenge(reto)} className={cn("relative transition-transform duration-300 hover:scale-105", index === 0 ? "md:-rotate-6" : "md:rotate-6")}>
                 <div className="absolute inset-0 bg-white shadow-2xl rounded-lg transform -rotate-1"></div>
                 <div className="relative bg-white w-64 h-72 rounded-lg shadow-2xl flex flex-col items-center justify-center p-4 border-4 border-gray-200">
                    <h2 className="font-kalam text-4xl text-orange-600">{reto}</h2>
                    {completedChallenge === reto && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                            <CheckCircle className="h-6 w-6" />
                        </div>
                    )}
                 </div>
              </button>
            ))}
        </div>

        <div className="bg-[#D95E32] text-white font-kalam py-3 px-10 rounded-lg shadow-lg rotate-2 mb-8">
            <p className="text-2xl">Yara habla...</p>
        </div>

        <div className="absolute bottom-4 left-4 z-20 hidden md:block">
             <Image 
                  src="https://storage.googleapis.com/project-spark-34117.appspot.com/static/assets/9ac22228-5690-482c-9a4f-560447339d29.png"
                  alt="Friendly frog character Yara"
                  width={140}
                  height={140}
                  className="transform -scale-x-100"
                  data-ai-hint="frog character"
                />
        </div>

        <div className="mt-4">
            <Button size="lg" onClick={handleComplete}>
                Completar Estación y Volver al Mapa
            </Button>
        </div>
      </div>
    </div>
  );
}
