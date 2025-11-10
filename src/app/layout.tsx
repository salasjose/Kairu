import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { Providers } from './providers';
import { Alegreya, PT_Sans, Kalam } from 'next/font/google';

const alegreya = Alegreya({
  subsets: ['latin'],
  variable: '--font-alegreya',
  display: 'swap',
});

const ptSans = PT_Sans({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-pt-sans',
  display: 'swap',
});

const kalam = Kalam({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-kalam',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Kairu',
  description: 'Una aventura interactiva de educación ambiental.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${alegreya.variable} ${ptSans.variable} ${kalam.variable} h-full`}>
      <body className="font-body antialiased bg-background min-h-screen flex flex-col">
        <Providers>
            {children}
        </Providers>
        <Toaster />
      </body>
    </html>
  );
}
