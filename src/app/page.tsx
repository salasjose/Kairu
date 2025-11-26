
'use client';

import AuthWrapper from '@/app/components/AuthWrapper';

export default function HomePage() {
  return (
    // AuthWrapper ahora controla el fondo a través de sus subcomponentes,
    // eliminando la necesidad de un componente de fondo aquí.
    <AuthWrapper />
  );
}
