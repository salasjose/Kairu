"use client";

import { useState } from "react";
import Image from "next/image";
import { toast } from "@/hooks/use-toast";
import { useStationProgress } from "@/hooks/use-station-progress";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Store, ShoppingCart, Upload, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";


const challenges = {
  visit: {
    title: "Video de Visita a Negocio Verde",
    description: "Sube un video de tu visita a un negocio verde local y comparte el enlace.",
    icon: Store,
    image: "https://picsum.photos/seed/greenbusinessvisit/400/300",
    imageHint: "green business visit",
    type: "video"
  },
  purchase: {
    title: "Compra de Producto Sostenible",
    description: "Compra un producto de un negocio verde y sube 4 fotos del artículo y la tienda.",
    icon: ShoppingCart,
    image: "https://picsum.photos/seed/greenproduct/400/300",
    imageHint: "sustainable product",
    type: "photo"
  },
};

type ChallengeId = keyof typeof challenges;

const ChallengeDetail = ({
  challengeId,
  onComplete,
  onBack,
}: {
  challengeId: ChallengeId;
  onComplete: () => void;
  onBack: () => void;
}) => {
    const [url, setUrl] = useState('');
    const challenge = challenges[challengeId];

    const handleSubmit = () => {
        if (challenge.type === 'video') {
            if (url.trim() && (url.startsWith('http://') || url.startsWith('https://'))) {
                onComplete();
            } else {
                toast({
                    title: "URL Inválida",
                    description: "Por favor, ingresa una URL válida.",
                    variant: "destructive",
                });
            }
        } else {
            // For photo upload simulation
            toast({
                title: "Fotos Subidas",
                description: "¡Has simulado la subida de tus 4 fotos!",
            });
            onComplete();
        }
    }

    return (
        <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-full">
            <div className="w-full">
                <Button variant="ghost" onClick={onBack} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver a los retos
                </Button>
                <Card className="text-center w-full shadow-lg">
                    <CardContent className="p-6">
                        <h3 className="font-bold text-2xl text-primary font-headline mb-4">{challenge.title}</h3>
                        <Image 
                            src={challenge.image}
                            alt={challenge.description}
                            width={400}
                            height={300}
                            className="rounded-lg border-4 border-white shadow-md mx-auto mb-6"
                            data-ai-hint={challenge.imageHint}
                        />
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            {challenge.description}
                        </p>
                        {challenge.type === 'video' ? (
                             <div className="flex gap-2 max-w-md mx-auto">
                                <LinkIcon className="h-10 text-muted-foreground" />
                                <Input 
                                    type="url" 
                                    placeholder="https://ejemplo.com/tu-video"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                                <Button onClick={handleSubmit}>
                                    Enviar
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={handleSubmit} size="lg">
                                <Upload className="mr-2" />
                                Simular Subida de 4 Fotos
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

export default function Station7() {
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const { unlockStation } = useStationProgress();
  const router = useRouter();

  const handleComplete = (challengeId: ChallengeId) => {
    toast({
      title: "¡Estación 7 Completada!",
      description: `¡Reto '${challenges[challengeId].title}' superado! Volviendo al mapa...`,
    });
    unlockStation(8);
    router.push("/");
  };
  
  if (selectedChallenge) {
    return <ChallengeDetail challengeId={selectedChallenge} onComplete={() => handleComplete(selectedChallenge)} onBack={() => setSelectedChallenge(null)} />;
  }

  return (
    <div className="w-full min-h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-teal-200 to-green-200 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <Image 
            src="https://storage.googleapis.com/project-spark-34117.appspot.com/static/assets/a2e24505-f375-4cf5-9430-a35c5c93c1f0.png"
            alt="Green business background"
            fill
            objectFit="cover"
            className="z-0"
            data-ai-hint="green business background"
        />
      </div>
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
        <div className="bg-primary text-white font-headline py-3 px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-4xl md:text-5xl">Estación 7</h1>
            <p className="text-lg md:text-xl">Negocios Verdes</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 mb-8">
            {(Object.keys(challenges) as ChallengeId[]).map((key) => {
              const challenge = challenges[key];
              const Icon = challenge.icon;
              return (
                  <button key={key} onClick={() => setSelectedChallenge(key)} className="transition-transform duration-300 hover:scale-105 group">
                     <Card className="w-64 h-56 bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors">
                        <CardContent className="flex flex-col items-center justify-center text-center p-4 h-full">
                            <Icon className="w-16 h-16 text-primary mb-3" />
                            <h2 className="font-bold font-headline text-xl text-primary">{challenge.title}</h2>
                        </CardContent>
                     </Card>
                  </button>
              )
            })}
        </div>

        <div className="mt-4 max-w-md mx-auto">
           <p className="bg-background/80 p-4 rounded-md text-center">Interactúa con negocios verdes locales completando uno de los siguientes retos.</p>
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
