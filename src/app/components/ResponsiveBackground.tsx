"use client";

import React from "react";

export default function ResponsiveBackground({
  children,
}: { children: React.ReactNode }) {
  return (
    <div className="relative w-full min-h-full flex flex-col items-center justify-center p-4 overflow-hidden">
      {/* Capa de imagen de fondo responsiva */}
      <picture>
        {/* Desktop >= 1280px */}
        <source
          media="(min-width: 1280px)"
          srcSet="/backgrounds/Rio_1366x_768.png"
        />
        {/* Tablet >= 768px */}
        <source
          media="(min-width: 768px)"
          srcSet="/backgrounds/Rio_1024x768.png"
        />
        {/* Móvil (fallback) */}
        <img
          src="/backgrounds/Rio_360x649.png"
          alt="Fondo del aplicativo"
          className="pointer-events-none select-none absolute inset-0 h-full w-full object-cover z-0"
        />
      </picture>

      {/* Contenido del app sobre el fondo */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center w-full">
        {children}
      </div>
    </div>
  );
}
