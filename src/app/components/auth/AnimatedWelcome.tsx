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
    const dialogTimer = setTimeout(() => {
      setShowDialog(true);
    }, 5000);

    return () => {
      clearTimeout(dialogTimer);
    };
  }, []);

  return (
    <div className="relative w-full min-h-[70vh] flex items-center justify-center p-4 overflow-hidden">

      {/* Centro: logo + botones (capa intermedia) */}
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
      </div>

       {/* Imagen de Yara (capa superior) */}
        {yaraImage && (
             <motion.div
                initial={{ opacity: 0, y: 100, x: 100 }}
                animate={{ opacity: 1, y: 0, x: 0, transition: { delay: 1.5, duration: 0.8, type: 'spring' } }}
                className="absolute bottom-0 right-0 md:right-8 w-40 md:w-56 z-20 pointer-events-none"
             >
                <Image
                    src={yaraImage.imageUrl}
                    alt={yaraImage.description}
                    width={224}
                    height={224}
                    className="h-auto w-full select-none"
                    priority
                    aria-hidden="true"
                />
            </motion.div>
        )}

       {/* Globo de diálogo (capa más alta) */}
      <AnimatePresence>
        {showDialog && (
            <motion.div
                key="dialog-box"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.2, type: 'spring' } }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="absolute right-4 md:right-8 top-1/2 -translate-y-full z-30"
                role="status"
                aria-live="polite"
            >
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg relative max-w-sm">
                  <p className="text-lg font-bold text-primary">Me llamo YARA, te invito a crear tu usuario.</p>
                  <div className="absolute right-1/2 translate-x-1/2 bottom-[-8px] h-0 w-0 border-x-8 border-x-transparent border-t-[10px] border-t-white/90"></div>
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
