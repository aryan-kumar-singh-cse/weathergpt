"use client";

import React, { useState } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Wind,
  Droplets,
  Calendar,
  X,
  ChevronRight,
} from "lucide-react";

export type DetailedDay = {
  date: number | string;
  day: string;
  condition: string;
  weatherCode?: number;
  highTemp: number;
  lowTemp?: number;
  rainChance?: number;
  humidity?: number;
  windSpeed?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  days7: DetailedDay[];
  days15: DetailedDay[];
};

function renderWeatherIcon(condition: string, code?: number) {
  const condLower = (condition || "").toLowerCase();
  if (condLower.includes("rain") || condLower.includes("drizzle") || condLower.includes("shower")) {
    return <CloudRain className="w-5 h-5 text-sky-400 shrink-0" />;
  }
  if (condLower.includes("storm") || condLower.includes("thunder")) {
    return <CloudLightning className="w-5 h-5 text-amber-400 shrink-0" />;
  }
  if (condLower.includes("snow") || condLower.includes("ice")) {
    return <CloudSnow className="w-5 h-5 text-indigo-200 shrink-0" />;
  }
  if (condLower.includes("cloud") || condLower.includes("overcast") || condLower.includes("fog")) {
    return <Cloud className="w-5 h-5 text-slate-300 shrink-0" />;
  }
  return <Sun className="w-5 h-5 text-amber-400 shrink-0" />;
}

export default function DetailedForecastPanel({
  isOpen,
  onClose,
  city,
  days7,
  days15,
}: Props) {
  const [tab, setTab] = useState<"7day" | "15day">("7day");

  if (!isOpen) return null;

  const currentDays = tab === "7day" ? days7.slice(0, 7) : (days15.length > 0 ? days15.slice(0, 15) : days7);

  return (
    <div
      className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-30
                 w-[94%] max-w-5xl rounded-3xl
                 bg-gray-950/85 backdrop-blur-2xl border border-white/20
                 shadow-2xl overflow-hidden animate-fade-in transition-all duration-300"
    >
      {/* Top Header with black-to-transparent gradient */}
      <div className="bg-gradient-to-b from-black/90 via-black/50 to-transparent px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
            <Calendar className="w-4 h-4 text-white/90" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold text-white tracking-tight">
                Detailed Forecast
              </h2>
              <span className="text-xs font-mono text-white/50">• {city}</span>
            </div>
            <p className="text-[11px] text-white/60 font-mono">
              Meteorological trend & precipitation probability outlook
            </p>
          </div>
        </div>

        {/* 7-Day vs 15-Day Toggle and Close */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-0.5 rounded-xl bg-white/10 border border-white/15">
            <button
              onClick={() => setTab("7day")}
              className={`text-xs font-mono px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === "7day"
                  ? "bg-white/20 text-white font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              7-Day View
            </button>
            <button
              onClick={() => setTab("15day")}
              className={`text-xs font-mono px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === "15day"
                  ? "bg-white/20 text-white font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              15-Day View
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Close detailed forecast"
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of forecast cards */}
      <div className="p-4 md:p-6 max-h-[380px] md:max-h-[460px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
          {currentDays.map((d, index) => (
            <div
              key={index}
              className="flex flex-col justify-between p-3.5 rounded-2xl
                         bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20
                         transition-all duration-200 text-white font-mono"
            >
              {/* Day & Date Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white/90 uppercase">{d.day}</span>
                <span className="text-[11px] text-white/50">{d.date}</span>
              </div>

              {/* Icon & Condition */}
              <div className="my-3 flex flex-col items-center text-center">
                <div className="p-2.5 rounded-full bg-white/5 mb-1.5">
                  {renderWeatherIcon(d.condition, d.weatherCode)}
                </div>
                <span className="text-xs font-medium text-white/80 line-clamp-1 capitalize">
                  {d.condition || "Clear"}
                </span>
              </div>

              {/* Temperatures */}
              <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/50 uppercase">Max</span>
                  <span className="text-sm font-bold text-white">
                    {Math.round(d.highTemp)}°C
                  </span>
                </div>

                {d.lowTemp !== undefined && (
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-white/50 uppercase">Min</span>
                    <span className="text-xs font-semibold text-white/60">
                      {Math.round(d.lowTemp)}°C
                    </span>
                  </div>
                )}
              </div>

              {/* Rain Probability Metric */}
              {d.rainChance !== undefined && (
                <div className="mt-2 pt-1.5 flex items-center justify-between text-[11px] text-cyan-300">
                  <span className="flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-cyan-300" />
                    <span>Rain</span>
                  </span>
                  <span className="font-bold">{d.rainChance}%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
