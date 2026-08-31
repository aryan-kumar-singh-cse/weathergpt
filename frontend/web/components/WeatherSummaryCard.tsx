"use client";

import React, { useState } from "react";
import {
  Wind,
  Droplets,
  MapPin,
  Gauge,
  Navigation,
  Zap,
  Sprout,
  Satellite,
  ShieldAlert,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

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
  onOpenLightning?: () => void;
  onOpenCropGDD?: () => void;
  onOpenSatellite?: () => void;
  onOpenDisaster?: () => void;
  onOpenSms?: () => void;
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
  onOpenLightning,
  onOpenCropGDD,
  onOpenSatellite,
  onOpenDisaster,
  onOpenSms,
}: Props) {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div
      className={`absolute top-20 left-4 md:left-8 z-20 transition-all duration-300 ${
        isMinimized ? "w-48" : "w-72 md:w-80"
      } rounded-3xl bg-black/85 backdrop-blur-2xl border border-yellow-400/35 p-4 md:p-5 text-white shadow-2xl shadow-black/90 hover:border-yellow-400/50 animate-fade-in`}
    >
      {/* Top Row: Location, GPS & Minimize Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <MapPin className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-xs md:text-sm font-semibold text-white font-mono tracking-wide truncate">
            {city || "Live Location"}
          </p>
        </div>

        <div className="flex items-center gap-1">
          {onRefreshGPS && !isMinimized && (
            <button
              onClick={onRefreshGPS}
              disabled={isLocating}
              title="Update live GPS location"
              className="px-2 py-0.5 rounded-lg bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/40 text-[10px] font-mono text-yellow-300 hover:text-yellow-200 transition cursor-pointer flex items-center gap-1"
            >
              <Navigation className="w-2.5 h-2.5 text-yellow-400" />
              <span>{isLocating ? "..." : "GPS"}</span>
            </button>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand card" : "Minimize card"}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Temperature & Condition */}
      <div className="mt-2 flex items-baseline justify-between">
        <p className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
          {Math.round(temp)}°<span className="text-xl font-normal text-yellow-400">C</span>
        </p>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          Live
        </span>
      </div>

      <p className="text-xs md:text-sm font-medium text-gray-200 mt-0.5 capitalize truncate">
        {condition || "Clear Sky"}
      </p>

      {/* Expanded Metrics & Quick Sensor Triggers */}
      {!isMinimized && (
        <>
          {feelsLike !== undefined && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              Feels like <span className="font-semibold text-yellow-400/90">{Math.round(feelsLike)}°C</span>
            </p>
          )}

          {/* Micro Metrics Strip */}
          <div className="mt-3 pt-2.5 border-t border-yellow-400/15 grid grid-cols-3 gap-1 text-center text-xs font-mono">
            <div className="flex flex-col items-center">
              <Droplets className="w-3.5 h-3.5 text-sky-400 mb-0.5" />
              <span className="text-[9px] text-gray-400">Humidity</span>
              <span className="font-semibold text-white text-[11px]">{humidity ?? 65}%</span>
            </div>

            <div className="flex flex-col items-center">
              <Wind className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
              <span className="text-[9px] text-gray-400">Wind</span>
              <span className="font-semibold text-white text-[11px]">{windSpeed ?? 8} km/h</span>
            </div>

            <div className="flex flex-col items-center">
              <Gauge className="w-3.5 h-3.5 text-yellow-400 mb-0.5" />
              <span className="text-[9px] text-gray-400">Pressure</span>
              <span className="font-semibold text-white text-[11px]">{pressure ?? 1012} hPa</span>
            </div>
          </div>

          {/* Quick High-Impact Tools Action Bar */}
          <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-5 gap-1 text-center font-mono">
            <button
              onClick={onOpenLightning}
              title="DAMINI Lightning Radar"
              className="p-1.5 rounded-xl bg-gray-950/80 border border-white/10 hover:border-yellow-400/50 text-yellow-400 flex flex-col items-center transition cursor-pointer hover:scale-105"
            >
              <Zap className="w-3.5 h-3.5 fill-yellow-400/30 mb-0.5" />
              <span className="text-[8px] text-gray-300">Strike</span>
            </button>

            <button
              onClick={onOpenCropGDD}
              title="Crop Phenology & GDD Engine"
              className="p-1.5 rounded-xl bg-gray-950/80 border border-white/10 hover:border-emerald-400/50 text-emerald-400 flex flex-col items-center transition cursor-pointer hover:scale-105"
            >
              <Sprout className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[8px] text-gray-300">Crops</span>
            </button>

            <button
              onClick={onOpenSatellite}
              title="ISRO INSAT-3DR Satellite Feed"
              className="p-1.5 rounded-xl bg-gray-950/80 border border-white/10 hover:border-cyan-400/50 text-cyan-400 flex flex-col items-center transition cursor-pointer hover:scale-105"
            >
              <Satellite className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[8px] text-gray-300">ISRO</span>
            </button>

            <button
              onClick={onOpenDisaster}
              title="NDMA Multi-Hazard SOS Center"
              className="p-1.5 rounded-xl bg-gray-950/80 border border-white/10 hover:border-red-400/50 text-red-400 flex flex-col items-center transition cursor-pointer hover:scale-105"
            >
              <ShieldAlert className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[8px] text-gray-300">NDMA</span>
            </button>

            <button
              onClick={onOpenSms}
              title="Rural 2G SMS Broadcast Simulator"
              className="p-1.5 rounded-xl bg-gray-950/80 border border-white/10 hover:border-yellow-400/50 text-yellow-300 flex flex-col items-center transition cursor-pointer hover:scale-105"
            >
              <Smartphone className="w-3.5 h-3.5 mb-0.5" />
              <span className="text-[8px] text-gray-300">SMS</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
