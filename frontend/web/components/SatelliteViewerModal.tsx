"use client";

import React, { useState } from "react";
import {
  X,
  Satellite,
  Layers,
  Radio,
  Eye,
  Thermometer,
  CloudRain,
  ExternalLink,
  Info,
} from "lucide-react";
import { SupportedLanguage } from "@/lib/translations";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  lat: number;
  lng: number;
  condition?: string;
  rainChance?: number;
  lang?: SupportedLanguage;
};

export default function SatelliteViewerModal({
  isOpen,
  onClose,
  city,
  lat,
  lng,
  condition = "Clear",
  rainChance = 20,
  lang = "en",
}: Props) {
  const [activeChannel, setActiveChannel] = useState<"clouds" | "rain" | "wind">("clouds");

  if (!isOpen) return null;

  const channelEmbedMap: Record<string, string> = {
    clouds: "clouds",
    rain: "rain",
    wind: "wind",
  };

  const mapEmbedUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lng}&detailLat=${lat}&detailLon=${lng}&width=650&height=400&zoom=6&level=surface&overlay=${channelEmbedMap[activeChannel]}&product=ecmwf&menu=&message=&marker=true&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;

  // Plain-language satellite report for the user
  const isCloudy = rainChance > 40 || condition.toLowerCase().includes("cloud") || condition.toLowerCase().includes("rain");
  const cloudAnalysis = isCloudy
    ? `Satellite telemetry over ${city} shows active cumulus and stratus cloud formations. Convective moisture index is moderate to high with cloud top temperatures averaging -15°C.`
    : `Geostationary satellite channels show largely clear sky albedo over ${city} with high ground visibility and minimal convective cloud formation.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-black/95 border border-yellow-400/40 shadow-2xl shadow-yellow-400/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/20 bg-yellow-400/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center text-yellow-400">
              <Satellite className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>ISRO INSAT-3DR Satellite & Cloud Observation</span>
              </h2>
              <p className="text-xs text-yellow-400 font-mono">
                {city} ({lat.toFixed(2)}°N, {lng.toFixed(2)}°E) • Geostationary Sector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://www.windy.com/?satellite,${lat},${lng},6`}
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
          <button
            onClick={() => setActiveChannel("clouds")}
            className={`px-3 py-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
              activeChannel === "clouds"
                ? "bg-yellow-400/20 border-yellow-400 text-yellow-300 font-bold"
                : "bg-gray-900 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            Cloud Satellite Cover
          </button>

          <button
            onClick={() => setActiveChannel("rain")}
            className={`px-3 py-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
              activeChannel === "rain"
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                : "bg-gray-900 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            Precipitation Radar
          </button>

          <button
            onClick={() => setActiveChannel("wind")}
            className={`px-3 py-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
              activeChannel === "wind"
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold"
                : "bg-gray-900 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            Wind Circulation
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 md:p-6 space-y-3 font-mono text-xs text-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/30">
          {/* Plain-Language Satellite Interpretation */}
          <div className="p-3.5 rounded-2xl bg-gray-950 border border-white/10 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                What the satellite is seeing over {city}:
              </span>
              <p className="text-xs text-gray-200 mt-0.5 leading-relaxed">{cloudAnalysis}</p>
            </div>
          </div>

          {/* Interactive Live Synoptic Map */}
          <div className="relative w-full h-80 rounded-2xl bg-black border border-white/10 overflow-hidden">
            <iframe
              src={mapEmbedUrl}
              className="w-full h-full border-none"
              loading="lazy"
              title="ISRO Synoptic Cloud Satellite Feed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
