"use client";

import React, { useState } from "react";
import { CloudRain, Sun, Cloud, CloudLightning, CloudSnow } from "lucide-react";

export type ForecastDay = {
  date: number | string;
  day: string;
  condition?: string;
  weatherCode?: number;
  highTemp: number;
  lowTemp?: number;
  rainChance?: number;
};

type Props = {
  days: ForecastDay[];
  outlook30Days?: ForecastDay[];
  onOpenDetailed?: () => void;
};

function renderDayIcon(condition?: string) {
  const condLower = (condition || "").toLowerCase();
  if (condLower.includes("rain") || condLower.includes("shower")) {
    return <CloudRain className="w-5 h-5 text-sky-400" />;
  }
  if (condLower.includes("storm") || condLower.includes("thunder")) {
    return <CloudLightning className="w-5 h-5 text-amber-400" />;
  }
  if (condLower.includes("snow")) {
    return <CloudSnow className="w-5 h-5 text-indigo-200" />;
  }
  if (condLower.includes("cloud") || condLower.includes("overcast")) {
    return <Cloud className="w-5 h-5 text-slate-300" />;
  }
  return <Sun className="w-5 h-5 text-amber-400" />;
}

export default function ForecastStrip({ days, outlook30Days = [], onOpenDetailed }: Props) {
  const [view, setView] = useState<"week" | "month">("week");
  const visibleDays =
    view === "week"
      ? days.slice(0, 7)
      : outlook30Days.length > 0
      ? outlook30Days
      : days;

  return (
    <div
      className="absolute top-44 md:top-40 left-1/2 -translate-x-1/2 z-20
                 w-[94%] max-w-4xl rounded-2xl
                 bg-white/10 backdrop-blur-xl border border-white/20
                 p-4 shadow-2xl animate-fade-in transition-all"
    >
      {/* Header controls with 7-Day & 30-Day toggle */}
      <div className="flex items-center justify-between mb-2.5 px-2">
        <span className="text-xs font-mono font-medium text-white/60 uppercase tracking-wider">
          {view === "week" ? "7-Day Meteorological Outlook" : "30-Day Climate Outlook"}
        </span>

        <div className="flex items-center gap-2">
          {onOpenDetailed && (
            <button
              onClick={onOpenDetailed}
              className="text-[11px] font-mono text-white/70 hover:text-white underline underline-offset-2 transition cursor-pointer"
            >
              Detailed View
            </button>
          )}

          <div className="flex items-center gap-1.5 p-0.5 rounded-full bg-white/10 border border-white/15">
            <button
              onClick={() => setView("week")}
              className={`text-[11px] font-mono px-3 py-1 rounded-full transition-all cursor-pointer ${
                view === "week"
                  ? "bg-white/25 text-white font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              7-Day
            </button>
            <button
              onClick={() => setView("month")}
              className={`text-[11px] font-mono px-3 py-1 rounded-full transition-all cursor-pointer ${
                view === "month"
                  ? "bg-white/25 text-white font-bold shadow-sm"
                  : "text-white/60 hover:text-white"
              }`}
            >
              30-Day
            </button>
          </div>
        </div>
      </div>

      {/* Days Horizontal Row */}
      <div className="flex gap-0.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/20">
        {visibleDays.map((d, i) => (
          <div
            key={i}
            className="flex flex-col items-center justify-center flex-1 min-w-[70px] md:min-w-[85px] py-2 px-1.5
                       border-r border-white/10 last:border-r-0 text-white font-mono transition-colors hover:bg-white/5 rounded-lg"
          >
            <span className="text-[10px] text-white/60 uppercase">{d.day || "Day"}</span>
            <span className="text-xs font-semibold text-white/90">{d.date}</span>

            <div className="my-2 p-1 rounded-full bg-white/5 flex items-center justify-center">
              {renderDayIcon(d.condition)}
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-white">
                {Math.round(d.highTemp)}°
              </span>
              {d.lowTemp !== undefined && (
                <span className="text-[10px] text-white/50">
                  {Math.round(d.lowTemp)}°
                </span>
              )}
            </div>

            {d.rainChance !== undefined && (
              <div className="flex items-center gap-0.5 text-[10px] text-cyan-300 mt-1">
                <CloudRain className="w-2.5 h-2.5" />
                <span>{d.rainChance}%</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
