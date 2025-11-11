"use client";

import React from "react";

/** Fondo responsivo por art-direction (desktop / tablet / móvil)
 * - Cubre toda la pantalla (100dvh)
 * - El <picture> y el <img> son absolutos para asegurar overlay perfecto
 * - Usa sizes para que el navegador elija el asset correcto
 */
export default function ResponsiveBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full min-h-[100dvh] flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Capa de imagen de fondo responsiva */}
      <picture
        className="pointer-events-none select-none absolute inset-0 z-0 block"
        aria-hidden="true"
        role="presentation"
      >
        {/* Desktop >= 1280px */}
        <source media="(min-width: 1280px)" srcSet="/backgrounds/Rio_1366x_768.png" />
        {/* Tablet >= 768px */}
        <source media="(min-width: 768px)" srcSet="/backgrounds/Rio_1024x768.png" />
        {/* Móvil (fallback) */}
        <img
          src="/backgrounds/Rio360x649.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          sizes="(min-width:1280px) 100vw, (min-width:768px) 100vw, 100vw"
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
