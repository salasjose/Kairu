"use client";

import React from "react";
import Image from "next/image";

interface ResponsiveBackgroundProps {
  desktopSrc: string;
  tabletSrc: string;
  mobileSrc: string;
  children?: React.ReactNode;
}

/**
 * Fondo responsivo por art-direction que cubre toda la pantalla.
 * - En PC (lg), usa object-cover para llenar el contenedor, recortando si es necesario.
 * - En tablet y móvil, usa object-contain para asegurar que toda la imagen sea visible.
 */
export default function ResponsiveBackground({
  desktopSrc,
  tabletSrc,
  mobileSrc,
  children,
}: ResponsiveBackgroundProps) {
  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Capa de imagen de fondo responsiva */}
      <div className="absolute inset-0 z-0">
        <picture
          className="pointer-events-none select-none block h-full w-full"
          aria-hidden="true"
          role="presentation"
        >
          {/* PC >= 1024px (cubre el contenedor) */}
          <source media="(min-width: 1024px)" srcSet={desktopSrc} />
          {/* Tablet >= 650px (contenida) */}
          <source media="(min-width: 650px)" srcSet={tabletSrc} />
          {/* Móvil (fallback, contenida) */}
          <Image
            src={mobileSrc}
            alt="Fondo de la estación"
            fill
            className="object-contain md:object-contain lg:object-cover"
            sizes="100vw"
            decoding="async"
            loading="eager"
            priority
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
