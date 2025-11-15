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
  const StationComponent = stationId ? stationComponents[stationId] : null;

  if (!StationComponent) {
    notFound();
  }

  // Esta estructura es más estable para React que un switch.
  return <StationComponent />;
}
