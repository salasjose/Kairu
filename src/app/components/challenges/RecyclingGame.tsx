"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import WasteClassificationGame from "./WasteClassificationGame";

const games = [
  { id: "classify", title: "Clasificación de Residuos", description: "Arrastra cada residuo al contenedor correcto.", component: WasteClassificationGame, enabled: true },
  { id: "game2", title: "Juego 2 (Próximamente)", description: "Un nuevo reto de reciclaje.", component: null, enabled: false },
  { id: "game3", title: "Juego 3 (Próximamente)", description: "Un nuevo reto de reciclaje.", component: null, enabled: false },
  { id: "game4", title: "Juego 4 (Próximamente)", description: "Un nuevo reto de reciclaje.", component: null, enabled: false },
];

interface RecyclingGamesMenuProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function RecyclingGamesMenu({ onComplete, onBack }: RecyclingGamesMenuProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  if (selectedGame) {
    const GameComponent = games.find(g => g.id === selectedGame)?.component;
    if (GameComponent) {
      return <GameComponent onComplete={onComplete} onBack={() => setSelectedGame(null)} />;
    }
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
            {games.map(game => (
              <Card 
                key={game.id}
                onClick={() => game.enabled && setSelectedGame(game.id)}
                className={`p-4 text-center transition-all ${game.enabled ? 'cursor-pointer hover:border-primary hover:shadow-md' : 'opacity-50 cursor-not-allowed bg-muted/50'}`}
              >
                <h3 className="font-bold text-lg text-primary">{game.title}</h3>
                <p className="text-sm text-muted-foreground">{game.description}</p>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
