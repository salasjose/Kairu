'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Logo from '@/app/components/Logo';

interface AnimatedWelcomeProps {
  onLoginClick: () => void;
  onCreateUserClick: () => void;
}

type Scene = 'enter' | 'dialog' | 'lupa' | 'idle';

export default function AnimatedWelcome({ onLoginClick, onCreateUserClick }: AnimatedWelcomeProps) {
  const [scene, setScene] = useState<Scene>('enter');
  const [userInteracted, setUserInteracted] = useState(false);

  const talkingFrog = useMemo(() => PlaceHolderImages.find(p => p.id === 'char-yara-talking'), []);
  const lupaFrog = useMemo(() => PlaceHolderImages.find(p => p.id === 'char-yara-magnifying'), []);
  const yara3Frog = useMemo(() => PlaceHolderImages.find(p => p.id === 'char-yara-3'), []);

  const handleInteraction = useCallback((callback: () => void) => {
    setUserInteracted(true);
    callback();
  }, []);

  // Secuencia con limpieza + pausa si la pestaña no está visible
  useEffect(() => {
    if (userInteracted) return;

    let timers: NodeJS.Timeout[] = [];

    const startSequence = () => {
      setScene('enter');

      const dialogTimer = setTimeout(() => {
        if (document.hidden) return;
        setScene('dialog');

        const lupaTimer = setTimeout(() => {
          if (document.hidden) return;
          setScene('lupa');

          const idleTimer = setTimeout(() => {
            if (document.hidden) return;
            setScene('idle');
            startSequence(); // Loop
          }, 45000); // 45 seconds idle time
          timers.push(idleTimer);
        }, 20000); // 20 seconds dialog display
        timers.push(lupaTimer);
      }, 5000); // 5 seconds initial wait
      timers.push(dialogTimer);
    };

    startSequence();

    const onVisibilityChange = () => {
      if (!document.hidden && !userInteracted) {
        timers.forEach(clearTimeout);
        timers = [];
        startSequence();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      timers.forEach(clearTimeout);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [userInteracted]);


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
          <Button onClick={() => handleInteraction(onCreateUserClick)} size="lg">Crear Usuario</Button>
          <Button onClick={() => handleInteraction(onLoginClick)} size="lg" variant="outline" className="bg-white/80">Iniciar Sesión</Button>
        </motion.div>
      </div>

      {/* Personaje YARA (hablando / idle) */}
      <AnimatePresence>
        {(scene === 'enter' || scene === 'dialog' || scene === 'idle') && yara3Frog && (
          <motion.div
            key="talking-frog"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.6, duration: 0.6 } }}
            exit={{ opacity: 0, x: 100, transition: { duration: 0.4 } }}
            className="absolute right-3 bottom-0 md:right-8 z-20 pointer-events-none"
            aria-hidden="true"
          >
            <Image
              src={yara3Frog.imageUrl}
              alt={yara3Frog.description}
              width={240}
              height={240}
              className="w-28 md:w-60 h-auto select-none"
              priority
            />
          </motion.div>
        )}
        
        {/* Personaje con lupa */}
        {scene === 'lupa' && lupaFrog && (
          <motion.div
            key="lupa-frog"
            initial={{ opacity: 0, scale: 0.9, x:100 }}
            animate={{ opacity: 1, scale: 1, x:0 }}
            exit={{ opacity: 0, scale: 0.9, x:100 }}
            className="absolute right-3 bottom-0 md:right-8 z-20 pointer-events-none"
            aria-hidden="true"
          >
            <Image
              src={lupaFrog.imageUrl}
              alt={lupaFrog.description}
              width={240}
              height={240}
              className="w-28 md:w-60 h-auto select-none"
              priority
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Globo de diálogo */}
      <AnimatePresence>
        {scene === 'dialog' && (
          <motion.div
            key="dialog-box"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.25 } }}
            className="absolute right-0 bottom-1/4 md:right-[15%] z-30"
            role="status"
            aria-live="polite"
          >
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg relative max-w-sm">
              <p className="text-lg font-bold text-primary">Me llamo YARA, te invito a crear tu usuario.</p>
              <div className="absolute left-8 -bottom-2 h-0 w-0 border-x-8 border-x-transparent border-t-[10px] border-t-white/90"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
