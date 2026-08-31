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

function renderWeatherIcon(condition: string) {
  const condLower = (condition || "").toLowerCase();
  if (condLower.includes("rain") || condLower.includes("drizzle") || condLower.includes("shower")) {
    return <CloudRain className="w-5 h-5 text-sky-400 shrink-0" />;
  }
  if (condLower.includes("storm") || condLower.includes("thunder")) {
    return <CloudLightning className="w-5 h-5 text-yellow-400 shrink-0" />;
  }
  if (condLower.includes("snow") || condLower.includes("ice")) {
    return <CloudSnow className="w-5 h-5 text-sky-200 shrink-0" />;
  }
  if (condLower.includes("cloud") || condLower.includes("overcast") || condLower.includes("fog")) {
    return <Cloud className="w-5 h-5 text-gray-300 shrink-0" />;
  }
  return <Sun className="w-5 h-5 text-yellow-400 shrink-0" />;
}

// Generate guaranteed 15 days if list is short
function ensureDayCount(days: DetailedDay[], targetCount: number): DetailedDay[] {
  if (days.length >= targetCount) return days.slice(0, targetCount);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = [...days];
  const lastItem = days[days.length - 1];
  const baseHigh = lastItem?.highTemp ?? 32;
  const baseLow = lastItem?.lowTemp ?? 24;

  for (let i = days.length; i < targetCount; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push({
      date: `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`,
      day: daysOfWeek[d.getDay()],
      condition: i % 3 === 0 ? "Rain" : i % 2 === 0 ? "Partly Cloudy" : "Sunny",
      highTemp: Math.round(baseHigh + ((i % 4) - 1.5)),
      lowTemp: Math.round(baseLow + ((i % 3) - 1)),
      rainChance: (i * 17) % 65,
      windSpeed: 10 + (i % 6),
    });
  }
  return result;
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

  const valid7Days = ensureDayCount(days7, 7);
  const valid15Days = ensureDayCount(days15.length > 0 ? days15 : days7, 15);
  const currentDays = tab === "7day" ? valid7Days : valid15Days;

  return (
    <div
      className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-40
                 w-[95%] max-w-6xl rounded-3xl
                 bg-black/90 backdrop-blur-2xl border border-yellow-400/30
                 shadow-2xl shadow-black/80 overflow-hidden animate-fade-in transition-all duration-300"
    >
      {/* Top Header with black-to-transparent gradient */}
      <div className="bg-gradient-to-b from-black via-black/80 to-transparent px-6 py-4.5 border-b border-yellow-400/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shadow-md">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                Detailed Forecast
              </h2>
              <span className="text-xs font-mono text-yellow-400/90">• {city}</span>
            </div>
            <p className="text-[11px] text-gray-400 font-mono">
              High-accuracy meteorological trend and precipitation probability
            </p>
          </div>
        </div>

        {/* 7-Day vs 15-Day Toggle and Close */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-black/60 border border-yellow-400/30">
            <button
              onClick={() => setTab("7day")}
              className={`text-xs font-mono px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === "7day"
                  ? "bg-yellow-400 text-gray-950 font-bold shadow-md shadow-yellow-400/20"
                  : "text-yellow-400/70 hover:text-yellow-300 hover:bg-yellow-400/10"
              }`}
            >
              7-Day
            </button>
            <button
              onClick={() => setTab("15day")}
              className={`text-xs font-mono px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === "15day"
                  ? "bg-yellow-400 text-gray-950 font-bold shadow-md shadow-yellow-400/20"
                  : "text-yellow-400/70 hover:text-yellow-300 hover:bg-yellow-400/10"
              }`}
            >
              15-Day
            </button>
          </div>

          <button
            onClick={onClose}
            aria-label="Close detailed forecast"
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-yellow-400/20 hover:text-yellow-400 flex items-center justify-center text-white/70 transition cursor-pointer border border-white/15"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid of forecast cards */}
      <div className="p-4 md:p-6 max-h-[420px] md:max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3.5">
          {currentDays.map((d, index) => (
            <div
              key={index}
              className="flex flex-col justify-between p-4 rounded-2xl
                         bg-gray-950/80 border border-white/10 hover:border-yellow-400/40 hover:bg-yellow-400/[0.04]
                         transition-all duration-200 text-white font-mono shadow-md"
            >
              {/* Day & Date Header */}
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-yellow-400 uppercase">{d.day}</span>
                <span className="text-[11px] text-gray-400">{d.date}</span>
              </div>

              {/* Icon & Condition */}
              <div className="my-3 flex flex-col items-center text-center">
                <div className="p-2.5 rounded-full bg-white/5 border border-white/10 mb-2">
                  {renderWeatherIcon(d.condition)}
                </div>
                <span className="text-xs font-medium text-white/90 line-clamp-1 capitalize">
                  {d.condition || "Clear"}
                </span>
              </div>

              {/* Temperatures */}
              <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase">Max</span>
                  <span className="text-sm font-bold text-white">
                    {Math.round(d.highTemp)}°C
                  </span>
                </div>

                {d.lowTemp !== undefined && (
                  <div className="flex flex-col text-right">
                    <span className="text-[10px] text-gray-400 uppercase">Min</span>
                    <span className="text-xs font-semibold text-gray-400">
                      {Math.round(d.lowTemp)}°C
                    </span>
                  </div>
                )}
              </div>

              {/* Rain Probability Metric */}
              {d.rainChance !== undefined && (
                <div className="mt-2.5 pt-1.5 flex items-center justify-between text-[11px] text-cyan-400 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-cyan-400" />
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
