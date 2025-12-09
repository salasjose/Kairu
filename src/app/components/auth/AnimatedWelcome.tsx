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
    }, 1000); 

    const disappearanceTimer = setTimeout(() => {
        setShowDialog(false);
    }, 1000 + 15000); 
    
    return () => {
        clearTimeout(appearanceTimer);
        clearTimeout(disappearanceTimer);
    };
  }, []);

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 z-10">
        <div className="flex flex-col items-center justify-center text-center">
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <Logo className="h-24 md:h-32 mx-auto" aria-hidden="true" />
            <h1 className="text-5xl md:text-6xl font-bold font-headline text-primary mt-4 text-3d"></h1>
        </motion.div>

        <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.5, duration: 0.5 } }}
            className="text-lg md:text-xl text-white mt-4 max-w-md"
        >
            Donde la naturaleza se convierte en misión.
        </motion.p>

        <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { delay: 1.0, duration: 0.5 } }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
        >
            <Button onClick={onCreateUserClick} size="lg">Crear Usuario</Button>
            <Button onClick={onLoginClick} size="lg" variant="outline" className="bg-white/80">Iniciar Sesión</Button>
        </motion.div>
        </div>

        <div className="relative mt-8 lg:mt-0">
            <AnimatePresence>
            {showDialog && (
            <motion.div
                initial={{ opacity: 0, x: 50, y: 50 }}
                animate={{ opacity: 1, x: 0, y: 0, transition: { delay: 0, duration: 0.8, type: 'spring' } }}
                exit={{ opacity: 0, x: 50, y: 50, transition: {duration: 0.5 } }}
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
            )}
            </AnimatePresence>

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
  );
}
