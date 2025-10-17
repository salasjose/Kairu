"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { type Station } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Lock, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StationNodeProps {
  station: Station;
  isUnlocked: boolean;
}

export default function StationNode({ station, isUnlocked }: StationNodeProps) {
  const Icon = station.icon;

  const stationIcon = (
     <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full border-4 transition-all duration-300",
          isUnlocked
            ? "border-primary bg-primary/10 text-primary"
            : "border-muted bg-secondary text-muted-foreground"
        )}
      >
        {isUnlocked ? <Icon className="h-8 w-8" /> : <Lock className="h-8 w-8" />}
      </div>
  );

  const content = (
    <div className="flex flex-col items-center gap-2">
      {stationIcon}
      <span
        className={cn(
          "text-center font-bold font-headline text-sm hidden md:inline", // Hide on mobile, show on md and up
          isUnlocked ? "text-primary" : "text-muted-foreground"
        )}
      >
        {station.id}. {station.title}
      </span>
    </div>
  );

  const Wrapper = isUnlocked ? Link : 'div';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Wrapper href={`/station/${station.id}`} className={cn(
            "relative transform transition-transform duration-300",
            isUnlocked && "hover:scale-110"
          )}>
            {isUnlocked && (
                <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-yellow-500 animate-pulse" />
            )}
            {/* On mobile, only show the icon. On desktop, show the full content with text */}
            <div className="md:hidden">
              {stationIcon}
            </div>
            <div className="hidden md:block">
              {content}
            </div>
          </Wrapper>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-bold md:hidden">{station.id}. {station.title}</p>
          <p>{isUnlocked ? station.description : "Completa las estaciones anteriores para desbloquear."}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
