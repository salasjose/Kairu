'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { toast } from '@/hooks/use-toast';
import { useStationProgress } from '@/hooks/use-station-progress';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  BrainCircuit,
  CheckCircle,
  Link as LinkIcon,
} from 'lucide-react';
import WaterQuiz from '@/app/components/challenges/WaterQuiz';
import { Input } from '@/components/ui/input';
import PrizeDialog from '../PrizeDialog';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { motion, AnimatePresence } from 'framer-motion';
import TypewriterText from '../auth/TypewriterText';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useChallengeProgress } from '@/hooks/use-challenge-progress';
import { cn } from '@/lib/utils';
import { usePrizeCart } from '@/hooks/use-prize-cart';
import ResponsiveBackground from '../ResponsiveBackground';

const challenges = {
  quiz: {
    title: 'Quiz',
    description:
      'Pon a prueba tus conocimientos sobre el agua en un emocionante juego de preguntas. ¡Demuestra todo lo que sabes!',
    icon: BrainCircuit,
  },
  post: {
    title: 'Post',
    description:
      'Crea un post de conservación del agua, etiquétanos @fundaciontekara y @corpoguajira y comparte el enlace.',
    icon: LinkIcon,
  },
};

type ChallengeId = keyof typeof challenges;

const PostChallenge = ({
  onComplete,
  onBack,
  isCompleted,
}: {
  onComplete: () => void;
  onBack: () => void;
  isCompleted: boolean;
}) => {
  const { user } = useUser();
  const db = useFirestore();

  const [url, setUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const waterPostImage = PlaceHolderImages.find((p) => p.id === 'water-post');

  const handleUrlChange = useCallback((newUrl: string) => {
    setUrl(newUrl);
    if (
      newUrl.trim() &&
      (newUrl.startsWith('http://') || newUrl.startsWith('https://'))
    ) {
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
    const fetchUrl = async () => {
      if (!user || !db) return;
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data().station4Url) {
          handleUrlChange(docSnap.data().station4Url);
        }
      } catch (error) {
        console.error('Error fetching station 4 URL:', error);
      }
    };
    fetchUrl();
  }, [user, db, handleUrlChange]);

  const handleSubmit = async () => {
    const validHosts = [
      'instagram.com',
      'facebook.com',
      'linkedin.com',
      'x.com',
      'twitter.com',
    ];
    let isValid = false;
    try {
      const urlObject = new URL(url);
      isValid = validHosts.some((host) => urlObject.hostname.includes(host));
    } catch (e) {
      isValid = false;
    }

    if (!isValid) {
      toast({
        title: 'URL Inválida',
        description:
          'Por favor, ingresa una URL válida de Instagram, Facebook, LinkedIn o X (Twitter).',
        variant: 'destructive',
      });
      return;
    }

    if (user && db) {
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { station4Url: url }, { merge: true });
        toast({
          title: 'URL Guardada',
          description: 'Tu enlace ha sido guardado. ¡Reto completado!',
        });
        onComplete();
      } catch (error) {
        toast({
          title: 'Error',
          description: 'No se pudo guardar la URL.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Error',
        description: 'Debes iniciar sesión para guardar.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center flex-grow">
      <div className="w-full">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a los retos
        </Button>
        <Card className="text-center w-full shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-bold text-2xl text-primary font-headline mb-4">
              Post de Conservación
            </h3>

            <div className="mx-auto mb-6 w-full max-w-sm h-auto aspect-video bg-black rounded-lg border-4 border-white shadow-md flex items-center justify-center">
              {videoUrl && videoUrl.includes('youtube.com/embed') ? (
                <iframe
                  src={videoUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg w-full h-full"
                ></iframe>
              ) : (
                waterPostImage && (
                  <Image
                    src={waterPostImage.imageUrl}
                    alt={waterPostImage.description}
                    width={400}
                    height={300}
                    className="rounded-lg object-cover w-full h-full"
                    data-ai-hint={waterPostImage.imageHint}
                  />
                )
              )}
            </div>

            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {challenges.post.description}
            </p>
            <div className="flex flex-col gap-4 max-w-md mx-auto">
              <div className="flex gap-2">
                <LinkIcon className="h-10 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://instagram.com/tu-post"
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  disabled={isCompleted}
                />
              </div>
               {isCompleted ? (
                 <Button size="lg" disabled>
                    <CheckCircle className="mr-2" />
                    Reto Completado
                 </Button>
                ) : (
                 <Button onClick={handleSubmit} size="lg">
                    <CheckCircle className="mr-2" />
                    Guardar y Completar
                 </Button>
                )}
            </div>
            {isCompleted && url && (
              <div className="mt-4 text-sm">
                <p className="text-muted-foreground">Enlace guardado:</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline break-all"
                >
                  {url}
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function Station4() {
  const stationId = 4;
  const [selectedChallenge, setSelectedChallenge] =
    useState<ChallengeId | null>(null);
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const { unlockStation } = useStationProgress();
  const { completedChallenges, completeChallenge } = useChallengeProgress();
  const { prizes } = usePrizeCart();
  const router = useRouter();

  const [showYaraDialog, setShowYaraDialog] = useState(false);
  const yaraMessage =
    '¡Bienvenido a TerrAzul! Aquí fluye la vida. El agua recorre montañas, ríos y mares, y depende de nosotros mantener su pureza. ¡Cuidemos cada gota y protejamos los territorios que le dan vida al planeta!';
  const yaraTimerRef = useRef<NodeJS.Timeout | null>(null);

  const yaraCharImage = PlaceHolderImages.find(
    (p) => p.id === 'char-yara-talking'
  );

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
    // Check if the challenge is already completed to avoid redundant actions
    if (!completedChallenges[stationId]?.[challengeId]?.completed) {
      completeChallenge(stationId, challengeId);
    }
    setSelectedChallenge(null);
    toast({
      title: `¡Reto '${challenges[challengeId].title}' superado!`,
      description: '¡Excelente! Completa el otro reto para avanzar.',
    });
  };

  const handleClaimPrize = () => {
    setIsPrizeModalOpen(false);
    unlockStation(stationId + 1);
    router.push('/');
  };

  const stationProgress = completedChallenges[stationId] || {};
  const areAllChallengesComplete = Object.keys(challenges).every(
    (id) => stationProgress[id as ChallengeId]?.completed
  );
  const hasClaimedPrize = prizes.some((p) => p.stationId === stationId);

  const renderContent = () => {
    if (selectedChallenge === 'quiz') {
      const isQuizCompleted = !!stationProgress['quiz']?.completed;
      return (
        <div className="flex-grow flex items-center justify-center p-4">
          <WaterQuiz
            onComplete={() => handleChallengeComplete('quiz')}
            onBack={() => setSelectedChallenge(null)}
            onSwitchChallenge={() => setSelectedChallenge('post')}
            isCompleted={isQuizCompleted}
          />
        </div>
      );
    }
    if (selectedChallenge === 'post') {
      const isPostCompleted = !!stationProgress['post']?.completed;
      return (
        <div className="flex-grow flex items-center justify-center p-4">
          <PostChallenge
            onComplete={() => handleChallengeComplete('post')}
            onBack={() => setSelectedChallenge(null)}
            isCompleted={isPostCompleted}
          />
        </div>
      );
    }
    return (
      <ResponsiveBackground
        desktopSrc="/backgrounds/TerrAzul1366x_768.png"
        tabletSrc="/backgrounds/TerrAzul1024x_768.png"
        mobileSrc="/backgrounds/TerrAzul1075_X_1944.png"
      >
        <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
          <div className="bg-primary text-white font-headline py-3 px-8 md:px-10 rounded-lg shadow-lg mb-8 text-center">
            <h1 className="text-3xl md:text-5xl">TerrAzul</h1>
          </div>

          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            {(Object.keys(challenges) as ChallengeId[]).map((key) => {
              const challenge = challenges[key];
              const Icon = challenge.icon;
              const isCompleted = stationProgress[key as ChallengeId]?.completed;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedChallenge(key as ChallengeId)}
                  className={cn(
                    'transition-transform duration-300 group',
                    'hover:scale-105'
                  )}
                >
                  <Card className="relative w-60 md:w-64 h-auto md:h-56 bg-card/80 backdrop-blur-sm hover:bg-card/95 transition-colors">
                    {isCompleted && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1.5 shadow-lg z-10">
                        <CheckCircle className="text-white h-5 w-5" />
                      </div>
                    )}
                    <CardContent className="flex flex-col items-center justify-center text-center p-4 h-full">
                      <Icon className="w-12 h-12 md:w-16 md:h-16 text-primary mb-3" />
                      <h2 className="font-bold font-headline text-xl md:text-2xl text-primary">
                        {challenge.title}
                      </h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        {challenge.description}
                      </p>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>

          <div className="mt-4 max-w-md mx-auto space-y-2 text-center">
            <Button
              size="lg"
              disabled={!areAllChallengesComplete || hasClaimedPrize}
              onClick={() => setIsPrizeModalOpen(true)}
            >
              Completar Estación y Reclamar Insignia
            </Button>
            {areAllChallengesComplete && hasClaimedPrize ? (
              <p className="bg-background/80 p-2 rounded-md text-sm text-muted-foreground">
                Ya has reclamado la insignia de esta estación.
              </p>
            ) : !areAllChallengesComplete && (
              <p className="bg-background/80 p-2 rounded-md text-sm text-muted-foreground">
                Completa ambos retos para reclamar tu insignia.
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
      {!selectedChallenge && (
        <div className="absolute bottom-4 right-4 sm:right-8 lg:right-12 z-20 w-full max-w-xs sm:max-w-sm md:max-w-md pointer-events-none">
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
                  className="w-24 h-auto md:w-32 self-end shrink-0"
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
