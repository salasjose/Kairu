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

  const handleInteraction = useCallback((callback: () => void) => {
    setUserInteracted(true);
    callback();
  }, []);

  // Secuencia con limpieza + pausa si la pestaña no está visible
  useEffect(() => {
    if (userInteracted) return;

    let dialogTimer: ReturnType<typeof setTimeout>;
    let lupaTimer: ReturnType<typeof setTimeout>;
    let idleTimer: ReturnType<typeof setTimeout>;

    const startSequence = () => {
      setScene('enter');
      dialogTimer = setTimeout(() => {
        if (document.hidden) return; // evita saltos al volver la pestaña
        setScene('dialog');
        lupaTimer = setTimeout(() => {
          if (document.hidden) return;
          setScene('lupa');
          idleTimer = setTimeout(() => {
            if (document.hidden) return;
            setScene('idle');
            startSequence(); // loop suave
          }, 45000);
        }, 20000);
      }, 5000);
    };

    startSequence();

    const onVisibilityChange = () => {
      // cuando vuelve visible, reinicia para no “perder” escenas
      if (!document.hidden && !userInteracted) {
        clearTimeout(dialogTimer);
        clearTimeout(lupaTimer);
        clearTimeout(idleTimer);
        startSequence();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimeout(dialogTimer);
      clearTimeout(lupaTimer);
      clearTimeout(idleTimer);
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
        {(scene === 'enter' || scene === 'dialog' || scene === 'idle') && talkingFrog && (
          <motion.div
            key="talking-frog"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 0.6, duration: 0.6 } }}
            exit={{ opacity: 0, x: -100, transition: { duration: 0.4 } }}
            className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
            aria-hidden="true"
          >
            <Image
              src={talkingFrog.imageUrl}
              alt={talkingFrog.description}
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
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none"
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
            className="absolute left-[calc(theme(spacing.3)+theme(spacing.28))] md:left-[calc(theme(spacing.8)+theme(spacing.60))] top-[22%] md:top-[18%] z-30"
            role="status"
            aria-live="polite"
          >
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg relative max-w-xs">
              <p className="text-lg font-bold text-primary">Me llamo YARA, te invito a crear tu usuario.</p>
              <div className="absolute left-8 -bottom-2 h-0 w-0 border-x-8 border-x-transparent border-t-[10px] border-t-white/90"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
