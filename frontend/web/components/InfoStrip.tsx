"use client";

import React from "react";
import { CloudRain, MapPin } from "lucide-react";
import { SupportedLanguage, TRANSLATIONS, translateCondition } from "@/lib/translations";

type Props = {
  city: string;
  temp: number;
  condition: string;
  rainChance?: number;
  lang?: SupportedLanguage;
  onOpenMap?: () => void;
};

export default function InfoStrip({
  city,
  temp,
  condition,
  rainChance,
  lang = "en",
  onOpenMap,
}: Props) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const translatedCondition = translateCondition(condition, lang);

  return (
    <div
      className="absolute top-28 md:top-24 left-1/2 -translate-x-1/2 z-20
                 w-[92%] max-w-2xl rounded-full
                 bg-black/80 backdrop-blur-2xl border border-yellow-400/30
                 px-6 md:px-8 py-3 flex items-center justify-center gap-3 md:gap-5
                 text-white font-mono shadow-2xl shadow-black/80 animate-fade-in transition-all"
    >
      <div className="flex items-center gap-2">
        <MapPin className="w-4 h-4 text-yellow-400 shrink-0" />
        <span className="text-sm md:text-base font-bold tracking-wide text-white">
          {city}
        </span>
      </div>

      <span className="text-yellow-400/30 select-none">|</span>

      <span className="text-sm md:text-base font-semibold text-white">
        {Math.round(temp)}°C
      </span>

      <span className="text-yellow-400/30 select-none">|</span>

      <span className="text-xs md:text-sm text-yellow-300/90 truncate max-w-[160px] capitalize">
        {translatedCondition}
      </span>

      {rainChance !== undefined && (
        <>
          <span className="text-yellow-400/30 select-none">|</span>
          <div className="flex items-center gap-1.5 text-xs md:text-sm text-cyan-400 font-semibold">
            <CloudRain className="w-3.5 h-3.5" />
            <span>{rainChance}% {t.rain}</span>
          </div>
        </>
      )}

      {onOpenMap && (
        <>
          <span className="text-yellow-400/30 select-none">|</span>
          <button
            onClick={onOpenMap}
            title="Open ISRO Satellite & Doppler Radar Overview"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/40 text-xs font-bold text-yellow-300 transition cursor-pointer"
          >
            <span>🗺️ Map</span>
          </button>
        </>
      )}
    </div>
  );
}
