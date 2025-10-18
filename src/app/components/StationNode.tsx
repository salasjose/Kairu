"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { type Station } from "@/lib/types";
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
  
  const stationButton = (
    <div
      className={cn(
        "relative w-12 h-12 rounded-full transition-all duration-300 transform flex items-center justify-center",
        isUnlocked 
          ? "bg-white shadow-md hover:scale-110 hover:shadow-lg"
          : "bg-gray-400/50 cursor-not-allowed"
      )}
    >
      {isUnlocked ? (
        <span className="sr-only">{station.title}</span>
      ) : (
        <Lock className="h-6 w-6 text-white/70" />
      )}
    </div>
  );

  const Wrapper = isUnlocked ? Link : 'div';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Wrapper href={`/station/${station.id}`} className="relative">
            {stationButton}
          </Wrapper>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold">{station.id}. {station.title}</p>
          <p>{isUnlocked ? station.description : "Completa las estaciones anteriores para desbloquear."}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
