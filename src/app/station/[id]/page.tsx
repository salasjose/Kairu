import { stations } from '@/lib/data';
import { notFound } from 'next/navigation';
import dynamic from 'next/dynamic';
import Logo from '@/app/components/Logo';

export const dynamic = 'force-dynamic';

const StationLoader = () => (
    <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full bg-background">
      <Logo className="h-24 animate-pulse" />
      <p className="text-primary/70 mt-4">Cargando Estación...</p>
    </main>
);

const stationComponents: { [key: number]: React.ComponentType<any> } = {
  1: dynamic(() => import('@/app/components/challenges/Station1'), { loading: () => <StationLoader />, ssr: false }),
  2: dynamic(() => import('@/app/components/challenges/Station2'), { loading: () => <StationLoader />, ssr: false }),
  3: dynamic(() => import('@/app/components/challenges/Station3'), { loading: () => <StationLoader />, ssr: false }),
  4: dynamic(() => import('@/app/components/challenges/Station4'), { loading: () => <StationLoader />, ssr: false }),
  5: dynamic(() => import('@/app/components/challenges/Station5'), { loading: () => <StationLoader />, ssr: false }),
  6: dynamic(() => import('@/app/components/challenges/Station6'), { loading: () => <StationLoader />, ssr: false }),
  7: dynamic(() => import('@/app/components/challenges/Station7'), { loading: () => <StationLoader />, ssr: false }),
  8: dynamic(() => import('@/app/components/challenges/Station8'), { loading: () => <StationLoader />, ssr: false }),
  9: dynamic(() => import('@/app/components/challenges/Station9'), { loading: () => <StationLoader />, ssr: false }),
};


export default function StationPage({ params }: { params: { id: string } }) {
  const stationId = parseInt(params.id, 10);
  const station = stations.find(s => s.id === stationId);

  if (!station) {
    notFound();
  }

  const StationComponent = stationComponents[stationId];

  if (!StationComponent) {
    return <div>Reto no encontrado para esta estación.</div>;
  }

  return <StationComponent />;
}
