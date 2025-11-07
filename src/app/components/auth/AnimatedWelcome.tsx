'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Logo from '@/app/components/Logo';
import { useMemo } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface AnimatedWelcomeProps {
  onLoginClick: () => void;
  onCreateUserClick: () => void;
}

export default function AnimatedWelcome({ onLoginClick, onCreateUserClick }: AnimatedWelcomeProps) {
  const yaraImage = useMemo(() => PlaceHolderImages.find(p => p.id === 'char-yara-talking'), []);

  return (
    <div className="relative w-full min-h-[80vh] flex items-center justify-center p-4 overflow-hidden">

      <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 z-10">

        {/* Left Side: Logo + Title + Buttons */}
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Logo className="h-24 w-24 md:h-32 md:w-32 mx-auto text-primary" aria-hidden="true" />
            <h1 className="text-5xl md:text-6xl font-bold font-headline text-primary mt-4 text-3d">KAIRU</h1>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 1.0, duration: 0.5 } }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          >
            <Button onClick={onCreateUserClick} size="lg">Crear Usuario</Button>
            <Button onClick={onLoginClick} size="lg" variant="outline" className="bg-white/80">Iniciar Sesión</Button>
          </motion.div>
        </div>

        {/* Right Side: Yara Image */}
        <motion.div
            initial={{ opacity: 0, x: 50, y: 50 }}
            animate={{ opacity: 1, x: 0, y: 0, transition: { delay: 1.5, duration: 0.8, type: 'spring' } }}
            className="mt-8 lg:mt-0 max-w-[150px] md:max-w-[200px] lg:max-w-[250px]"
        >
            {yaraImage && (
              <Image
                  src={yaraImage.imageUrl}
                  alt={yaraImage.description}
                  width={250}
                  height={312}
                  className="h-auto w-full select-none"
                  priority
                  aria-hidden="true"
              />
            )}
        </motion.div>
      </div>
    </div>
  );
}
