'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/app/components/Logo';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import TypewriterText from './TypewriterText';

interface WelcomeScreenProps {
  onLoginClick: () => void;
  onCreateUserClick: () => void;
}

type AnimationStage = 'speaking' | 'thinking' | 'dialogue' | 'waiting';

export default function WelcomeScreen({ onLoginClick, onCreateUserClick }: WelcomeScreenProps) {
  const [stage, setStage] = useState<AnimationStage>('speaking');
  const [showDialogue, setShowDialogue] = useState(false);

  const images = useMemo(() => ({
    speaking: PlaceHolderImages.find(p => p.id === 'char-yara-talking'),
    posing: PlaceHolderImages.find(p => p.id === 'char-yara-3'),
    magnifying: PlaceHolderImages.find(p => p.id === 'char-yara-magnifying'),
  }), []);

  const backgroundImage = PlaceHolderImages.find(p => p.id === 'map-background')?.imageUrl;

  const [currentImage, setCurrentImage] = useState(images.speaking);
  
  useEffect(() => {
    let timers: NodeJS.Timeout[] = [];

    const cycle = () => {
        // 1. Start with Rana_hablando_2 (speaking) for 20s
        setCurrentImage(images.speaking);
        timers.push(setTimeout(() => {
            // 2. Change to YARA_3 (posing)
            setCurrentImage(images.posing);
            
            // 3. After 3s, show dialogue
            timers.push(setTimeout(() => {
                setShowDialogue(true);

                // 4. After 30s, hide dialogue
                timers.push(setTimeout(() => {
                    setShowDialogue(false);

                    // 5. Change to Rana_con_lupa (magnifying)
                    setCurrentImage(images.magnifying);

                    // 6. After 1 minute, restart cycle
                    timers.push(setTimeout(() => {
                        cycle(); // Loop
                    }, 60000));
                }, 30000));
            }, 3000));
        }, 20000));
    };

    cycle(); // Start the first cycle

    return () => {
      // Clear all timers when the component unmounts or user interacts
      timers.forEach(clearTimeout);
    };
  }, [images]);

  const handleInteraction = (callback: () => void) => {
    // This function will be called when a button is clicked.
    // It will stop the animation cycle by clearing all scheduled timers.
    // The `useEffect` cleanup function will then run.
    setStage('waiting'); // A 'paused' state
    callback();
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundImage || ''}
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/30"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 w-full text-center">
        
        {/* Logo and Title */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Logo className="h-24 w-24 md:h-32 md:w-32 mx-auto text-primary" />
          <h1 className="text-5xl md:text-6xl font-bold font-headline text-primary mt-4 text-3d">KAIRU</h1>
        </motion.div>
        
        {/* Buttons */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1, transition: { delay: 1.5, duration: 0.5 } }} 
          className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
        >
          <Button onClick={() => handleInteraction(onCreateUserClick)} size="lg">Crear Usuario</Button>
          <Button onClick={() => handleInteraction(onLoginClick)} size="lg" variant="outline" className="bg-white/80">Iniciar Sesión</Button>
        </motion.div>

        {/* Animated Yara Character & Dialogue */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
          <AnimatePresence>
            {showDialogue && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                className="w-max mb-4"
              >
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg relative max-w-xs">
                    <TypewriterText 
                        el="p"
                        text="Hola soy YARA, te invito a crear una cuenta de usuario si no tienes y si ya estas inscripto te invito a iniciar Sesión" 
                        className="text-base font-bold text-primary" 
                    />
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 h-0 w-0 border-x-8 border-x-transparent border-t-[10px] border-t-white/90"></div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <motion.div
            key={currentImage?.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="w-32 h-32 md:w-40 md:h-40 relative"
          >
            {currentImage && (
                <Image 
                    src={currentImage.imageUrl} 
                    alt={currentImage.description} 
                    fill
                    style={{objectFit: "contain"}}
                    priority 
                />
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}