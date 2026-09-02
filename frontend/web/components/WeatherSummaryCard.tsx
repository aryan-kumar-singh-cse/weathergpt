"use client";

import React, { useState } from "react";
import {
  MapPin,
  Navigation,
  Zap,
  Sprout,
  Satellite,
  ShieldAlert,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { SupportedLanguage, TRANSLATIONS, translateCondition, translateAqiCategory } from "@/lib/translations";
import { speakText, stopSpeech } from "@/lib/tts";
import SunMoonArcCard from "./SunMoonArcCard";
import ImdNowcastBanner from "./ImdNowcastBanner";
import NowcastSlider, { NowcastSlot } from "./NowcastSlider";

type Props = {
  city: string;
  temp: number;
  condition: string;
  feelsLike?: number;
  maxTemp?: number;
  minTemp?: number;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  uvIndex?: number;
  aqi?: number;
  aqiCategory?: string;
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
  moonPhase?: string;
  visibility?: number;
  dewPoint?: number;
  updatedAt?: string;
  imdWarning?: string;
  imdSeverity?: "yellow" | "orange" | "red" | "green";
  nowcastSlots?: NowcastSlot[];
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
  temp = 34.4,
  condition = "Overcast Sky",
  feelsLike = 36.5,
  maxTemp = 34.9,
  minTemp = 26.7,
  humidity = 41,
  windSpeed = 2.8,
  pressure = 1012,
  uvIndex = 5.4,
  aqi = 156,
  aqiCategory = "Moderate",
  sunrise = "05:58",
  sunset = "18:43",
  moonrise = "21:00",
  moonset = "09:49",
  moonPhase = "Waxing Gibbous",
  visibility = 10,
  dewPoint = 21,
  updatedAt = "05:30 PM",
  imdWarning = "Thunder with Lightning and Light to Moderate Rain",
  imdSeverity = "yellow",
  nowcastSlots,
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
  const [isSpeaking, setIsSpeaking] = useState(false);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const translatedCondition = translateCondition(condition, lang);

  const rawAqiCat = aqiCategory || (aqi <= 50 ? "Good" : aqi <= 100 ? "Satisfactory" : aqi <= 200 ? "Moderate" : aqi <= 300 ? "Poor" : "Severe");
  const translatedAqiCat = translateAqiCategory(rawAqiCat, lang);
  const aqiBgColor = aqi <= 50 ? "bg-emerald-500 text-white" : aqi <= 100 ? "bg-green-500 text-black" : aqi <= 200 ? "bg-yellow-400 text-black font-bold" : "bg-red-500 text-white font-bold";

  // Voice Readout of Weather Briefing in Selected Language
  const handleToggleVoice = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    const speechText = `${city}. ${translatedCondition}. ${t.temperature}: ${temp.toFixed(1)}°C. ${t.feelsLike}: ${feelsLike?.toFixed(1)}°C. ${t.humidity}: ${humidity}%. ${t.airQuality}: ${aqi}, ${translatedAqiCat}. ${imdWarning ? imdWarning : ""}`;

    setIsSpeaking(true);
    speakText(
      speechText,
      lang,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  return (
    <div
      className={`absolute top-16 left-4 md:left-8 z-20 transition-all duration-300 ${
        isMinimized ? "w-52" : "w-84 md:w-96"
      } rounded-3xl bg-black/90 backdrop-blur-2xl border border-yellow-400/35 p-4 md:p-5 text-white shadow-2xl shadow-black/90 hover:border-yellow-400/50 animate-fade-in font-mono max-h-[88vh] overflow-y-auto no-scrollbar`}
    >
      {/* Top Row: Location, GPS, Voice Readout & Minimize Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <MapPin className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-xs md:text-sm font-bold text-white tracking-wide truncate">
            {city || "Modinagar, Ghaziabad"}
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* TTS Listen Button */}
          {!isMinimized && (
            <button
              onClick={handleToggleVoice}
              title={isSpeaking ? t.stopAudio : t.listenAudio}
              className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[10px] ${
                isSpeaking
                  ? "bg-yellow-400 text-gray-950 border-yellow-400 font-bold animate-pulse"
                  : "bg-yellow-400/15 hover:bg-yellow-400/25 border-yellow-400/40 text-yellow-300"
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              <span>{isSpeaking ? t.stopAudio : t.listenAudio}</span>
            </button>
          )}

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
            title={isMinimized ? t.expand : t.minimize}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Temperature & Condition */}
      <div className="mt-2 flex items-baseline justify-between">
        <div>
          <p className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            {temp.toFixed(1)}°<span className="text-xl font-normal text-yellow-400">C</span>
          </p>
          <p className="text-xs font-semibold text-yellow-300 mt-0.5">
            {translatedCondition}
          </p>
          <span className="text-[10px] text-gray-400 block mt-0.5">
            {updatedAt}
          </span>
        </div>

        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-400/15 border border-yellow-400/30 text-yellow-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          {t.live}
        </span>
      </div>

      {/* Feels Like & Max/Min Physical Station Range */}
      {!isMinimized && (
        <div className="mt-1.5 space-y-0.5 text-xs text-gray-300">
          {feelsLike !== undefined && (
            <p className="text-[11px] text-gray-300">
              {t.feelsLike}: <span className="font-bold text-yellow-400">{feelsLike.toFixed(1)}°C</span>
            </p>
          )}
          <div className="flex items-center gap-3 text-[11px] text-gray-400">
            <span>{t.high}: <strong className="text-white">{maxTemp.toFixed(1)}°C</strong></span>
            <span>•</span>
            <span>{t.low}: <strong className="text-white">{minTemp.toFixed(1)}°C</strong></span>
            <span>•</span>
            <span>💧 <strong className="text-sky-300">{humidity}%</strong></span>
          </div>
        </div>
      )}

      {/* CPCB National Air Quality Badge */}
      {!isMinimized && (
        <div className="mt-2.5 p-2 rounded-2xl bg-gray-950/80 border border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white">AQI {aqi}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-lg ${aqiBgColor}`}>
              {translatedAqiCat}
            </span>
          </div>
          <span className="text-[8px] text-gray-400 uppercase tracking-wider font-mono">
            {t.airQuality}
          </span>
        </div>
      )}

      {/* 3-Hourly Nowcasting Slider */}
      {!isMinimized && (
        <NowcastSlider slots={nowcastSlots} />
      )}

      {/* Official IMD District Impact Nowcast Banner (If active) */}
      {!isMinimized && imdWarning && (
        <ImdNowcastBanner
          city={city}
          warning={imdWarning}
          severity={imdSeverity}
        />
      )}

      {/* Sun & Moon Curved Celestial Horizon Arcs */}
      {!isMinimized && (
        <SunMoonArcCard
          sunrise={sunrise}
          sunset={sunset}
          moonrise={moonrise}
          moonset={moonset}
          moonPhase={moonPhase}
        />
      )}

      {/* Quick High-Impact Tools Action Bar */}
      {!isMinimized && (
        <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-5 gap-1 text-center">
          <button
            onClick={onOpenLightning}
            title={t.lightningAnalyzer}
            aria-label="Open DAMINI lightning strike analyzer"
            className="p-1.5 rounded-xl bg-gray-950/80 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 text-yellow-400 flex flex-col items-center gap-0.5 transition cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="text-[9px] text-gray-300">Strike</span>
          </button>

          <button
            onClick={onOpenCropGDD}
            title={t.cropGdd}
            aria-label="Open crop calendar and GDD engine"
            className="p-1.5 rounded-xl bg-gray-950/80 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 text-emerald-400 flex flex-col items-center gap-0.5 transition cursor-pointer"
          >
            <Sprout className="w-3.5 h-3.5" />
            <span className="text-[9px] text-gray-300">Crops</span>
          </button>

          <button
            onClick={onOpenSatellite}
            title={t.satelliteInsat}
            aria-label="Open ISRO INSAT satellite feed"
            className="p-1.5 rounded-xl bg-gray-950/80 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 text-cyan-400 flex flex-col items-center gap-0.5 transition cursor-pointer"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span className="text-[9px] text-gray-300">ISRO</span>
          </button>

          <button
            onClick={onOpenDisaster}
            title={t.disasterHub}
            aria-label="Open NDMA disaster relief hub"
            className="p-1.5 rounded-xl bg-gray-950/80 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 text-red-400 flex flex-col items-center gap-0.5 transition cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span className="text-[9px] text-gray-300">NDMA</span>
          </button>

          <button
            onClick={onOpenSms}
            title={t.ruralSms}
            aria-label="Open rural SMS broadcast simulator"
            className="p-1.5 rounded-xl bg-gray-950/80 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 text-yellow-300 flex flex-col items-center gap-0.5 transition cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="text-[9px] text-gray-300">SMS</span>
          </button>
        </div>
      )}
    </div>
  );
}
