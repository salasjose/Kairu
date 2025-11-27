'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { useStationProgress } from '@/hooks/use-station-progress';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowLeft,
  CheckCircle,
  Recycle,
  Trash2,
  Sparkles,
  Link as LinkIcon,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import RecyclingGame from './RecyclingGame';
import PrizeDialog from '../PrizeDialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterText from '../auth/TypewriterText';
import { usePrizeCart } from '@/hooks/use-prize-cart';
import ResponsiveBackground from '../ResponsiveBackground';
import ChallengeDetail from './ChallengeDetail';

const challenges = {
  game: {
    title: 'Reto 1: Recolección',
    description:
      '¡Qué montón de basura! Tu misión es recolectarla y disponerla en la caneca que corresponda.',
    imageId: 'recycling-game',
    icon: Trash2,
  },
  'video-separate': {
    title: 'Reto 2: Video Doméstico',
    description:
      'Separa los residuos sólidos en tu hogar, haz un video de cómo lo haces. ¡Estoy ansiosa por ver tu compromiso!',
    imageId: 'waste-separation',
    dbField: 'station3UrlSeparate',
    validation: {
        hosts: ['youtube.com', 'youtu.be', 'tiktok.com'],
        message: "Por favor, ingresa una URL de YouTube o TikTok."
    },
    icon: Recycle,
  },
  'photos-crafts': {
    title: 'Reto 3: Creaciones',
    description:
      'Crea nuevos productos a partir de residuos reciclados. Monta un post en Instagram, etiquétanos @fundaciontekara y @corpoguajira y comparte el enlace.',
    imageId: 'recycled-art',
    dbField: 'station3UrlCrafts',
    validation: {
        hosts: ['instagram.com', 'facebook.com', 'x.com', 'twitter.com'],
        message: "Por favor, ingresa una URL de Instagram, Facebook o X."
    },
    icon: Sparkles,
  },
};

type ChallengeId = keyof typeof challenges;

