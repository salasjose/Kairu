'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Logo from '@/app/components/Logo';

interface AnimatedWelcomeProps {
  onLoginClick: () => void;
  onCreateUserClick: () => void;
}

export default function AnimatedWelcome({ onLoginClick, onCreateUserClick }: AnimatedWelcomeProps) {
  const magnifyingFrog = useMemo(() => PlaceHolderImages.find(p => p.id === 'char-yara-magnifying'), []);

  return (
    <div className="relative w-full min-h-[70vh] flex items-center justify-center p-4 overflow-hidden">

      {/* Centro: logo + botones */}
      <div className="flex flex-col items-center justify-center w-full text-center z-10">
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
        
        {/* Imagen de la rana con lupa */}
        {magnifyingFrog && (
             <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 1.5, duration: 0.8, type: 'spring' } }}
                className="mt-8"
             >
                <Image
                    src={magnifyingFrog.imageUrl}
                    alt={magnifyingFrog.description}
                    width={128}
                    height={128}
                    className="h-auto w-28 md:w-32 select-none"
                    priority
                    aria-hidden="true"
                />
            </motion.div>
        )}
      </div>
    </div>
  );
}

    