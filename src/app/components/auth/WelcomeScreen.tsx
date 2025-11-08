'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import TypewriterText from './TypewriterText';

interface WelcomeScreenProps {
  onLogin: () => void;
  onSignUp: () => void;
}

type AnimationState = 'talking' | 'yara' | 'magnifying' | 'dialog';

export default function WelcomeScreen({ onLogin, onSignUp }: WelcomeScreenProps) {
  const [animState, setAnimState] = useState<AnimationState>('talking');
  const [showDialog, setShowDialog] = useState(false);
  const [interrupt, setInterrupt] = useState(false);

  const images = useMemo(() => ({
    talking: PlaceHolderImages.find(p => p.id === 'char-yara-talking'),
    yara: PlaceHolderImages.find(p => p.id === 'char-yara'),
    magnifying: PlaceHolderImages.find(p => p.id === 'char-yara-magnifying-glass'),
  }), []);

  useEffect(() => {
    if (interrupt) return;

    const sequence: { state: AnimationState; duration: number }[] = [
      { state: 'talking', duration: 20000 },
      { state: 'yara', duration: 3000 },
      { state: 'dialog', duration: 30000 },
      { state: 'magnifying', duration: 60000 },
    ];
    
    let currentIndex = 0;

    const runSequence = () => {
        if (interrupt) return;
        const currentStep = sequence[currentIndex];
        setAnimState(currentStep.state);
        
        if (currentStep.state === 'dialog') {
            setShowDialog(true);
        } else {
            setShowDialog(false);
        }

        const timer = setTimeout(() => {
            currentIndex = (currentIndex + 1) % sequence.length;
            runSequence();
        }, currentStep.duration);
        
        return () => clearTimeout(timer);
    };

    const clearTimer = runSequence();
    return clearTimer;

  }, [interrupt]);

  const handleInteraction = (action: () => void) => {
    setInterrupt(true);
    action();
  };
  
  const currentImage = images[animState === 'dialog' ? 'yara' : animState];

  return (
    <div className="text-center w-full max-w-2xl flex flex-col items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={animState}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
        >
          {currentImage && (
            <Image
              src={currentImage.imageUrl}
              alt={currentImage.description}
              width={200}
              height={200}
              className="mx-auto"
              priority
            />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showDialog && (
          <motion.div
            key="dialog"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="mt-4 w-full"
          >
            <Card className="p-4 bg-white/90 backdrop-blur-sm">
                <TypewriterText 
                    text='hola soy YARA, te invito a crear una cuenta de usuario si no tienes y si ya estás inscrito te invito a Iniciar Sesión'
                    className="text-primary font-bold text-lg"
                />
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1, transition: { delay: 1, duration: 0.5 } }} 
        className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
      >
        <Button onClick={() => handleInteraction(onSignUp)} size="lg">Crear Usuario</Button>
        <Button onClick={() => handleInteraction(onLogin)} size="lg" variant="outline" className="bg-white/80">Iniciar Sesión</Button>
      </motion.div>
    </div>
  );
}

    