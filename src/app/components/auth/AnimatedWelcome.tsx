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
  const [showDialog, setShowDialog] = useState(false);
  const yaraImage = useMemo(() => PlaceHolderImages.find(p => p.id === 'char-yara-3'), []);

  useEffect(() => {
    // Show the dialog after 5 seconds
    const dialogTimer = setTimeout(() => {
      setShowDialog(true);
    }, 5000);

    return () => {
      clearTimeout(dialogTimer);
    };
  }, []);

  return (
    <div className="relative w-full min-h-[70vh] flex items-center justify-center p-4 overflow-hidden">

      {/* Centro: logo + botones + yara */}
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

        {yaraImage && (
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 1.5, duration: 0.5 } }}
                className="mt-8"
             >
                <Image
                    src={yaraImage.imageUrl}
                    alt={yaraImage.description}
                    width={128}
                    height={128}
                    className="w-28 md:w-32 h-auto select-none"
                    priority
                    aria-hidden="true"
                />
            </motion.div>
        )}
      </div>

       {/* Globo de diálogo a la derecha */}
      <AnimatePresence>
        {showDialog && (
            <motion.div
                key="dialog-box"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30"
                role="status"
                aria-live="polite"
            >
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg relative max-w-sm">
                <p className="text-lg font-bold text-primary">Me llamo YARA, te invito a crear tu usuario.</p>
                {/* Flecha del diálogo apuntando a la izquierda */}
                <div className="absolute right-full top-1/2 -translate-y-1/2 h-0 w-0 border-y-8 border-y-transparent border-r-[10px] border-r-white/90"></div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
