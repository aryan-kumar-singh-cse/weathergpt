"use client";

import React from "react";
import { CloudRain, Sparkles } from "lucide-react";

type Props = {
  city: string;
  temp: number;
  condition: string;
  rainChance?: number;
  groundingSource?: string;
};

export default function InfoStrip({
  city,
  temp,
  condition,
  rainChance,
  groundingSource = "Open-Meteo",
}: Props) {
  return (
    <div
      className="absolute top-28 md:top-24 left-1/2 -translate-x-1/2 z-20
                 w-[92%] max-w-2xl rounded-full
                 bg-white/10 backdrop-blur-xl border border-white/20
                 px-6 md:px-8 py-3.5 flex items-center justify-center gap-3 md:gap-5
                 text-white font-mono shadow-2xl animate-fade-in transition-all"
    >
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-sm md:text-base font-bold tracking-wide text-white">
          {city}
        </span>
      </div>

      <span className="text-white/30 select-none">|</span>

      <span className="text-sm md:text-base font-semibold text-white/95">
        {Math.round(temp)}°C
      </span>

      <span className="text-white/30 select-none">|</span>

      <span className="text-xs md:text-sm text-white/90 truncate max-w-[140px] capitalize">
        {condition}
      </span>

      {rainChance !== undefined && (
        <>
          <span className="text-white/30 select-none">|</span>
          <div className="flex items-center gap-1.5 text-xs md:text-sm text-cyan-300 font-semibold">
            <CloudRain className="w-3.5 h-3.5" />
            <span>{rainChance}% rain</span>
          </div>
        </>
      )}
    </div>
  );
}
