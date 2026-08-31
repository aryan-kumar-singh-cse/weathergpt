"use client";

import React from "react";
import { Wind, Droplets, MapPin, Gauge, Navigation } from "lucide-react";

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
      className="absolute top-24 left-6 md:left-10 z-20 w-72 md:w-80 rounded-3xl
                 bg-black/80 backdrop-blur-2xl border border-yellow-400/30
                 p-5 md:p-6 text-white shadow-2xl shadow-black/90 transition-all duration-300
                 hover:border-yellow-400/50 animate-fade-in"
    >
      {/* City & Live Location Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <MapPin className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-sm font-semibold text-white font-mono tracking-wide truncate">
            {city || "Live Location"}
          </p>
        </div>

        {onRefreshGPS && (
          <button
            onClick={onRefreshGPS}
            disabled={isLocating}
            title="Update live GPS location"
            className="px-2.5 py-1 rounded-xl bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/40 text-xs font-mono text-yellow-300 hover:text-yellow-200 transition cursor-pointer flex items-center gap-1"
          >
            <Navigation className="w-3 h-3 text-yellow-400" />
            <span>{isLocating ? "Locating..." : "GPS"}</span>
          </button>
        )}
      </div>

      {/* Main Temperature & Condition */}
      <div className="mt-3 flex items-baseline justify-between">
        <p className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
          {Math.round(temp)}°<span className="text-2xl font-normal text-yellow-400">C</span>
        </p>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400">
          Live
        </span>
      </div>

      <p className="text-base font-medium text-gray-200 mt-1 capitalize">
        {condition || "Clear Sky"}
      </p>

      {feelsLike !== undefined && (
        <p className="text-xs text-gray-400 mt-0.5">
          Feels like <span className="font-semibold text-yellow-400/90">{Math.round(feelsLike)}°C</span>
        </p>
      )}

      {/* Micro Metrics Strip */}
      <div className="mt-4 pt-3 border-t border-yellow-400/15 grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="flex flex-col items-center">
          <Droplets className="w-3.5 h-3.5 text-sky-400 mb-1" />
          <span className="text-[10px] text-gray-400">Humidity</span>
          <span className="font-semibold text-white">{humidity ?? 65}%</span>
        </div>

        <div className="flex flex-col items-center">
          <Wind className="w-3.5 h-3.5 text-emerald-400 mb-1" />
          <span className="text-[10px] text-gray-400">Wind</span>
          <span className="font-semibold text-white">{windSpeed ?? 8} km/h</span>
        </div>

        <div className="flex flex-col items-center">
          <Gauge className="w-3.5 h-3.5 text-yellow-400 mb-1" />
          <span className="text-[10px] text-gray-400">Pressure</span>
          <span className="font-semibold text-white">{pressure ?? 1012} hPa</span>
        </div>
      </div>
    </div>
  );
}
