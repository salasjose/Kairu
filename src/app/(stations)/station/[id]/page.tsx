import { stations } from '@/lib/data';
import { notFound } from 'next/navigation';
import React from 'react';
import dynamic from 'next/dynamic';
import Logo from '@/app/components/Logo';

// Componente de carga genérico
const StationLoading = () => (
    <div className="w-full flex-grow flex flex-col items-center justify-center p-4 relative overflow-hidden bg-background">
      <Logo className="h-24 animate-pulse" />
      <p className="text-primary/70 mt-4">Cargando Estación...</p>
    </div>
);


// Mapea los IDs de las estaciones a sus componentes cargados dinámicamente.
const stationComponents: { [key: number]: React.ComponentType } = {
  1: dynamic(() => import('@/app/components/challenges/Station1'), { loading: () => <StationLoading /> }),
  2: dynamic(() => import('@/app/components/challenges/Station2'), { loading: () => <StationLoading /> }),
  3: dynamic(() => import('@/app/components/challenges/Station3'), { loading: () => <StationLoading /> }),
  4: dynamic(() => import('@/app/components/challenges/Station4'), { loading: () => <StationLoading /> }),
  5: dynamic(() => import('@/app/components/challenges/Station5'), { loading: () => <StationLoading /> }),
  6: dynamic(() => import('@/app/components/challenges/Station6'), { loading: () => <StationLoading /> }),
  7: dynamic(() => import('@/app/components/challenges/Station7'), { loading: () => <StationLoading /> }),
  8: dynamic(() => import('@/app/components/challenges/Station8'), { loading: () => <StationLoading /> }),
  9: dynamic(() => import('@/app/components/challenges/Station9'), { loading: () => <StationLoading /> }),
};

export default function StationPage({ params }: { params: { id: string } }) {
  const stationId = parseInt(params.id, 10);
  
  // Encuentra la estación y el componente correspondiente.
  const StationComponent = stationId ? stationComponents[stationId] : null;

  if (!StationComponent) {
    notFound();
  }

  // Esta estructura es más estable para React que un switch.
  return <StationComponent />;
}
