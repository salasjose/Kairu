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

// --- Social Post Embed Logic ---
type Platform = 'instagram' | 'facebook' | 'x' | 'youtube' | 'other';

function getPlatformFromUrl(url: string): Platform {
  if (!url) return 'other';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com')) return 'facebook';
  if (url.includes('x.com') || url.includes('twitter.com')) return 'x';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  return 'other';
}

function extractInstagramId(url: string): string {
  try {
    const urlObject = new URL(url);
    const pathParts = urlObject.pathname.split('/').filter(Boolean);
    const pIndex = pathParts.indexOf('p');
    if (pIndex !== -1 && pathParts[pIndex + 1]) {
      return pathParts[pIndex + 1];
    }
    return '';
  } catch (e) {
    return '';
  }
}

function SocialPostEmbed({ platform, url }: { platform: Platform; url: string }) {
  if (!url) return null;

  switch (platform) {
    case 'instagram':
      const postId = extractInstagramId(url);
      if (!postId) return <p className="text-destructive">URL de Instagram no válida.</p>;
      return (
        <iframe
          src={`https://www.instagram.com/p/${postId}/embed`}
          className="w-full max-w-[540px] h-[600px] border-none rounded-lg"
          allowFullScreen
        />
      );

    case 'facebook':
      return (
        <iframe
          src={`https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(url)}&show_text=true&width=auto`}
          className="w-full max-w-[500px] h-[680px] border-none overflow-hidden"
          scrolling="no"
          frameBorder={0}
          allow="encrypted-media"
        />
      );

    case 'x':
      return (
        <iframe
          src={`https://twitframe.com/show?url=${encodeURIComponent(url)}`}
          className="w-full max-w-[550px] h-[700px] border-none"
          frameBorder={0}
          scrolling="no"
        />
      );

    default:
      return null;
  }
}

// --- Main Component ---
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

  const imageInfo = PlaceHolderImages.find((p) => p.id === imageId);
  const platform = getPlatformFromUrl(url);

  const getYoutubeEmbedUrl = (videoUrl: string): string | null => {
    if (!videoUrl) return null;
    try {
      const urlObject = new URL(videoUrl);
      if (urlObject.hostname.includes('youtube.com')) {
        const videoId = urlObject.searchParams.get('v');
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      } else if (urlObject.hostname.includes('youtu.be')) {
        const videoId = urlObject.pathname.slice(1);
        if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      }
    } catch (e) {
      return null;
    }
    return null;
  };

  const youtubeEmbedUrl = getYoutubeEmbedUrl(url);
  
  useEffect(() => {
    const fetchUrl = async () => {
      if (!user || !db || !dbField) return;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists() && docSnap.data()[dbField]) {
          const savedUrl = docSnap.data()[dbField];
          setUrl(savedUrl);
        }
      } catch (error) {
        console.error(`Error fetching ${dbField} from Firestore:`, error);
      }
    };
    fetchUrl();
  }, [dbField, user, db]);

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
  
  const renderMedia = () => {
    if (youtubeEmbedUrl) {
      return (
        <iframe
          src={youtubeEmbedUrl}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-lg w-full h-full"
        ></iframe>
      );
    }
    
    if (['instagram', 'facebook', 'x'].includes(platform)) {
        return <SocialPostEmbed platform={platform} url={url} />;
    }

    if (imageInfo) {
      return (
        <Image
          src={imageInfo.imageUrl}
          alt={imageInfo.description}
          width={400}
          height={225}
          className="rounded-lg object-cover w-full h-full"
        />
      );
    }
    return null;
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
            <div className="mx-auto mb-6 w-full max-w-sm h-auto aspect-video bg-background/20 rounded-lg flex items-center justify-center">
              {renderMedia()}
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
                  onChange={(e) => setUrl(e.target.value)}
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
