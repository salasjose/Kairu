"use client";

import React from "react";
import Image from "next/image";

interface ArtDirectedBackgroundProps {
  desktopSrc: string;
  tabletSrc: string;
  mobileSrc: string;
  children?: React.ReactNode;
}

/**
 * Fondo responsivo por art-direction (desktop / tablet / móvil)
 * - Cubre toda la pantalla
 * - Usa <picture> con next/image para cargar la imagen más adecuada.
 */
export default function ArtDirectedBackground({
  desktopSrc,
  tabletSrc,
  mobileSrc,
  children,
}: ArtDirectedBackgroundProps) {
  return (
    <div className="absolute inset-0 w-full h-full -z-10 min-h-screen">
      <picture
        className="pointer-events-none select-none block h-full w-full"
        aria-hidden="true"
        role="presentation"
      >
        {/* Desktop >= 1025px */}
        <source media="(min-width: 1025px)" srcSet={desktopSrc} />
        {/* Tablet >= 650px */}
        <source media="(min-width: 650px)" srcSet={tabletSrc} />
        {/* Móvil (fallback) */}
        <Image
          src={mobileSrc}
          alt="Fondo de la estación"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </picture>
       {/* Contenido sobre el fondo */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full">
        {children}
      </div>
    </div>
  );
}
