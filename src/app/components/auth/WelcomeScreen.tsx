'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import Logo from '@/app/components/Logo';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useMemo } from 'react';

interface WelcomeScreenProps {
  onLoginClick: () => void;
  onCreateUserClick: () => void;
}

export default function WelcomeScreen({ onLoginClick, onCreateUserClick }: WelcomeScreenProps) {
  const yaraCharImage = useMemo(() => PlaceHolderImages.find((p) => p.id === 'char-yara'), []);

  return (
    <div className="text-center flex flex-col items-center justify-center min-h-screen p-4">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Logo className="h-24 w-24 md:h-32 md:w-32 mx-auto text-primary" />
        <h1 className="text-5xl md:text-6xl font-bold font-headline text-primary mt-4">KAIRU</h1>
      </motion.div>
      
      <div className="relative mt-8 md:mt-12">
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5, type: 'spring', stiffness: 120 }}
        >
            {yaraCharImage && <Image src={yaraCharImage.imageUrl} alt="Yara" width={180} height={180} className="mx-auto" />}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="relative"
        >
          <motion.div 
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg relative">
              <p className="text-lg font-bold text-primary">Me llamo YARA, te invito a crear tu usuario.</p>
              <div className="absolute left-1/2 -translate-x-1/2 top-full h-0 w-0 border-x-8 border-x-transparent border-t-[10px] border-t-white/90"></div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }} 
        animate={{ y: 0, opacity: 1, transition: { delay: 1.5, duration: 0.5 } }} 
        className="flex flex-col sm:flex-row gap-4 justify-center mt-28 md:mt-32"
      >
        <Button onClick={onCreateUserClick} size="lg">Crear Usuario</Button>
        <Button onClick={onLoginClick} size="lg" variant="outline" className="bg-white/80">Iniciar Sesión</Button>
      </motion.div>
    </div>
  );
}
