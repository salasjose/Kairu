"use client";

import Image from "next/image";

export default function BackgroundImage({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Imagen de fondo responsiva */}
      <Image
        src="/backgrounds/Mapa.png"
        alt="Fondo del aplicativo"
        fill
        priority
        className="object-contain object-center"
        sizes="(max-width: 640px) 100vw, 
               (max-width: 1024px) 100vw, 
               100vw"
      />

      {/* Capa de oscurecimiento opcional */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Contenido del aplicativo */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          {children}
      </div>
    </section>
  );
}
