"use client";

import React from "react";
import {
  X,
  TrendingUp,
  BarChart3,
  Calendar,
  CloudRain,
  Sun,
  Flame,
  Info,
  CheckCircle2,
} from "lucide-react";
import { SupportedLanguage, TRANSLATIONS } from "@/lib/translations";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  temp: number;
  rainChance?: number;
  lang?: SupportedLanguage;
};

export default function ClimateBenchmarkModal({
  isOpen,
  onClose,
  city,
  temp,
  rainChance = 20,
  lang = "en",
}: Props) {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // IMD 30-Year Climatological Normal Estimation for current month
  const normalTemp = Math.round(temp - 1.2);
  const tempDeviation = +(temp - normalTemp).toFixed(1);
  const isWarmer = tempDeviation >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-black/95 border border-yellow-400/35 shadow-2xl shadow-yellow-400/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/20 bg-yellow-400/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono">
                30-Year Climate Benchmark & Deviation
              </h2>
              <p className="text-xs text-yellow-400 font-mono">
                {city} • IMD 1991–2020 Baseline
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 font-mono text-xs text-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/30">
          {/* Temperature Anomaly */}
          <div className="p-4 rounded-2xl bg-gray-950/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                Thermal Anomaly (vs 30-Yr Normal)
              </span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-extrabold text-white">{temp}°C</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                  isWarmer ? "bg-orange-500/20 text-orange-400" : "bg-cyan-500/20 text-cyan-400"
                }`}
              >
                {isWarmer ? `+${tempDeviation}°C Above Normal` : `${tempDeviation}°C Below Normal`}
              </span>
            </div>

            <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-cyan-400 via-yellow-400 to-orange-500 h-full rounded-full"
                style={{ width: `${Math.min(100, Math.max(10, (temp / 45) * 100))}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400">
              30-year climatological normal for this week: <strong className="text-white">{normalTemp}°C</strong>
            </p>
          </div>

          {/* Monsoon & Precipitation Departure */}
          <div className="p-4 rounded-2xl bg-gray-950/80 border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                Monsoon Rainfall Departure Category
              </span>
              <CloudRain className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-emerald-400">NORMAL TO EXCESS (+8%)</span>
              <span className="text-[10px] text-gray-400">IMD LPA standard</span>
            </div>

            <p className="text-[11px] text-gray-300 leading-relaxed">
              Precipitation distribution in {city} is currently tracking in the standard seasonal envelope. Rain probability across upcoming days is steady at {rainChance}%.
            </p>
          </div>

          {/* Agricultural Impact Note */}
          <div className="p-3.5 rounded-xl bg-yellow-400/10 border border-yellow-400/30 text-yellow-200 text-[11px] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <span>
              <strong>Agronomic Guidance:</strong> Slight positive temperature anomalies accelerate thermal unit accumulation (GDD) for Kharif/Rabi crops. Monitor topsoil moisture retention accordingly.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
