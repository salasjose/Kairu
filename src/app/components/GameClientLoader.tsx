
'use client';

import dynamic from 'next/dynamic';
import Logo from './Logo';

const GameClient = dynamic(() => import('./GameClient'), {
  loading: () => (
    <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background/80 backdrop-blur-sm">
      <Logo className="h-24 animate-pulse" />
      <p className="text-primary/70 mt-4">Cargando mapa del juego...</p>
    </main>
  ),
  ssr: false, // Don't render the game on the server, as it's highly interactive
});

export default function GameClientLoader() {
  return <GameClient />;
}
