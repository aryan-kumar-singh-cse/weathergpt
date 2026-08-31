"use client";

import React, { useState } from "react";
import {
  X,
  Radar,
  CloudRain,
  Wind,
  Sun,
  Layers,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { SupportedLanguage, TRANSLATIONS } from "@/lib/translations";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  lat: number;
  lng: number;
  lang?: SupportedLanguage;
};

export default function WeatherRadarModal({
  isOpen,
  onClose,
  city,
  lat,
  lng,
  lang = "en",
}: Props) {
  const [activeLayer, setActiveLayer] = useState<"rain" | "wind" | "temp" | "clouds">("rain");

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // Open-Meteo & Windy interactive radar embed URL
  const layerParams: Record<string, string> = {
    rain: "rain",
    wind: "wind",
    temp: "temp",
    clouds: "clouds",
  };

  const radarEmbedUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lng}&detailLat=${lat}&detailLon=${lng}&width=650&height=450&zoom=6&level=surface&overlay=${layerParams[activeLayer]}&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-3xl bg-black/95 border border-yellow-400/35 shadow-2xl shadow-yellow-400/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/20 bg-yellow-400/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
              <Radar className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>Interactive Live Weather Radar & Synoptic Map</span>
              </h2>
              <p className="text-xs text-yellow-400 font-mono">
                Centered on {city} ({lat.toFixed(2)}°N, {lng.toFixed(2)}°E)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://www.windy.com/?${lat},${lng},7`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-gray-400 hover:text-yellow-400 transition"
            >
              <span>Full Screen</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Layer Selector Bar */}
        <div className="flex border-b border-white/10 bg-gray-950/80 px-6 py-2.5 gap-2 overflow-x-auto scrollbar-none font-mono text-xs">
          <span className="text-gray-400 flex items-center gap-1 mr-2 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-yellow-400" />
            <span>Radar Layers:</span>
          </span>

          <button
            onClick={() => setActiveLayer("rain")}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeLayer === "rain"
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                : "bg-gray-900 border-white/10 text-gray-400 hover:text-gray-200"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5 text-cyan-400" />
            <span>Precipitation (Rain)</span>
          </button>

          <button
            onClick={() => setActiveLayer("wind")}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeLayer === "wind"
                ? "bg-yellow-500/20 border-yellow-400 text-yellow-300 font-bold"
                : "bg-gray-900 border-white/10 text-gray-400 hover:text-gray-200"
            }`}
          >
            <Wind className="w-3.5 h-3.5 text-yellow-400" />
            <span>Wind Streamlines</span>
          </button>

          <button
            onClick={() => setActiveLayer("temp")}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              activeLayer === "temp"
                ? "bg-orange-500/20 border-orange-400 text-orange-300 font-bold"
                : "bg-gray-900 border-white/10 text-gray-400 hover:text-gray-200"
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-orange-400" />
            <span>Temperature Heatmap</span>
          </button>
        </div>

        {/* Interactive Embedded Live Map */}
        <div className="relative flex-1 min-h-[420px] bg-black">
          <iframe
            src={radarEmbedUrl}
            className="w-full h-full min-h-[420px] border-none"
            loading="lazy"
            title="Live Weather Radar"
          />
        </div>
      </div>
    </div>
  );
}