export default function Station3() {
  const stationId = 3;
  const [selectedChallenge, setSelectedChallenge] =
    useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const { completedChallenges, completeChallenge } = useStationProgress();
  const { prizes } = usePrizeCart();
  const router = useRouter();

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage =
    '¡Qué emoción! En ReNova descubriremos que nada se desperdicia cuando usamos la creatividad. Convierte lo viejo en nuevo, lo usado en útil y demuestra que transformar también es cuidar. ¡Manos a la obra!';
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const yaraCharImage = PlaceHolderImages.find((p) => p.id === 'char-yara');

  const scheduleYaraDialog = useCallback(() => {
    if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    yaraTimerRef.current = setTimeout(() => {
      setShowYaraDialog(true);
      const hideTimer = setTimeout(() => setShowYaraDialog(false), 15000);
    }, 1000);
  }, []);

  useEffect(() => {
    scheduleYaraDialog();
    return () => {
      if (yaraTimerRef.current) clearTimeout(yaraTimerRef.current);
    };
  }, [scheduleYaraDialog]);

  const handleChallengeComplete = (challengeId: ChallengeId) => {
    if (!completedChallenges[stationId]?.[challengeId]?.completed) {
      completeChallenge(stationId, challengeId);
    }
    setSelectedChallenge(null);
    toast({
      title: `¡Reto '${challenges[challengeId].title}' completado!`,
      description: '¡Sigue así! Completa todos los retos para avanzar.',
    });
  };

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    unlockStation(stationId + 1);
    toast({
      title: `¡Estación ${stationId} Completada!`,
      description: '¡Has desbloqueado la siguiente estación!',
    });
    router.push('/');
  };

  const stationProgress = completedChallenges[stationId] || {};
  const isGameChallengeCompleted = !!(
    stationProgress['game-classify']?.completed &&
    stationProgress['game-drag-and-drop']?.completed
  );

  const areAllChallengesComplete = Object.keys(challenges).every((id) => {
    if (id === 'game') return isGameChallengeCompleted;
    return stationProgress[id as ChallengeId]?.completed;
  });

  const hasClaimedPrize = prizes.some((p) => p.stationId === stationId);
  
  useEffect(() => {
    if(areAllChallengesComplete && !hasClaimedPrize) {
      setIsPrizeModalOpen(true);
    }
  }, [areAllChallengesComplete, hasClaimedPrize]);


  const renderContent = () => {
    if (selectedChallenge === 'game') {
      return (
        <div className="flex-grow flex items-center justify-center p-4">
          <RecyclingGame onBack={() => setSelectedChallenge(null)} />
        </div>
      );
    }

    if (selectedChallenge) {
      const challengeInfo = challenges[selectedChallenge];
      const isCompleted = !!stationProgress[selectedChallenge]?.completed;

      return (
        <div className="flex-grow flex items-center justify-center p-4">
          <ChallengeDetail
            title={challengeInfo.title}
            description={challengeInfo.description}
            imageId={challengeInfo.imageId}
            dbField={challengeInfo.dbField}
            validation={challengeInfo.validation}
            onComplete={() => handleChallengeComplete(selectedChallenge)}
            onBack={() => setSelectedChallenge(null)}
            isCompleted={isCompleted}
          />
        </div>
      );
    }

    return (
      <ResponsiveBackground
        desktopSrc="/backgrounds/Renova1366_X_768.png"
        tabletSrc="/backgrounds/Renova1024_X_768.png"
        mobileSrc="/backgrounds/Renova1075_X_1944.png"
      >
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">ReNova</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8">
            {(Object.keys(challenges) as ChallengeId[]).map((key) => {
              const challenge = challenges[key];
              const Icon = challenge.icon;

              const isCompleted =
                key === 'game'
                  ? isGameChallengeCompleted
                  : !!stationProgress[key]?.completed;

              return (
                <button
                  key={key}
                  onClick={() => setSelectedChallenge(key)}
                  className="transition-transform duration-300 hover:scale-105 group"
                >
                  <Card className="w-48 h-56 bg-card/70 backdrop-blur-sm hover:bg-card/90 transition-colors relative">
                    <CardContent className="flex flex-col items-center justify-center text-center p-2 md:p-4 h-full">
                      <Icon className="w-10 h-10 md:w-12 md:h-12 text-primary mb-2 md:mb-3" />
                      <h2 className="font-bold font-headline text-base md:text-lg text-primary">
                        {challenge.title}
                      </h2>
                    </CardContent>
                    {isCompleted && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-lg">
                        <CheckCircle className="text-white h-5 w-5" />
                      </div>
                    )}
                  </Card>
                </button>
              );
            })}
          </div>

          <div className="mt-4 max-w-md mx-auto space-y-4 text-center">
            <Button
              onClick={() => setIsPrizeModalOpen(true)}
              disabled={!areAllChallengesComplete || hasClaimedPrize}
              size="lg"
            >
              Completar Estación y Reclamar Insignia
            </Button>
            {areAllChallengesComplete && hasClaimedPrize ? (
              <p className="bg-background/80 p-2 rounded-md text-sm">
                Ya has reclamado la insignia de esta estación.
              </p>
            ) : !areAllChallengesComplete && (
              <p className="bg-background/80 p-2 rounded-md text-sm">
                Completa todos los retos para reclamar tu insignia.
              </p>
            )}
          </div>
        </div>
      </ResponsiveBackground>
    );
  };

  return (
    <>
      {renderContent()}

      {/* Yara Character and Dialog */}
      {!selectedChallenge && (
        <div className="absolute bottom-4 right-4 sm:right-8 z-20 w-full max-w-xs sm:max-w-sm md:max-w-md pointer-events-none">
          <AnimatePresence>
            {showYaraDialog && yaraCharImage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20, transition: { duration: 0.5 } }}
                transition={{ duration: 0.5 }}
                className="flex items-end gap-2"
              >
                <div className="flex-grow mb-4">
                  <Card className="p-3 shadow-lg bg-white/95 relative">
                    <TypewriterText
                      text={yaraMessage}
                      className="text-sm text-primary font-medium"
                    />
                    <div className="absolute bottom-[-10px] right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                  </Card>
                </div>
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  animate={{
                    opacity: 1,
                    x: 0,
                    transition: { delay: 0.5, duration: 0.8 },
                  }}
                  exit={{ opacity: 0, x: 50, transition: { duration: 0.5 } }}
                  className="w-24 h-auto md:w-32 shrink-0"
                >
                  <Image
                    src={yaraCharImage.imageUrl}
                    alt={yaraCharImage.description}
                    width={150}
                    height={187}
                    className="h-auto w-full select-none"
                    priority
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <PrizeDialog
        open={isPrizeModalOpen}
        stationId={stationId}
        onClaim={handleClaimPrize}
      />
    </>
  );
}
