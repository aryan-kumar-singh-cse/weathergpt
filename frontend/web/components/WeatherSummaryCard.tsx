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
  Sun,
  Moon,
  Eye,
  Activity,
  Sparkles,
} from "lucide-react";
import { SupportedLanguage, TRANSLATIONS, translateCondition } from "@/lib/translations";

type Props = {
  city: string;
  temp: number;
  condition: string;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  uvIndex?: number;
  aqi?: number;
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonPhase?: string;
  visibility?: number;
  dewPoint?: number;
  lang?: SupportedLanguage;
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
  uvIndex = 5.4,
  aqi = 78,
  sunrise = "05:58 AM",
  sunset = "06:38 PM",
  moonrise = "07:15 PM",
  moonPhase = "Waxing Gibbous",
  visibility = 10,
  dewPoint = 21,
  lang = "en",
  onRefreshGPS,
  isLocating,
  onOpenLightning,
  onOpenCropGDD,
  onOpenSatellite,
  onOpenDisaster,
  onOpenSms,
}: Props) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [showAstro, setShowAstro] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const translatedCondition = translateCondition(condition, lang);

  // Calculate AQI category & color
  const aqiRating = aqi <= 50 ? t.good : aqi <= 100 ? t.moderate : t.unhealthy;
  const aqiColor = aqi <= 50 ? "text-emerald-400" : aqi <= 100 ? "text-yellow-400" : "text-red-400";

  // Calculate UV category & color
  const uvRating = uvIndex <= 2 ? t.good : uvIndex <= 5 ? t.moderate : uvIndex <= 7 ? t.veryHigh : t.extreme;
  const uvColor = uvIndex <= 2 ? "text-emerald-400" : uvIndex <= 5 ? "text-yellow-400" : "text-red-400";

  return (
    <div
      className={`absolute top-16 left-4 md:left-8 z-20 transition-all duration-300 ${
        isMinimized ? "w-52" : "w-72 md:w-84"
      } rounded-3xl bg-black/90 backdrop-blur-2xl border border-yellow-400/35 p-4 md:p-5 text-white shadow-2xl shadow-black/90 hover:border-yellow-400/50 animate-fade-in font-mono`}
    >
      {/* Top Row: Location, GPS & Minimize Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <MapPin className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-xs md:text-sm font-semibold text-white tracking-wide truncate">
            {city || t.activeLocation}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onRefreshGPS && !isMinimized && (
            <button
              onClick={onRefreshGPS}
              disabled={isLocating}
              title="Update live GPS location"
              className="px-2 py-0.5 rounded-lg bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/40 text-[10px] text-yellow-300 hover:text-yellow-200 transition cursor-pointer flex items-center gap-1"
            >
              <Navigation className="w-2.5 h-2.5 text-yellow-400" />
              <span>{isLocating ? "..." : t.gps}</span>
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
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          {t.live}
        </span>
      </div>

      <p className="text-xs md:text-sm font-medium text-yellow-300/90 mt-0.5 capitalize truncate">
        {translatedCondition}
      </p>

      {/* Expanded Metrics & Quick Sensor Triggers */}
      {!isMinimized && (
        <>
          {feelsLike !== undefined && (
            <p className="text-[11px] text-gray-400 mt-0.5">
              {t.feelsLike} <span className="font-semibold text-yellow-400">{Math.round(feelsLike)}°C</span>
            </p>
          )}

          {/* Micro Atmospheric Metrics Strip (Translated) */}
          <div className="mt-3 pt-2.5 border-t border-yellow-400/15 grid grid-cols-3 gap-1 text-center text-xs">
            <div className="flex flex-col items-center">
              <Droplets className="w-3.5 h-3.5 text-sky-400 mb-0.5" />
              <span className="text-[9px] text-gray-400">{t.humidity}</span>
              <span className="font-semibold text-white text-[11px]">{humidity ?? 65}%</span>
            </div>

            <div className="flex flex-col items-center">
              <Wind className="w-3.5 h-3.5 text-emerald-400 mb-0.5" />
              <span className="text-[9px] text-gray-400">{t.wind}</span>
              <span className="font-semibold text-white text-[11px]">{windSpeed ?? 8} km/h</span>
            </div>

            <div className="flex flex-col items-center">
              <Gauge className="w-3.5 h-3.5 text-yellow-400 mb-0.5" />
              <span className="text-[9px] text-gray-400">{t.pressure}</span>
              <span className="font-semibold text-white text-[11px]">{pressure ?? 1012} hPa</span>
            </div>
          </div>

          {/* Toggle Astro, Solar, Moon & Air Quality Intelligence */}
          <div className="mt-2.5 pt-2 border-t border-white/10">
            <button
              onClick={() => setShowAstro(!showAstro)}
              className="w-full py-1.5 px-2.5 rounded-xl bg-gray-950/80 hover:bg-gray-900 border border-white/10 hover:border-yellow-400/40 text-[10px] text-gray-300 hover:text-white flex items-center justify-between transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sun className="w-3 h-3 text-yellow-400" />
                <Moon className="w-3 h-3 text-cyan-300" />
                <span className="font-bold">{t.astroIntelligence}</span>
              </div>
              <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${showAstro ? "rotate-180" : ""}`} />
            </button>

            {/* Expandable Astro & AQI Sub-Panel */}
            {showAstro && (
              <div className="mt-2 p-2.5 rounded-2xl bg-gray-950/90 border border-yellow-400/20 space-y-2 text-[10px] animate-fade-in">
                {/* UV & Air Quality AQI */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-1.5 rounded-xl bg-black/60 border border-white/5">
                    <span className="text-gray-400 block">{t.uvIndex}:</span>
                    <span className={`font-bold ${uvColor}`}>{uvIndex} ({uvRating})</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-black/60 border border-white/5">
                    <span className="text-gray-400 block">{t.airQuality}:</span>
                    <span className={`font-bold ${aqiColor}`}>{aqi} ({aqiRating})</span>
                  </div>
                </div>

                {/* Sun & Moon Cycle */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-1.5 rounded-xl bg-black/60 border border-white/5">
                    <span className="text-gray-400 block">🌅 {t.sunrise}:</span>
                    <span className="font-semibold text-white">{sunrise}</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-black/60 border border-white/5">
                    <span className="text-gray-400 block">🌇 {t.sunset}:</span>
                    <span className="font-semibold text-white">{sunset}</span>
                  </div>
                </div>

                {/* Moon Phase & Visibility */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-1.5 rounded-xl bg-black/60 border border-white/5">
                    <span className="text-gray-400 block">🌔 {t.moonPhase}:</span>
                    <span className="font-semibold text-white truncate block">{moonPhase}</span>
                  </div>
                  <div className="p-1.5 rounded-xl bg-black/60 border border-white/5">
                    <span className="text-gray-400 block">👁️ {t.visibility}:</span>
                    <span className="font-semibold text-white">{visibility} km</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick High-Impact Tools Action Bar */}
          <div className="mt-2.5 pt-2 border-t border-white/10 grid grid-cols-5 gap-1 text-center">
            <button
              onClick={onOpenLightning}
              title="IITM / IMD DAMINI Lightning Strike Sensor"
              className="p-1.5 rounded-xl bg-gray-950/80 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 text-yellow-400 flex flex-col items-center gap-0.5 transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="text-[9px] text-gray-300">Strike</span>
            </button>

            <button
              onClick={onOpenCropGDD}
              title="Krishi Vigyan Kendra Crop Phenology & GDD Engine"
              className="p-1.5 rounded-xl bg-gray-950/80 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 text-emerald-400 flex flex-col items-center gap-0.5 transition cursor-pointer"
            >
              <Sprout className="w-3.5 h-3.5" />
              <span className="text-[9px] text-gray-300">Crops</span>
            </button>

            <button
              onClick={onOpenSatellite}
              title="ISRO INSAT-3DR Geostationary Satellite Imagery"
              className="p-1.5 rounded-xl bg-gray-950/80 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 text-cyan-400 flex flex-col items-center gap-0.5 transition cursor-pointer"
            >
              <Satellite className="w-3.5 h-3.5" />
              <span className="text-[9px] text-gray-300">ISRO</span>
            </button>

            <button
              onClick={onOpenDisaster}
              title="NDMA Disaster & Relief Camp Hub"
              className="p-1.5 rounded-xl bg-gray-950/80 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 text-red-400 flex flex-col items-center gap-0.5 transition cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="text-[9px] text-gray-300">NDMA</span>
            </button>

            <button
              onClick={onOpenSms}
              title="Rural 2G/3G SMS Broadcast Simulator"
              className="p-1.5 rounded-xl bg-gray-950/80 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 text-yellow-300 flex flex-col items-center gap-0.5 transition cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="text-[9px] text-gray-300">SMS</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
