'use client';

import dynamic from 'next/dynamic';
import Logo from './Logo';

const GameClient = dynamic(() => import('@/app/components/GameClient'), {
  ssr: false,
  loading: () => (
    <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background">
      <Logo className="h-24 w-24 animate-pulse" />
      <p className="text-primary/70 mt-4">Cargando Aventura...</p>
    </main>
  ),
});

export default function GameLoader() {
    return <GameClient />;
}
