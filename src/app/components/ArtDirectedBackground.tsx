"use client";

import React from "react";

interface ArtDirectedBackgroundProps {
  desktopSrc: string;
  tabletSrc: string;
  mobileSrc: string;
}

/** 
 * Fondo responsivo por art-direction (desktop / tablet / móvil)
 * - Cubre toda la pantalla
 * - Usa <picture> para cargar la imagen más adecuada según el breakpoint.
 */
export default function ArtDirectedBackground({ 
    desktopSrc, 
    tabletSrc, 
    mobileSrc 
}: ArtDirectedBackgroundProps) {
  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      <picture
        className="pointer-events-none select-none absolute inset-0 z-0 block"
        aria-hidden="true"
        role="presentation"
      >
        {/* Desktop >= 1025px */}
        <source media="(min-width: 1025px)" srcSet={desktopSrc} />
        {/* Tablet >= 650px */}
        <source media="(min-width: 650px)" srcSet={tabletSrc} />
        {/* Móvil (fallback) */}
        <img
          src={mobileSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          sizes="100vw"
          decoding="async"
          loading="eager"
        />
      </picture>
    </div>
  );
}
