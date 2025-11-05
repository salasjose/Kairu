'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Logo from '@/app/components/Logo';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useMemo } from 'react';

interface WelcomeScreenProps {
  onLoginClick: () => void;
  onCreateUserClick: () => void;
}

export default function WelcomeScreen({ onLoginClick, onCreateUserClick }: WelcomeScreenProps) {
  const yaraCharImage = useMemo(() => PlaceHolderImages.find((p) => p.id === 'char-yara'), []);

  return (
    <div className="text-center">
      <Logo className="h-32 w-32 mx-auto text-primary" />
      <h1 className="text-6xl font-bold font-headline text-primary mt-4">KAIRU</h1>
      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: 1 } }} className="mt-8">
        {yaraCharImage && <Image src={yaraCharImage.imageUrl} alt="Yara" width={150} height={150} className="mx-auto" />}
        <p className="mt-4 text-xl font-bold bg-white/80 p-3 rounded-lg shadow-md">Me llamo YARA, te invito a crear tu usuario.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
          <Button onClick={onCreateUserClick} size="lg">Crear Usuario</Button>
          <Button onClick={onLoginClick} size="lg" variant="outline">Iniciar Sesión</Button>
        </div>
      </motion.div>
    </div>
  );
}
