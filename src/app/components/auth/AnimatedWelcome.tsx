'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Logo from '@/app/components/Logo';
import { Card } from '@/components/ui/card';

interface AnimatedWelcomeProps {
  onLoginClick: () => void;
  onCreateUserClick: () => void;
}

export default function AnimatedWelcome({ onLoginClick, onCreateUserClick }: AnimatedWelcomeProps) {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const appearanceTimer = setTimeout(() => {
      setShowDialog(true);
    }, 10000); // Aparece después de 10 segundos

    const disappearanceTimer = setTimeout(() => {
        setShowDialog(false);
    }, 10000 + 60000); // Desaparece 60 segundos después de aparecer
    
    // Limpia ambos temporizadores si el componente se desmonta
    return () => {
        clearTimeout(appearanceTimer);
        clearTimeout(disappearanceTimer);
    };
  }, []);

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
            <Logo className="h-24 md:h-32 mx-auto" aria-hidden="true" />
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

        {/* Right Side: Yara Image and Dialog */}
        <div className="relative mt-8 lg:mt-0">
            <motion.div
                initial={{ opacity: 0, x: 50, y: 50 }}
                animate={{ opacity: 1, x: 0, y: 0, transition: { delay: 1.5, duration: 0.8, type: 'spring' } }}
                className="max-w-[150px] md:max-w-[200px] lg:max-w-[250px]"
            >
                <Image
                    src="/characters/YARA_3.png"
                    alt="Yara la rana, asistente del juego Kairu"
                    width={250}
                    height={312}
                    className="h-auto w-full select-none"
                    priority
                    aria-hidden="true"
                />
            </motion.div>

            <AnimatePresence>
                {showDialog && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="absolute -top-20 -right-4 lg:-right-12 w-48"
                    >
                        <Card className="p-3 text-center shadow-lg bg-white/95">
                            <p className="text-sm text-primary font-medium">Hola Soy Yara, te invito a  crear tu usuario</p>
                        </Card>
                        {/* Speech bubble arrow */}
                        <div className="absolute bottom-[-10px] right-12 lg:right-16 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
