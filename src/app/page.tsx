
'use client';

import AuthWrapper from '@/app/components/AuthWrapper';
import BackgroundImage from "./components/BackgroundImage";

export default function HomePage() {
  return (
    <BackgroundImage>
      <AuthWrapper />
    </BackgroundImage>
  );
}
