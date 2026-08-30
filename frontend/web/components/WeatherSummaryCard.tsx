"use client";

import React from "react";
import { Wind, Droplets, Compass, MapPin, Gauge } from "lucide-react";

type Props = {
  city: string;
  temp: number;
  condition: string;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  onRefreshGPS?: () => void;
  isLocating?: boolean;
};

export default function WeatherSummaryCard({
  city,
  temp,
  condition,
  feelsLike,
  humidity,
  windSpeed,
  pressure,
  onRefreshGPS,
  isLocating,
}: Props) {
  return (
    <div
      className="absolute top-24 left-6 md:left-10 z-20 w-72 md:w-80 rounded-2xl
                 bg-white/10 backdrop-blur-xl border border-white/20
                 p-5 md:p-6 text-white shadow-2xl transition-all duration-300
                 hover:bg-white/[0.14] animate-fade-in"
    >
      {/* City & Live Location Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <MapPin className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-sm font-semibold text-white/90 font-mono tracking-wide truncate">
            {city || "Live Location"}
          </p>
        </div>

        {onRefreshGPS && (
          <button
            onClick={onRefreshGPS}
            disabled={isLocating}
            title="Update live GPS location"
            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-mono text-white/70 hover:text-white transition cursor-pointer"
          >
            {isLocating ? "..." : "📍 GPS"}
          </button>
        )}
      </div>

      {/* Main Temperature & Condition */}
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-4xl md:text-5xl font-extrabold tracking-tight">
          {Math.round(temp)}°<span className="text-2xl font-normal text-white/70">C</span>
        </p>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-white/90">
          Live
        </span>
      </div>

      <p className="text-base font-medium text-white/90 mt-1 capitalize">
        {condition || "Clear Sky"}
      </p>

      {feelsLike !== undefined && (
        <p className="text-xs text-white/60 mt-0.5">
          Feels like <span className="font-semibold text-white/80">{Math.round(feelsLike)}°C</span>
        </p>
      )}

      {/* Micro Metrics Strip */}
      <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="flex flex-col items-center">
          <Droplets className="w-3.5 h-3.5 text-blue-400 mb-1" />
          <span className="text-[10px] text-white/50">Humidity</span>
          <span className="font-semibold text-white/90">{humidity ?? 65}%</span>
        </div>

        <div className="flex flex-col items-center">
          <Wind className="w-3.5 h-3.5 text-emerald-400 mb-1" />
          <span className="text-[10px] text-white/50">Wind</span>
          <span className="font-semibold text-white/90">{windSpeed ?? 8} km/h</span>
        </div>

        <div className="flex flex-col items-center">
          <Gauge className="w-3.5 h-3.5 text-purple-400 mb-1" />
          <span className="text-[10px] text-white/50">Pressure</span>
          <span className="font-semibold text-white/90">{pressure ?? 1012} hPa</span>
        </div>
      </div>
    </div>
  );
}
