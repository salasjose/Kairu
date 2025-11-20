
"use client";

import Image from "next/image";
import React from "react";

interface ArtDirectedBackgroundProps {
  desktopSrc: string;
  tabletSrc: string;
  mobileSrc: string;
  children?: React.ReactNode;
}

export default function ArtDirectedBackground({
  desktopSrc,
  tabletSrc,
  mobileSrc,
  children,
}: ArtDirectedBackgroundProps) {
  return (
    <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Capa de imagen de fondo responsiva */}
      <div className="absolute inset-0 -z-10">
        <picture>
          {/* Desktop >= 1025px */}
          <source media="(min-width: 1025px)" srcSet={desktopSrc} />
          {/* Tablet >= 650px */}
          <source media="(min-width: 650px)" srcSet={tabletSrc} />
          {/* Móvil (fallback) */}
          <img
            src={mobileSrc}
            alt="Fondo de la estación"
            className="absolute inset-0 h-full w-full object-cover"
            sizes="100vw"
            decoding="async"
            loading="eager"
          />
        </picture>
      </div>

      {/* Contenido del app sobre el fondo */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full">
        {children}
      </div>
    </div>
  );
}
