
'use client'

import React from 'react';
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
import { useUser, useFirestore } from '@/firebase/hooks';
import Logo from '@/app/components/Logo';

export default function StationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const stationId = parseInt(id, 10);
  const station = stations.find(s => s.id === stationId);
  const { user, loading } = useUser();
  const db = useFirestore();

  if (!station) {
    notFound();
  }

  if (loading || !db) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen w-full bg-background">
        <Logo className="h-24 animate-pulse" />
        <p className="text-primary/70 mt-4">Cargando estación...</p>
      </div>
    );
  }

  const stationProps = { user, db };

  const getStationComponent = () => {
    switch (stationId) {
      case 1: return <Station1 {...stationProps} />;
      case 2: return <Station2 {...stationProps} />;
      case 3: return <Station3 {...stationProps} />;
      case 4: return <Station4 {...stationProps} />;
      case 5: return <Station5 {...stationProps} />;
      case 6: return <Station6 {...stationProps} />;
      case 7: return <Station7 {...stationProps} />;
      case 8: return <Station8 {...stationProps} />;
      case 9: return <Station9 {...stationProps} />;
      default: return <div>Challenge coming soon!</div>;
    }
  };

  return getStationComponent();
}
