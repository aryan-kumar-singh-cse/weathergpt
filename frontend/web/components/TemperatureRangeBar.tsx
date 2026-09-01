"use client";

import React from "react";

type Props = {
  minTemp: number;
  maxTemp: number;
  globalMin?: number;
  globalMax?: number;
  currentTemp?: number;
};

export default function TemperatureRangeBar({
  minTemp,
  maxTemp,
  globalMin = 20,
  globalMax = 40,
  currentTemp,
}: Props) {
  const span = Math.max(1, globalMax - globalMin);
  const leftPercent = Math.max(0, Math.min(100, ((minTemp - globalMin) / span) * 100));
  const widthPercent = Math.max(15, Math.min(100 - leftPercent, ((maxTemp - minTemp) / span) * 100));

  return (
    <div className="flex items-center gap-2 w-full font-mono text-xs">
      <span className="w-10 text-right text-gray-300 text-[11px] font-semibold shrink-0">
        {minTemp.toFixed(1)}°
      </span>

      {/* Range Bar Track */}
      <div className="relative flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="absolute h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 shadow-sm"
          style={{
            left: `${leftPercent}%`,
            width: `${widthPercent}%`,
          }}
        />
        {currentTemp !== undefined && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-black shadow"
            style={{
              left: `${Math.max(0, Math.min(95, ((currentTemp - globalMin) / span) * 100))}%`,
            }}
          />
        )}
      </div>

      <span className="w-10 text-left text-white text-[11px] font-bold shrink-0">
        {maxTemp.toFixed(1)}°
      </span>
    </div>
  );
}
