"use client";

import React from "react";

/** Fondo responsivo por art-direction (desktop / tablet / móvil)
 * - Cubre toda la pantalla (100dvh)
 * - El <picture> y el <img> son absolutos para asegurar overlay perfecto
 * - Usa sizes para que el navegador elija el asset correcto
 */
export default function ResponsiveBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Capa de imagen de fondo responsiva */}
      <picture
        className="pointer-events-none select-none absolute inset-0 z-0 block"
        aria-hidden="true"
        role="presentation"
      >
        {/* Desktop >= 1025px */}
        <source media="(min-width: 1025px)" srcSet="/backgrounds/Bionexus1366_X_768.png" />
        {/* Tablet >= 650px */}
        <source media="(min-width: 650px)" srcSet="/backgrounds/Bionexus1024_X_768.png" />
        {/* Móvil (fallback) */}
        <img
          src="/backgrounds/Bionexus1075_X_1944.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          sizes="100vw"
          decoding="async"
          loading="eager"
        />
      </picture>

      {/* Contenido del app sobre el fondo */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
        {children}
      </div>
    </div>
  );
}
