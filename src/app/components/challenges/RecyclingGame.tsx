"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, CheckCircle, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WasteClassificationGame from "./WasteClassificationGame";
import { useChallengeProgress } from "@/hooks/use-challenge-progress";
import { cn } from "@/lib/utils";

const stationId = 3;

const games = [
  { id: "game-classify", title: "Clasificación de Residuos", description: "Clasifica 10 residuos con imágenes antes de que se acabe el tiempo. ¡Cuidado, solo tienes 3 vidas!", component: WasteClassificationGame },
  { id: "game-drag-and-drop", title: "Arrastra y Recicla", description: "Arrastra cada residuo al contenedor correcto. Tienes 3 minutos y 3 vidas.", component: WasteClassificationGame },
];

const WonScreen = ({ gameTitle, onBack }: { gameTitle: string; onBack: () => void; }) => (
  <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center text-center min-h-[400px]">
    <PartyPopper className="w-24 h-24 text-yellow-500 animate-bounce mb-4" />
    <h2 className="text-4xl font-bold font-headline text-primary mb-2">¡Reto Completado!</h2>
    <p className="text-muted-foreground text-lg mb-6">Ya has ganado el juego de <span className="font-bold">{gameTitle}</span>.</p>
    <Button onClick={onBack} size="lg">
      <ArrowLeft className="mr-2" />
      Volver al Menú
    </Button>
  </div>
);

interface RecyclingGamesMenuProps {
  onBack: () => void;
}

export default function RecyclingGamesMenu({ onBack }: RecyclingGamesMenuProps) {
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const { completedChallenges, completeChallenge } = useChallengeProgress();
  
  const stationProgress = completedChallenges[stationId] || {};

  const handleGameComplete = useCallback((gameId: string) => {
    // This is a new local state that includes the just-completed game
    const newProgress = {
        ...stationProgress,
        [gameId]: { completed: true }
    };
    
    // Check if all games in the menu are now completed
    const allGamesInMenuCompleted = games.every(g => newProgress[g.id]?.completed);

    // Update the state for the specific sub-game
    completeChallenge(stationId, gameId);
    
    // If all sub-games are done, also update the parent 'game' challenge
    if (allGamesInMenuCompleted) {
        completeChallenge(stationId, 'game');
    }

    setSelectedGameId(null);
  }, [stationProgress, completeChallenge]);
  
  const gameInfo = games.find(g => g.id === selectedGameId);
  if (gameInfo) {
      if (completedChallenges[stationId]?.[gameInfo.id]?.completed) {
          return <WonScreen gameTitle={gameInfo.title} onBack={() => setSelectedGameId(null)} />;
      }
      const GameComponent = gameInfo.component;
      return (
        <GameComponent
          gameId={selectedGameId!}
          onComplete={() => handleGameComplete(selectedGameId!)}
          onBack={() => setSelectedGameId(null)}
        />
      );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-full">
      <div className="w-full">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a la estación
        </Button>
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-3xl font-bold text-primary font-headline">Juegos de Reciclaje</CardTitle>
            <CardDescription className="text-center">Selecciona un juego para empezar a aprender y divertirte.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map(game => {
              const isCompleted = stationProgress[game.id]?.completed;
              return (
                <Card 
                  key={game.id}
                  onClick={() => setSelectedGameId(game.id)}
                  className={cn(
                    "p-4 text-center transition-all cursor-pointer hover:border-primary hover:shadow-md relative",
                    isCompleted && "bg-green-500/10 border-green-500"
                  )}
                >
                  <h3 className="font-bold text-lg text-primary">{game.title}</h3>
                  <p className="text-sm text-muted-foreground">{game.description}</p>
                   {isCompleted && (
                        <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-lg">
                            <CheckCircle className="text-white h-5 w-5" />
                        </div>
                    )}
                </Card>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
