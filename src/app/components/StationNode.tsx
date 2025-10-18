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
    <div
      className={cn(
        "relative w-12 h-14 transition-transform duration-300 transform",
        isUnlocked ? "hover:scale-110" : "cursor-not-allowed"
      )}
    >
      {/* 3D Base Effect */}
      <div className="absolute top-2 left-0 w-full h-12 rounded-full bg-slate-400 shadow-[0_6px_0_0_#94a3b8,0_10px_10px_0_rgba(0,0,0,0.3)]"></div>

      {/* Top part of the button */}
      <div
        className={cn(
          "absolute top-0 left-0 w-full h-12 rounded-full flex items-center justify-center border-2",
          isUnlocked
            ? "bg-slate-800 border-slate-600"
            : "bg-slate-600 border-slate-500"
        )}
      >
        {isUnlocked ? (
          <Icon className="h-7 w-7 text-white" />
        ) : (
          <Lock className="h-6 w-6 text-white/80" />
        )}
      </div>
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