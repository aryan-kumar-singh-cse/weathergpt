"use client";

import React, { useState } from "react";
import {
  X,
  ShieldAlert,
  PhoneCall,
  MapPin,
  Flame,
  CloudRain,
  Building,
  AlertTriangle,
  Radio,
  LifeBuoy,
} from "lucide-react";
import { SupportedLanguage } from "@/lib/translations";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  temp: number;
  rainChance?: number;
  windSpeed?: number;
  lang?: SupportedLanguage;
};

export default function DisasterReliefModal({
  isOpen,
  onClose,
  city,
  temp,
  rainChance = 20,
  windSpeed = 10,
  lang = "en",
}: Props) {
  const [simulatedRainMm, setSimulatedRainMm] = useState(45);

  if (!isOpen) return null;

  const isSevereFlood = simulatedRainMm > 90;
  const isModerateFlood = simulatedRainMm > 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-black/95 border border-red-500/40 shadow-2xl shadow-red-500/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-500/20 bg-red-500/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>NDMA Multi-Hazard Disaster & Relief Camp Hub</span>
              </h2>
              <p className="text-xs text-red-400 font-mono">
                {city} • National Disaster Management Authority Network
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
        <div className="p-6 space-y-4 font-mono text-xs text-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-red-500/30">
          {/* Emergency 1-Tap SOS Speed Dialers */}
          <div className="space-y-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Emergency SOS 1-Tap Helplines:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <a
                href="tel:112"
                className="p-3 rounded-2xl bg-red-950/40 border border-red-500/40 hover:bg-red-500/20 transition cursor-pointer text-center space-y-1 block"
              >
                <PhoneCall className="w-4 h-4 text-red-400 mx-auto" />
                <span className="text-sm font-extrabold text-white block">112</span>
                <span className="text-[9px] text-gray-400 block">National Emergency</span>
              </a>

              <a
                href="tel:1077"
                className="p-3 rounded-2xl bg-gray-950 border border-white/10 hover:border-yellow-400/40 transition cursor-pointer text-center space-y-1 block"
              >
                <LifeBuoy className="w-4 h-4 text-yellow-400 mx-auto" />
                <span className="text-sm font-extrabold text-white block">1077</span>
                <span className="text-[9px] text-gray-400 block">District Disaster</span>
              </a>

              <a
                href="tel:1070"
                className="p-3 rounded-2xl bg-gray-950 border border-white/10 hover:border-yellow-400/40 transition cursor-pointer text-center space-y-1 block"
              >
                <Radio className="w-4 h-4 text-cyan-400 mx-auto" />
                <span className="text-sm font-extrabold text-white block">1070</span>
                <span className="text-[9px] text-gray-400 block">State Disaster Control</span>
              </a>

              <a
                href="tel:108"
                className="p-3 rounded-2xl bg-gray-950 border border-white/10 hover:border-emerald-400/40 transition cursor-pointer text-center space-y-1 block"
              >
                <Building className="w-4 h-4 text-emerald-400 mx-auto" />
                <span className="text-sm font-extrabold text-white block">108</span>
                <span className="text-[9px] text-gray-400 block">Ambulance SOS</span>
              </a>
            </div>
          </div>

          {/* Interactive Cloudburst & Flood Inundation Simulator */}
          <div className="p-4 rounded-2xl bg-gray-950/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white">Rainfall Inundation Simulator:</span>
              </div>
              <span className="text-sm font-extrabold text-cyan-400">{simulatedRainMm} mm / 24h</span>
            </div>

            <input
              type="range"
              min="10"
              max="200"
              value={simulatedRainMm}
              onChange={(e) => setSimulatedRainMm(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-gray-300">Predicted Inundation Zone:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-xs ${
                  isSevereFlood
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : isModerateFlood
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {isSevereFlood ? "High Inundation (Evacuate Lowlands)" : isModerateFlood ? "Moderate Waterlogging" : "Safe Drainage Envelope"}
              </span>
            </div>
          </div>

          {/* Designated District Relief Camp Facilities */}
          <div className="space-y-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Designated Safe Shelters & Relief Camps in {city}:
            </span>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-gray-950 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs block">1. District Multi-Purpose Cyclone/Flood Shelter</span>
                  <span className="text-[10px] text-gray-400">Capacity: 1,200 Persons • Generators & Medical Bay</span>
                </div>
                <span className="text-xs text-emerald-400 font-bold">ACTIVE</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-950 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs block">2. Government Higher Secondary School Campus</span>
                  <span className="text-[10px] text-gray-400">Capacity: 600 Persons • Drinking Water Reserve</span>
                </div>
                <span className="text-xs text-emerald-400 font-bold">STANDBY</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
