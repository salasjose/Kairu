import { stations } from '@/lib/data';
import { notFound } from 'next/navigation';
import Station1 from '@/app/components/challenges/Station1';
import Station2 from '@/app/components/challenges/Station2';
import Station3 from '@/app/components/challenges/Station3';
import Station4 from '@/app/components/challenges/Station4';
import Station5 from '@/app/components/challenges/Station5';
import Station6 from '@/app/components/challenges/Station6';
import Station7 from '@/app/components/challenges/Station7';
import Station8 from '@/app/components/challenges/Station8';
import Station9 from '@/app/components/challenges/Station9';
import React from 'react';

// Mapea los IDs de las estaciones a sus componentes correspondientes.
const stationComponents: { [key: number]: React.ComponentType } = {
  1: Station1,
  2: Station2,
  3: Station3,
  4: Station4,
  5: Station5,
  6: Station6,
  7: Station7,
  8: Station8,
  9: Station9,
};

export default function StationPage({ params }: { params: { id: string } }) {
  const stationId = parseInt(params.id, 10);
  
  // Encuentra la estación y el componente correspondiente.
  const station = stations.find(s => s.id === stationId);
  const StationComponent = station ? stationComponents[station.id] : null;

  // Si la estación o el componente no existen, muestra notFound.
  if (!station || !StationComponent) {
    notFound();
    return null; // Aseguramos que el componente retorne algo.
  }

  // Renderiza el componente de la estación de forma dinámica.
  // Esta estructura es más estable para React que un switch.
  return <StationComponent />;
}
