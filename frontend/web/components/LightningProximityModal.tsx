"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Zap,
  ShieldAlert,
  Volume2,
  VolumeX,
  Radio,
  AlertOctagon,
  Radar,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { SupportedLanguage, TRANSLATIONS } from "@/lib/translations";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  lat: number;
  lng: number;
  condition: string;
  rainChance?: number;
  lang?: SupportedLanguage;
};

export default function LightningProximityModal({
  isOpen,
  onClose,
  city,
  lat,
  lng,
  condition,
  rainChance = 25,
  lang = "en",
}: Props) {
  const [isAlarmMuted, setIsAlarmMuted] = useState(true);
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isHighRisk = rainChance > 45 || condition.toLowerCase().includes("thunder") || condition.toLowerCase().includes("rain");
  const strikeDistance = isHighRisk ? "6.8 km" : "24.5 km";
  const strikeCount30Min = isHighRisk ? 18 : 2;
  const threatLevel = isHighRisk ? "HIGH RISK (Take Shelter Indoors)" : "LOW (Continuous Monitoring)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-black/95 border border-yellow-400/40 shadow-2xl shadow-yellow-400/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/20 bg-yellow-400/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center text-yellow-400 animate-pulse">
              <Zap className="w-5 h-5 fill-yellow-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>DAMINI Real-Time Lightning & Nowcasting Sensor</span>
              </h2>
              <p className="text-xs text-yellow-400 font-mono">
                {city} • IITM / IMD Ground Sensor Network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAlarmMuted(!isAlarmMuted)}
              title={isAlarmMuted ? "Unmute Alarm" : "Mute Alarm"}
              className="p-2 rounded-xl bg-gray-900 border border-white/10 hover:border-yellow-400/40 text-gray-300 hover:text-yellow-400 transition cursor-pointer"
            >
              {isAlarmMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-yellow-400 animate-bounce" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Radar Scanner Visualizer */}
        <div className="p-6 space-y-4 font-mono text-xs text-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/30">
          <div className="relative w-full h-44 rounded-2xl bg-gray-950 border border-white/10 overflow-hidden flex items-center justify-center">
            {/* Concentric Radar Rings */}
            <div className="absolute w-20 h-20 rounded-full border border-yellow-400/20 animate-ping opacity-30" />
            <div className="absolute w-36 h-36 rounded-full border border-yellow-400/30" />
            <div className="absolute w-56 h-56 rounded-full border border-yellow-400/20" />
            <div className="absolute w-full h-[1px] bg-yellow-400/20" />
            <div className="absolute h-full w-[1px] bg-yellow-400/20" />

            {/* Simulated Lightning Blips */}
            <div
              className={`absolute top-10 right-20 flex items-center gap-1 transition-all duration-700 ${
                isHighRisk ? "opacity-100 scale-110" : "opacity-40 scale-90"
              }`}
            >
              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-bounce" />
              <span className="text-[9px] font-bold text-yellow-300 bg-black/80 px-1 rounded">
                {strikeDistance}
              </span>
            </div>

            <div className="z-10 text-center space-y-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block">
                Sensor Range: 30 km Radius
              </span>
              <div className="flex items-center justify-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-spin-slow" />
                <span className="text-sm font-bold text-white tracking-wider">
                  {city.toUpperCase()} GROUND STATION
                </span>
              </div>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-2xl bg-gray-950/80 border border-white/10 text-center space-y-0.5">
              <span className="text-[10px] text-gray-400 uppercase">Nearest Strike</span>
              <span className="text-base font-extrabold text-yellow-400 block">{strikeDistance}</span>
              <span className="text-[9px] text-gray-400">South-West</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-950/80 border border-white/10 text-center space-y-0.5">
              <span className="text-[10px] text-gray-400 uppercase">Strikes (30m)</span>
              <span className="text-base font-extrabold text-white block">{strikeCount30Min}</span>
              <span className="text-[9px] text-gray-400">Convective cells</span>
            </div>

            <div className="p-3 rounded-2xl bg-gray-950/80 border border-white/10 text-center space-y-0.5">
              <span className="text-[10px] text-gray-400 uppercase">Est. Cell ETA</span>
              <span className={`text-base font-extrabold block ${isHighRisk ? "text-red-400" : "text-emerald-400"}`}>
                {isHighRisk ? "~15 Mins" : "No Threat"}
              </span>
              <span className="text-[9px] text-gray-400">Atmospheric velocity</span>
            </div>
          </div>

          {/* Threat Advisory Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 ${
              isHighRisk
                ? "bg-red-950/25 border-red-500/40 text-red-200"
                : "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
            }`}
          >
            <AlertOctagon className={`w-5 h-5 shrink-0 mt-0.5 ${isHighRisk ? "text-red-400" : "text-emerald-400"}`} />
            <div>
              <span className="font-bold text-xs uppercase tracking-wide block">
                Threat Status: {threatLevel}
              </span>
              <p className="text-[11px] text-gray-300 mt-1 leading-relaxed">
                {isHighRisk
                  ? "Lightning activity detected nearby. Suspend all farming activities, avoid open fields, and stay away from tall trees and electric poles."
                  : "Atmospheric charge levels are nominal. Normal field operations can continue safely."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
