'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, CheckCircle, Link as LinkIcon } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface ChallengeDetailProps {
  title: string;
  description: string;
  imageId: string;
  dbField?: string;
  validation?: {
    hosts: string[];
    message: string;
  };
  onComplete: () => void;
  onBack: () => void;
  isCompleted: boolean;
}

export default function ChallengeDetail({
  title,
  description,
  imageId,
  dbField,
  validation,
  onComplete,
  onBack,
  isCompleted,
}: ChallengeDetailProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [url, setUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const imageInfo = PlaceHolderImages.find((p) => p.id === imageId);

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
        setVideoUrl(newUrl);
      }
    } else {
      setVideoUrl(null);
    }
  }, []);

  useEffect(() => {
    const fetchUrl = async () => {
      if (!user || !db || !dbField) return;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data()[dbField]) {
          const savedUrl = docSnap.data()[dbField];
          handleUrlChange(savedUrl);
        }
      } catch (error) {
        console.error(`Error fetching ${dbField} from Firestore:`, error);
      }
    };
    fetchUrl();
  }, [dbField, user, db, handleUrlChange]);

  const validateUrl = (urlToValidate: string) => {
    if (!validation) return true;
    try {
      const urlObject = new URL(urlToValidate);
      return validation.hosts.some((host) =>
        urlObject.hostname.includes(host)
      );
    } catch (error) {
      return false;
    }
  };

  const handleSaveAndComplete = async () => {
    if (isCompleted) return;

    if (!dbField) {
      onComplete();
      return;
    }

    if (!url.trim() || !validateUrl(url)) {
      toast({
        title: 'URL Inválida',
        description: validation?.message || 'Por favor, ingresa una URL válida.',
        variant: 'destructive',
      });
      return;
    }

    if (!user || !db) {
      toast({
        title: 'Error',
        description: 'No se puede guardar. Usuario no autenticado.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { [dbField]: url }, { merge: true });
      toast({
        title: 'Guardado',
        description: `Tu enlace para '${title}' ha sido guardado.`,
      });
      onComplete();
    } catch (error) {
      console.error(`Error saving ${dbField} to Firestore:`, error);
      toast({
        title: 'Error al guardar',
        description: 'No se pudo guardar la URL en la nube.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 flex flex-col items-center justify-center min-h-full">
      <div className="w-full">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a los retos
        </Button>
        <Card className="text-center w-full shadow-lg">
          <CardContent className="p-6">
            <h3 className="font-bold text-2xl text-primary font-headline mb-4">
              {title}
            </h3>
            <div className="mx-auto mb-6 w-full max-w-sm h-auto aspect-video bg-black rounded-lg border-4 border-white shadow-md flex items-center justify-center">
              {videoUrl && videoUrl.includes('youtube.com/embed') ? (
                <iframe
                  src={videoUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg w-full h-full"
                ></iframe>
              ) : imageInfo ? (
                <Image
                  src={imageInfo.imageUrl}
                  alt={imageInfo.description}
                  width={400}
                  height={225}
                  className="rounded-lg object-cover w-full h-full"
                />
              ) : null}
            </div>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {description}
            </p>
            {dbField && (
              <div className="mb-6 flex gap-2 max-w-md mx-auto">
                <LinkIcon className="h-10 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="Pega el enlace de tu post aquí..."
                  value={url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  disabled={isCompleted}
                />
              </div>
            )}
            {isCompleted ? (
              <Button size="lg" disabled>
                <CheckCircle className="mr-2" />
                Reto Completado
              </Button>
            ) : (
              <Button onClick={handleSaveAndComplete} size="lg">
                <CheckCircle className="mr-2" />
                Guardar y Completar
              </Button>
            )}

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
}
