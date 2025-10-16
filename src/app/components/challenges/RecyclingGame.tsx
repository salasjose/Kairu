
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle } from "lucide-react";

interface RecyclingGameProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function RecyclingGame({ onComplete, onBack }: RecyclingGameProps) {
  return (
    <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center justify-center min-h-full">
      <div className="w-full">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a los retos
        </Button>
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold text-primary font-headline">Juego de Clasificación de Residuos</CardTitle>
            <CardDescription className="text-center">¡Arrastra cada residuo al contenedor correcto!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video w-full rounded-lg overflow-hidden border">
              <iframe
                src="https://wordwall.net/es/embed/5984791/clasificaci%C3%B3n-de-residuos"
                width="100%"
                height="100%"
                allowFullScreen
                style={{ border: "none" }}
              />
            </div>
            <div className="mt-6 text-center">
              <p className="text-muted-foreground mb-4">
                Una vez que hayas practicado suficiente, ¡marca el reto como completado!
              </p>
              <Button onClick={onComplete} size="lg">
                <CheckCircle className="mr-2" />
                He completado el juego
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
