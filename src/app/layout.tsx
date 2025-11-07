import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { PrizeCartProvider } from '@/hooks/use-prize-cart.tsx';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';


export const metadata: Metadata = {
  title: 'Kairu',
  description: 'Una aventura interactiva de educación ambiental.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const mapBg = PlaceHolderImages.find(p => p.id === 'map-background');
  return (
    <html lang="es" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:wght@400;700&family=PT+Sans:wght@400;700&family=Kalam:wght@700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background min-h-screen flex flex-col">
        <div 
          className="fixed inset-0 w-full h-full bg-cover bg-center bg-no-repeat -z-10" 
          style={{ backgroundImage: `url(${mapBg?.imageUrl})` }}
        ></div>
        <FirebaseClientProvider>
          <PrizeCartProvider>
            {children}
          </PrizeCartProvider>
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
