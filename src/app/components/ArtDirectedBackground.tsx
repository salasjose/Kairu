"use client";

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
    <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Capa de imagen de fondo responsiva */}
      <div className="absolute inset-0 -z-10">
        {/* Desktop */}
        <div
          className="hidden lg:block w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${desktopSrc})` }}
        />
        {/* Tablet */}
        <div
          className="hidden md:block lg:hidden w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${tabletSrc})` }}
        />
        {/* Mobile */}
        <div
          className="block md:hidden w-full h-full bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${mobileSrc})` }}
        />
      </div>

      {/* Contenido del app sobre el fondo */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full h-full">
        {children}
      </div>
    </div>
  );
}
