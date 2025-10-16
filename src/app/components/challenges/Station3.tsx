
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Recycle, Trash2, Video, Sparkles } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const ChallengeDetail = ({ title, description, onComplete, onBack, image, imageHint }: { title: string, description: string, onComplete: () => void, onBack: () => void, image: string, imageHint: string }) => (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-full">
        <div className="w-full">
            <Button variant="ghost" onClick={onBack} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a los retos
            </Button>
            <Card className="text-center w-full shadow-lg">
                <CardContent className="p-6">
                    <h3 className="font-bold text-2xl text-primary font-headline mb-4">{title}</h3>
                    <div className="flex justify-center mb-6">
                        <Image 
                            src={image} 
                            alt={description} 
                            width={400} 
                            height={300} 
                            className="rounded-lg border-4 border-white shadow-md"
                            data-ai-hint={imageHint}
                        />
                    </div>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">{description}</p>
                    <Button onClick={onComplete} size="lg">
                        <CheckCircle className="mr-2" />
                        Completar Reto
                    </Button>
                </CardContent>
            </Card>
        </div>
    </div>
);


const challenges = {
    "video-cleanup": {
        title: "Video de Limpieza",
        description: "Sube un video tuyo en una campaña de limpieza a YouTube/Instagram/TikTok y pega la URL.",
        image: "https://picsum.photos/seed/cleanup-drive/400/300",
        imageHint: "cleanup drive",
        icon: Video,
    },
    "video-separate": {
        title: "Video de Separación",
        description: "Sube un video tuyo separando residuos sólidos y pega la URL.",
        image: "https://picsum.photos/seed/waste-separation/400/300",
        imageHint: "waste separation",
        icon: Recycle,
    },
    "game": {
        title: "Juego de Reciclaje",
        description: "Juega un divertido juego para poner a prueba tus habilidades de clasificación de residuos.",
        image: "https://picsum.photos/seed/recycling-game/400/300",
        imageHint: "recycling game",
        icon: Trash2,
    },
    "photos-crafts": {
        title: "Artesanías Recicladas",
        description: "Sube 4 fotos de accesorios o adornos que hayas hecho con materiales reciclados.",
        image: "https://picsum.photos/seed/recycled-crafts/400/300",
        imageHint: "recycled crafts",
        icon: Sparkles,
    }
};

type ChallengeId = keyof typeof challenges;


export default function Station3() {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const handleComplete = (challengeId: ChallengeId) => {
    toast({
      title: "¡Estación 3 Completada!",
      description: `¡Buen trabajo con el reto '${challenges[challengeId].title}'! Volviendo al mapa...`,
    });
    unlockStation(4);
    router.push("/");
  };
  
  if (selectedChallenge) {
    const challengeData = challenges[selectedChallenge];
     return <ChallengeDetail {...challengeData} onComplete={() => handleComplete(selectedChallenge)} onBack={() => setSelectedChallenge(null)} />;
  }

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center p-4 bg-[#89A1C5] relative overflow-hidden">
        <Image 
            src="https://storage.googleapis.com/project-spark-34117.appspot.com/static/assets/15ae8e51-9f93-4a11-a806-df6b7f32997e.png"
            alt="City background with waste management theme"
            fill
            objectFit="cover"
            className="z-0 opacity-70"
            data-ai-hint="city recycling"
        />
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
            <div className="bg-primary text-white font-headline py-3 px-10 rounded-lg shadow-lg mb-8 text-center">
                <h1 className="text-4xl md:text-5xl">Estación 3</h1>
                <p className="text-lg md:text-xl">Gestión de Residuos</p>
            </div>

            <div className="grid grid-cols-2 gap-6 md:gap-8 mb-8">
                {(Object.keys(challenges) as ChallengeId[]).map((key) => {
                  const challenge = challenges[key];
                  const Icon = challenge.icon;
                  return (
                      <button key={key} onClick={() => setSelectedChallenge(key)} className="transition-transform duration-300 hover:scale-105 group">
                         <Card className="w-40 h-48 md:w-48 md:h-56 bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors">
                            <CardContent className="flex flex-col items-center justify-center text-center p-4 h-full">
                                <Icon className="w-12 h-12 text-primary mb-3" />
                                <h2 className="font-bold font-headline text-lg text-primary">{challenge.title}</h2>
                            </CardContent>
                         </Card>
                      </button>
                  )
                })}
            </div>

            <div className="mt-4 max-w-md mx-auto">
               <p className="bg-background/80 p-4 rounded-md text-center">Selecciona uno de los retos para demostrar cómo gestionas los residuos. ¡Al terminar, volverás al mapa!</p>
            </div>
            
             <div className="absolute bottom-4 -left-8 z-20 hidden md:block">
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
