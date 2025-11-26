
"use client";

import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen w-full overflow-hidden">
        <div className="absolute inset-0 -z-10">
            <Image
                src="/backgrounds/Mapa.png"
                alt="Kairu map background"
                fill
                priority
                sizes="100vw"
                className="object-cover"
            />
            <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative z-10 w-full flex items-center justify-center p-4">
             {children}
        </div>
    </main>
  );
}
