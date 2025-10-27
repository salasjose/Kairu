
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Station } from "@/lib/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Lock } from "lucide-react";

interface StationNodeProps {
  station: Station;
  isUnlocked: boolean;
}

export default function StationNode({ station, isUnlocked }: StationNodeProps) {
  const Icon = station.icon;

  const stationButton = (
    <div className="relative w-full h-full transition-transform duration-300 transform hover:scale-110">
      {/* Base del cilindro */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[90%] h-[60%] rounded-[50%] bg-gray-200/50 shadow-inner-lg" />
      
      {/* Tapa superior del cilindro */}
      <div className={cn(
        "absolute top-0 left-0 w-full h-full rounded-full border-2 border-slate-900/50 flex items-center justify-center shadow-lg",
        isUnlocked ? "bg-slate-800" : "bg-slate-900/80"
      )}>
        {isUnlocked ? (
          <Icon className="w-10 h-10 md:w-12 md:h-12 text-white" />
        ) : (
          <Lock className="h-10 w-10 md:w-12 md:h-12 text-white/70" />
        )}
      </div>
    </div>
  );

  const Wrapper = isUnlocked ? Link : "div";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Wrapper href={`/station/${station.id}`} className="relative block w-full h-full cursor-pointer">
            {stationButton}
          </Wrapper>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold">
            {station.id}. {station.title}
          </p>
          <p>
            {isUnlocked
              ? station.description
              : "Completa las estaciones anteriores para desbloquear."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
