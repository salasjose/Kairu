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

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return stations.map((station) => ({
    id: station.id.toString(),
  }));
}

export default function StationPage({ params }: { params: { id: string } }) {
  const stationId = parseInt(params.id, 10);
  const station = stations.find(s => s.id === stationId);

  if (!station) {
    notFound();
  }

  const getStationComponent = () => {
    switch (stationId) {
      case 1: return <Station1 />;
      case 2: return <Station2 />;
      case 3: return <Station3 />;
      case 4: return <Station4 />;
      case 5: return <Station5 />;
      case 6: return <Station6 />;
      case 7: return <Station7 />;
      case 8: return <Station8 />;
      case 9: return <Station9 />;
      default: return <div>Challenge coming soon!</div>;
    }
  };

  return getStationComponent();
}
