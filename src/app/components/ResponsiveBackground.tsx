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
 * A responsive background component that covers the entire screen.
 * It uses the <picture> element to serve the most appropriate image based on screen size,
 * and next/image with object-fit: cover to ensure it always fills the viewport without distortion.
 */
export default function ResponsiveBackground({
  desktopSrc,
  tabletSrc,
  mobileSrc,
  children,
}: ResponsiveBackgroundProps) {
  return (
    <div className="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* Background Image Layer */}
      <div className="absolute inset-0 z-0">
        <picture className="pointer-events-none select-none block h-full w-full">
          {/* Desktop >= 1024px */}
          <source media="(min-width: 1024px)" srcSet={desktopSrc} />
          {/* Tablet >= 650px */}
          <source media="(min-width: 650px)" srcSet={tabletSrc} />
          {/* Mobile (fallback) */}
          <Image
            src={mobileSrc}
            alt="Fondo de la estación"
            fill
            className="object-cover" // This is the key change: ensure it covers always.
            sizes="100vw"
            priority
          />
        </picture>
      </div>

      {/* Optional overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/20 z-10" />

      {/* Content Layer */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center w-full h-full p-4">
        {children}
      </div>
    </div>
  );
}
