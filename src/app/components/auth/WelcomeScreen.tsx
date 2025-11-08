'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Logo from '@/app/components/Logo';

interface WelcomeScreenProps {
  onLogin: () => void;
  onSignUp: () => void;
}

export default function WelcomeScreen({ onLogin, onSignUp }: WelcomeScreenProps) {
  const yaraImage = PlaceHolderImages.find(p => p.id === 'char-yara-hat');

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center">
      
      {/* Main Content Area */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }} 
        animate={{ y: 0, opacity: 1, transition: { delay: 0.2, duration: 0.5 } }}
        className="flex flex-col items-center justify-center"
      >
        <Logo className="h-24 w-24 md:h-32 md:w-32" />
        <h1 className="text-6xl md:text-8xl font-bold text-blue-900 text-3d mt-2 font-headline">
          KAIRU
        </h1>
      
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button onClick={onSignUp} size="lg" className="bg-blue-900 hover:bg-blue-800 text-white">Crear Usuario</Button>
          <Button onClick={onLogin} size="lg" variant="outline" className="bg-white/90 hover:bg-white text-blue-900">Iniciar Sesión</Button>
        </div>
      </motion.div>

      {/* Frog Character at the bottom */}
      {yaraImage && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1, transition: { delay: 0.5, duration: 0.8, type: 'spring' } }}
          className="absolute bottom-10 md:bottom-16"
        >
          <Image
            src={yaraImage.imageUrl}
            alt={yaraImage.description}
            width={150}
            height={150}
            className="w-24 h-24 md:w-36 md:h-36"
            priority
          />
        </motion.div>
      )}
    </div>
  );
}
