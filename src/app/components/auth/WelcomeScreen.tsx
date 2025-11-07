'use client';

import { motion } from 'framer-motion';
import Logo from '@/app/components/Logo';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

interface WelcomeScreenProps {
  onLoginClick: () => void;
  onCreateUserClick: () => void;
}

export default function WelcomeScreen({ onLoginClick, onCreateUserClick }: WelcomeScreenProps) {
  const yaraImage = PlaceHolderImages.find(p => p.id === 'char-yara-talking');
  const backgroundImage = PlaceHolderImages.find(p => p.id === 'map-background')?.imageUrl;

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image - Nueva capa de fondo */}
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
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between min-h-screen p-4 w-full">
        {/* Animated Yara Character */}
        <motion.div 
          initial={{ opacity: 0, x: -100 }} 
          animate={{ opacity: 1, x: 0 }} 
          transition={{ delay: 1, duration: 0.8 }} 
          className="absolute left-4 top-1/2 -translate-y-1/2 md:left-8"
        >
          {yaraImage && (
            <motion.div 
              animate={{ y: [0, -10, 0] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image 
                src={yaraImage.imageUrl} 
                alt={yaraImage.description} 
                width={200} 
                height={200} 
                className="w-32 md:w-48 h-auto" 
                priority 
              />
            </motion.div>
          )}
        </motion.div>
      
        <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="absolute left-4 top-1/3 md:left-40 md:top-1/4"
        >
            <motion.div 
                className="w-max"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg relative">
                    <p className="text-lg font-bold text-primary">Me llamo YARA, te invito a crear tu usuario.</p>
                    <div className="absolute left-8 -bottom-2 h-0 w-0 border-x-8 border-x-transparent border-t-[10px] border-t-white/90"></div>
                </div>
            </motion.div>
        </motion.div>
      
        <div className="flex flex-col items-center justify-center w-full text-center">
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
            animate={{ y: 0, opacity: 1, transition: { delay: 1.5, duration: 0.5 } }} 
            className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
            >
            <Button onClick={onCreateUserClick} size="lg">Crear Usuario</Button>
            <Button onClick={onLoginClick} size="lg" variant="outline" className="bg-white/80">Iniciar Sesión</Button>
            </motion.div>
        </div>
      </div>
    </div>
  );
}
