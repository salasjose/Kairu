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

  useEffect(() => {
    if (userInteracted) return;

    let dialogTimer: NodeJS.Timeout;
    let lupaTimer: NodeJS.Timeout;
    let idleTimer: NodeJS.Timeout;

    const startSequence = () => {
      setScene('enter');
      dialogTimer = setTimeout(() => {
        if (document.hidden) return;
        setScene('dialog');
        lupaTimer = setTimeout(() => {
          if (document.hidden) return;
          setScene('lupa');
          idleTimer = setTimeout(() => {
            if (document.hidden) return;
            setScene('idle');
            startSequence(); // Loop
          }, 45000); // 45 seconds idle time
        }, 20000); // 20 seconds dialog display
      }, 5000); // 5 seconds initial wait
    };

    startSequence();

    return () => {
      clearTimeout(dialogTimer);
      clearTimeout(lupaTimer);
      clearTimeout(idleTimer);
    };
  }, [userInteracted]);


  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4 overflow-hidden">

      {/* Central Logo and Auth Buttons */}
      <div className="flex flex-col items-center justify-center w-full text-center z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo className="h-24 w-24 md:h-32 md:w-32 mx-auto text-primary" />
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

      {/* Animated Frog Character */}
      <AnimatePresence>
        {(scene === 'enter' || scene === 'dialog' || scene === 'idle') && talkingFrog && (
          <motion.div
            key="talking-frog"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0, transition: { delay: 1, duration: 0.8 } }}
            exit={{ opacity: 0, x: -100, transition: { duration: 0.5 } }}
            className="absolute left-4 top-1/2 -translate-y-1/2 md:left-8 z-20"
          >
            <Image
              src={talkingFrog.imageUrl}
              alt={talkingFrog.description}
              width={200}
              height={200}
              className="w-32 md:w-48 h-auto"
              priority
            />
          </motion.div>
        )}
        {scene === 'lupa' && lupaFrog && (
          <motion.div
            key="lupa-frog"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 md:left-8 z-20"
          >
            <Image
              src={lupaFrog.imageUrl}
              alt={lupaFrog.description}
              width={200}
              height={200}
              className="w-32 md:w-48 h-auto"
              priority
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Dialog Box */}
      <AnimatePresence>
        {(scene === 'dialog') && (
          <motion.div
            key="dialog-box"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20, transition: { duration: 0.3 } }}
            className="absolute left-4 md:left-40 top-1/3 md:top-1/4 z-30"
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
