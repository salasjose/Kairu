
'use client';

import AuthWrapper from '@/app/components/AuthWrapper';

export default function HomePage() {
  return (
    // AuthWrapper now controls the background through its subcomponents,
    // eliminando la necesidad de un componente de fondo aquí.
    <AuthWrapper />
  );
}
