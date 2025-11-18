'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { useStationProgress } from '@/hooks/use-station-progress';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, ArrowLeft, Puzzle, CheckCircle, Lock, Link as LinkIcon } from 'lucide-react';
import PrizeDialog from '../PrizeDialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useUser, useFirestore } from '@/firebase/hooks';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterText from '../auth/TypewriterText';
import { useChallengeProgress } from '@/hooks/use-challenge-progress';
import CrosswordGame from './CrosswordGame';
import { REGIRA_CROSSWORD_DATA } from '@/lib/regira-crossword-data';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import ArtDirectedBackground from '../ArtDirectedBackground';

const challenges = {
  video: {
    title: 'Negocios Exitosos',
    description: 'Carga un video sobre un negocio que aplique la economía circular.',
    icon: Upload,
  },
  crossword: {
    title: 'Crucigrama Circular',
    description: 'Resuelve el crucigrama sobre economía circular y sostenibilidad.',
    icon: Puzzle,
  },
};
type ChallengeId = keyof typeof challenges;

const VideoChallenge = ({ onBack, onComplete }: { onBack: () => void; onComplete: () => void }) => {
  const { user } = useUser();
  const db = useFirestore();
  const [url, setUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const circularEconomyImage = PlaceHolderImages.find(
    p => p.id === 'circular-economy-product'
  );

  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);
    if (newUrl.trim() && (newUrl.startsWith('http://') || newUrl.startsWith('https://'))) {
      if (newUrl.includes('youtube.com/watch?v=')) {
        const videoId = newUrl.split('v=')[1].split('&')[0];
        setVideoUrl(`https://www.youtube.com/embed/${videoId}`);
      } else if (newUrl.includes('youtu.be/')) {
        const videoId = newUrl.split('youtu.be/')[1].split('?')[0];
        setVideoUrl(`https://www.youtube.com/embed/${videoId}`);
      } else {
        setVideoUrl(null);
      }
    } else {
      setVideoUrl(null);
    }
  }, []);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!user || !db) {
        setIsLoading(false);
        return;
      }

      const userDocRef = doc(db, 'users', user.uid);
      try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().station6VideoUrl) {
          const savedUrl = docSnap.data().station6VideoUrl;
          handleUrlChange(savedUrl);
        }
      } catch (error) {
        console.error('Error fetching video URL from Firestore:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchVideo();
  }, [user, db, handleUrlChange]);

  const handleCompleteClick = async () => {
    if (!url.trim()) {
      toast({
        title: 'Reto Incompleto',
        description: 'Debes pegar una URL para completar el reto.',
        variant: 'destructive',
      });
      return;
    }

     if (user && db) {
        try {
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, { station6VideoUrl: url }, { merge: true });
            toast({ title: 'URL Guardada', description: 'Tu enlace ha sido guardado.' });
            onComplete();
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo guardar la URL.', variant: 'destructive' });
        }
    } else {
        toast({ title: 'Error', description: 'Debes iniciar sesión para guardar.', variant: 'destructive' });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-full">
      <div className="w-full">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver a los retos
        </Button>
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">
              {challenges.video.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="bg-black rounded-lg border-4 border-white shadow-md mx-auto mb-6 w-full max-w-sm h-auto aspect-video flex items-center justify-center">
              {isLoading ? (
                <p className="text-white">Cargando...</p>
              ) : videoUrl && videoUrl.includes("youtube.com/embed") ? (
                <iframe
                    src={videoUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg w-full h-full"
                ></iframe>
              ) : (
                circularEconomyImage && (
                  <Image
                    src={circularEconomyImage.imageUrl}
                    alt={circularEconomyImage.description}
                    width={400}
                    height={225}
                    className="object-cover w-full h-full opacity-50"
                    data-ai-hint={circularEconomyImage.imageHint}
                  />
                )
              )}
            </div>
            <p className="text-muted-foreground mb-4">{challenges.video.description}</p>
            <div className="flex justify-center gap-2 max-w-md mx-auto mb-4">
               <LinkIcon className="h-10 text-muted-foreground" />
               <Input 
                 type="url"
                 placeholder="Pega el enlace de tu video aquí"
                 value={url}
                 onChange={(e) => handleUrlChange(e.target.value)}
                 disabled={isLoading}
               />
            </div>
            <Button onClick={handleCompleteClick} size="lg">
                Completar Reto
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CrosswordChallenge = ({ onBack, onComplete, onLose }: { onBack: () => void; onComplete: () => void; onLose: () => void }) => {
    return (
        <CrosswordGame 
            data={REGIRA_CROSSWORD_DATA} 
            onComplete={onComplete} 
            onBack={onBack}
            onLose={onLose}
        />
    );
};


export default function Station6() {
  const stationId = 6;
  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const { completedChallenges, completeChallenge } = useChallengeProgress();
  const router = useRouter();

  const [lockoutTime, setLockoutTime] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedLockout = localStorage.getItem('station6-lockout');
    if (savedLockout) {
        const lockoutUntil = parseInt(savedLockout, 10);
        const now = Date.now();
        if (lockoutUntil > now) {
            setLockoutTime(lockoutUntil - now);
        }
    }
  }, []);

  useEffect(() => {
    if (lockoutTime > 0) {
        const timer = setTimeout(() => {
            setLockoutTime(prev => Math.max(0, prev - 1000));
        }, 1000);
        return () => clearTimeout(timer);
    }
  }, [lockoutTime]);

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage =
    '¡Estamos en ReGira! Aquí aprenderás que todo en la naturaleza gira y se renueva. Cada recurso tiene una segunda oportunidad. ¡Es momento de cerrar el ciclo y darle nueva vida a lo que parecía terminar!';
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const yaraCharImage = PlaceHolderImages.find(p => p.id === 'char-yara');

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
    completeChallenge(stationId, challengeId);
    toast({
      title: `¡Reto '${challenges[challengeId].title}' superado!`,
      description: '¡Sigue así! Completa todos los retos para avanzar.',
    });
    setSelectedChallenge(null);
  };
  
  const handleCrosswordLose = () => {
    const lockoutDuration = 3 * 60 * 1000; // 3 minutes
    const lockoutUntil = Date.now() + lockoutDuration;
    localStorage.setItem('station6-lockout', lockoutUntil.toString());
    setLockoutTime(lockoutDuration);
    setSelectedChallenge(null);
    toast({
        title: "Reto Fallido",
        description: "Podrás intentarlo de nuevo en 3 minutos.",
        variant: "destructive"
    });
  }

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    unlockStation(stationId + 1);
    router.push('/');
  };

  const stationProgress = completedChallenges[stationId] || {};
  const areAllChallengesComplete = Object.keys(challenges).every(id => stationProgress[id as ChallengeId]?.completed);

  const formatLockoutTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }

  const renderContent = () => {
    if (selectedChallenge === 'video') {
      return (
        <VideoChallenge
          onBack={() => setSelectedChallenge(null)}
          onComplete={() => handleChallengeComplete('video')}
        />
      );
    }
    if (selectedChallenge === 'crossword') {
      return (
        <CrosswordChallenge
          onBack={() => setSelectedChallenge(null)}
          onComplete={() => handleChallengeComplete('crossword')}
          onLose={handleCrosswordLose}
        />
      );
    }

    return (
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto">
        <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
          <h1 className="text-3xl md:text-5xl">ReGira</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
          {(Object.keys(challenges) as ChallengeId[]).map(key => {
            const challenge = challenges[key];
            const Icon = challenge.icon;
            const isCompleted = stationProgress[key]?.completed;
            const isLocked = key === 'crossword' && isClient && lockoutTime > 0;

            return (
              <button
                key={key}
                onClick={() => {
                    if (isLocked) {
                        toast({title: "Reto Bloqueado", description: `Podrás intentarlo en ${formatLockoutTime(lockoutTime)}`, variant: "destructive"});
                    } else {
                        setSelectedChallenge(key)
                    }
                }}
                className="transition-transform duration-300 hover:scale-105 group"
                disabled={isLocked}
              >
                <Card
                  className={cn(
                    'w-60 h-auto bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors relative',
                    isCompleted && 'border-green-500 border-2',
                    isLocked && 'bg-gray-500/30 border-gray-600 cursor-not-allowed'
                  )}
                >
                  <CardContent className="flex flex-col items-center justify-center text-center p-4 h-full">
                    {isCompleted && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5 shadow-lg z-10">
                        <CheckCircle className="text-white h-5 w-5" />
                      </div>
                    )}
                    {isLocked && (
                         <div className="absolute top-2 right-2 bg-destructive rounded-full p-1.5 shadow-lg z-10">
                            <Lock className="text-white h-5 w-5" />
                        </div>
                    )}
                    <Icon className={cn("w-12 h-12 text-primary mb-3", isLocked && "text-gray-400")} />
                    <h2 className={cn("font-bold font-headline text-xl text-primary", isLocked && "text-gray-400")}>
                      {challenge.title}
                    </h2>
                    <p className={cn("text-muted-foreground text-sm mt-1", isLocked && "text-gray-500")}>
                        {isLocked ? `Bloqueado por ${formatLockoutTime(lockoutTime)}` : challenge.description}
                    </p>
                  </CardContent>
                </Card>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex flex-col items-center gap-2">
          <Button
            onClick={() => setIsPrizeModalOpen(true)}
            size="lg"
            disabled={!areAllChallengesComplete}
          >
            Completar Estación y Reclamar Insignia
          </Button>
          {!areAllChallengesComplete && (
            <p className="text-sm text-muted-foreground bg-background/80 p-2 rounded-md">
              Completa ambos retos para activar este botón.
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
       <ArtDirectedBackground
          desktopSrc="/backgrounds/Regira1366_X_768.png"
          tabletSrc="/backgrounds/Regira1024_X_768.png"
          mobileSrc="/backgrounds/Regira1075_X_1944.png"
        >
        {renderContent()}

        {/* Yara Character and Dialog */}
        <div className="absolute bottom-4 right-4 z-20 flex items-end gap-4 pointer-events-none">
          <AnimatePresence>
            {showYaraDialog && !selectedChallenge && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                className="w-64 mb-4"
              >
                <Card className="p-3 shadow-lg bg-white/95 relative">
                  <TypewriterText text={yaraMessage} className="text-sm text-primary font-medium" />
                  <div className="absolute bottom-[-10px] right-8 w-0 h-0 border-l-[10px] border-l-transparent border-t-[10px] border-t-white/95 border-r-[10px] border-r-transparent"></div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {yaraCharImage && !selectedChallenge && (
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0, transition: { delay: 0.5, duration: 0.8 } }}
              className="w-24 h-auto md:w-32"
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
          )}
        </div>
      </ArtDirectedBackground>
      <PrizeDialog open={isPrizeModalOpen} stationId={stationId} onClaim={handleClaimPrize} />
    </>
  );
}
