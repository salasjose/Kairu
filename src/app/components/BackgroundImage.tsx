
"use client";

import Image from "next/image";

export default function BackgroundImage({ children }: { children?: React.ReactNode }) {
  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      {/* Fondo responsivo por art-direction */}
      <div className="absolute inset-0 z-0">
        <picture
          className="pointer-events-none select-none block h-full w-full"
          aria-hidden="true"
          role="presentation"
        >
          {/* PC >= 1025px */}
          <source media="(min-width: 1025px)" srcSet="/backgrounds/MapaPc.png" />
          {/* Tablet >= 650px */}
          <source media="(min-width: 650px)" srcSet="/backgrounds/MapaTablet.png" />
          {/* Móvil (fallback) */}
          <img
            src="/backgrounds/MapaTelefono.png"
            alt="Fondo del mapa del juego"
            className="absolute inset-0 h-full w-full object-cover"
            sizes="100vw"
            decoding="async"
            loading="eager"
          />
        </picture>
      </div>

      {/* Capa de oscurecimiento opcional */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Contenido del aplicativo */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
          {children}
      </div>
    </section>
  );
}
