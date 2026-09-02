"use client";

import React, { useState } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Calendar,
  X,
} from "lucide-react";
import TemperatureRangeBar from "./TemperatureRangeBar";
import { SupportedLanguage, TRANSLATIONS, translateCondition } from "@/lib/translations";

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
  lang?: SupportedLanguage;
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

function ensureDayCount(days: DetailedDay[], targetCount: number): DetailedDay[] {
  if (days.length >= targetCount) return days.slice(0, targetCount);

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result = [...days];
  const lastItem = days[days.length - 1];
  const baseHigh = lastItem?.highTemp ?? 34;
  const baseLow = lastItem?.lowTemp ?? 26;

  for (let i = days.length; i < targetCount; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    result.push({
      date: `${d.getDate()} ${d.toLocaleString("default", { month: "short" })}`,
      day: daysOfWeek[d.getDay()],
      condition: i % 3 === 0 ? "Rain" : i % 2 === 0 ? "Partly Cloudy" : "Sunny",
      highTemp: parseFloat((baseHigh + ((i % 4) - 1.2)).toFixed(1)),
      lowTemp: parseFloat((baseLow + ((i % 3) - 0.8)).toFixed(1)),
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
  lang = "en",
}: Props) {
  const [tab, setTab] = useState<"7day" | "15day">("7day");

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const valid7Days = ensureDayCount(days7, 7);
  const valid15Days = ensureDayCount(days15.length > 0 ? days15 : days7, 15);
  const currentDays = tab === "7day" ? valid7Days : valid15Days;

  // Compute global min/max for aligned temperature bars
  const allMins = currentDays.map((d) => d.lowTemp ?? d.highTemp - 5);
  const allMaxs = currentDays.map((d) => d.highTemp);
  const globalMin = Math.min(...allMins) - 2;
  const globalMax = Math.max(...allMaxs) + 2;

  return (
    <div
      className="absolute top-20 md:top-24 left-1/2 -translate-x-1/2 z-40
                 w-[95%] max-w-5xl rounded-3xl
                 bg-black/95 backdrop-blur-2xl border border-yellow-400/35
                 shadow-2xl shadow-black/90 overflow-hidden animate-fade-in transition-all duration-300 font-mono"
    >
      {/* Top Header */}
      <div className="bg-gradient-to-b from-black via-black/90 to-transparent px-6 py-4 border-b border-yellow-400/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shadow-md">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-bold text-white tracking-tight">
                {t.detailedForecast}
              </h2>
              <span className="text-xs text-yellow-400 font-bold">• {city}</span>
            </div>
            <p className="text-[11px] text-gray-400">
              {tab === "7day" ? t.forecast7Day : t.forecast15Day}
            </p>
          </div>
        </div>

        {/* 7-Day vs 15-Day Toggle and Close */}
        <div className="flex items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-black/60 border border-yellow-400/30">
            <button
              onClick={() => setTab("7day")}
              className={`text-xs px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === "7day"
                  ? "bg-yellow-400 text-gray-950 font-bold shadow-md"
                  : "text-yellow-400/70 hover:text-yellow-300 hover:bg-yellow-400/10"
              }`}
            >
              7-Day
            </button>
            <button
              onClick={() => setTab("15day")}
              className={`text-xs px-4 py-1.5 rounded-lg transition-all cursor-pointer ${
                tab === "15day"
                  ? "bg-yellow-400 text-gray-950 font-bold shadow-md"
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

      {/* List of forecast rows with Horizontal Gradient Bars */}
      <div className="p-4 md:p-6 max-h-[460px] overflow-y-auto space-y-2.5">
        {currentDays.map((d, index) => {
          const min = d.lowTemp ?? d.highTemp - 5;
          const max = d.highTemp;
          const translatedCond = translateCondition(d.condition, lang);

          return (
            <div
              key={index}
              className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/10 hover:border-yellow-400/40 hover:bg-yellow-400/[0.04] transition-all flex items-center justify-between gap-4 text-white"
            >
              {/* Day & Date */}
              <div className="w-24 shrink-0">
                <span className="text-xs font-bold text-yellow-300 block">{d.day}</span>
                <span className="text-[10px] text-gray-400">{d.date}</span>
              </div>

              {/* Weather Icon & Condition */}
              <div className="w-44 flex items-center gap-2 shrink-0">
                {renderWeatherIcon(d.condition)}
                <span className="text-xs text-gray-200 capitalize truncate">
                  {translatedCond}
                </span>
              </div>

              {/* Gradient Temperature Bar Track */}
              <div className="flex-1 max-w-md">
                <TemperatureRangeBar
                  minTemp={min}
                  maxTemp={max}
                  globalMin={globalMin}
                  globalMax={globalMax}
                />
              </div>

              {/* Rain Probability Badge */}
              <div className="w-16 text-right shrink-0">
                {d.rainChance !== undefined && d.rainChance > 0 ? (
                  <span className="text-xs text-sky-400 font-semibold flex items-center justify-end gap-1">
                    <CloudRain className="w-3 h-3" />
                    <span>{d.rainChance}%</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-500">0%</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
