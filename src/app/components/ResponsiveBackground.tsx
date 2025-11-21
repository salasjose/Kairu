"use client";

import React from "react";

interface ResponsiveBackgroundProps {
  desktopSrc: string;
  tabletSrc: string;
  mobileSrc: string;
  children?: React.ReactNode;
}

/** Fondo responsivo por art-direction (desktop / tablet / móvil)
 * - Cubre toda la pantalla.
 * - La imagen se ajusta para ser contenida completamente sin recortarse.
 * - Utiliza un fondo negro para rellenar el espacio sobrante.
 */
export default function ResponsiveBackground({
  desktopSrc,
  tabletSrc,
  mobileSrc,
  children,
}: ResponsiveBackgroundProps) {
  return (
    <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Capa de imagen de fondo responsiva */}
      <div className="absolute inset-0 z-0">
        <picture
          className="pointer-events-none select-none block h-full w-full"
          aria-hidden="true"
          role="presentation"
        >
          {/* PC >= 1025px */}
          <source media="(min-width: 1025px)" srcSet={desktopSrc} />
          {/* Tablet >= 650px */}
          <source media="(min-width: 650px)" srcSet={tabletSrc} />
          {/* Móvil (fallback) */}
          <img
            src={mobileSrc}
            alt="Fondo de la estación"
            className="absolute inset-0 h-full w-full object-contain"
            sizes="100vw"
            decoding="async"
            loading="eager"
          />
        </picture>
      </div>

      {/* Contenido del app sobre el fondo */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full p-4">
        {children}
      </div>
    </div>
  );
}
