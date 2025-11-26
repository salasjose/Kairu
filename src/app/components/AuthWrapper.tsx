
'use client';

import { useUser } from '@/firebase';
import GameClient from './GameClient';
import OnboardingFlow from './auth/OnboardingFlow';
import Logo from './Logo';

// This component is the single source of truth for what to display.
export default function AuthWrapper() {
  const { user, loading } = useUser();

  // 1. While Firebase is checking the auth state, show a loading screen.
  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center p-4 min-h-screen w-full">
        <Logo className="h-24 animate-pulse" />
        <p className="text-primary/70 mt-4">Verificando sesión...</p>
      </main>
    );
  }

  // 2. If there is a user, show the game. GameClient will handle its own logic.
  if (user) {
    return <GameClient />;
  }

  // 3. If there's no user, show the sign-in/sign-up flow.
  return <OnboardingFlow onLoginSuccess={() => {}} onComplete={() => {}} />;
}
