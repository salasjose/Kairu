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
  const StationIcon = station.icon;
  
  const stationButton = (
    <div
      className={cn(
        "relative w-16 h-16 rounded-full transition-all duration-300 transform",
        isUnlocked && "hover:scale-110"
      )}
    >
      {isUnlocked ? (
        <>
          {/* Cilindro base 3D */}
          <div className="absolute inset-x-1 top-2 h-full rounded-full bg-white/90 shadow-[0_8px_0_0_rgba(0,0,0,0.1)]" />
          
          {/* Tapa superior del cilindro */}
          <div
            className={cn(
              "absolute inset-0 rounded-full bg-slate-700 shadow-inner-lg flex items-center justify-center border-2 border-slate-500"
            )}
          >
            <StationIcon className="h-8 w-8 text-white" />
          </div>
        </>
      ) : (
        <>
           {/* Cilindro base 3D bloqueado */}
           <div className="absolute inset-x-1 top-2 h-full rounded-full bg-slate-600/50 shadow-[0_8px_0_0_rgba(0,0,0,0.1)]" />
          
           {/* Tapa superior bloqueada */}
           <div className="absolute inset-0 rounded-full bg-slate-800 shadow-inner-lg flex items-center justify-center border-2 border-slate-600">
             <Lock className="h-7 w-7 text-slate-500" />
           </div>
        </>
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
