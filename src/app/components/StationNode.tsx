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

  const stationButton = (
    <div
      className={cn(
        "relative w-10 h-10 transition-transform duration-300 transform rounded-full shadow-lg",
        isUnlocked ? "bg-white hover:scale-110" : "bg-gray-400/80 cursor-not-allowed"
      )}
    >
       {isUnlocked ? (
          <span className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Lock className="h-5 w-5 text-white/90" />
          </div>
        )}
    </div>
  );

  const Wrapper = isUnlocked ? Link : "div";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Wrapper href={`/station/${station.id}`} className="relative">
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
