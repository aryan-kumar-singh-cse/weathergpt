"use client";

import React, { useState } from "react";
import {
  X,
  ShieldAlert,
  Sprout,
  Plane,
  Users,
  Droplets,
  Wind,
  Sun,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Activity,
  Flame,
  CloudLightning,
} from "lucide-react";
import { SupportedLanguage, TRANSLATIONS } from "@/lib/translations";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  temp: number;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  rainChance?: number;
  condition?: string;
  activeRole?: string;
  lang?: SupportedLanguage;
};

export default function SectorAdvisoryModal({
  isOpen,
  onClose,
  city,
  temp,
  humidity = 65,
  windSpeed = 12,
  pressure = 1012,
  rainChance = 20,
  condition = "Clear",
  activeRole = "farmer",
  lang = "en",
}: Props) {
  const [selectedTab, setSelectedTab] = useState<"farmer" | "pilot" | "disaster" | "citizen">(
    activeRole.toLowerCase().includes("farmer")
      ? "farmer"
      : activeRole.toLowerCase().includes("pilot")
      ? "pilot"
      : activeRole.toLowerCase().includes("disaster")
      ? "disaster"
      : "farmer"
  );

  if (!isOpen) return null;

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  // 1. Agriculture Calculations
  const isSprayingSafe = windSpeed < 18 && rainChance < 40;
  const isIrrigationNeeded = rainChance < 30 && humidity < 70;
  const soilMoistureEst = Math.min(95, Math.max(25, Math.round(humidity * 0.7 + (rainChance > 50 ? 30 : 5))));

  // 2. Aviation Calculations
  const isVFRFlightSafe = windSpeed < 25 && !condition.toLowerCase().includes("fog") && !condition.toLowerCase().includes("thunder");
  const turbulenceLevel = windSpeed > 28 ? "Moderate to High" : windSpeed > 15 ? "Light Chop" : "Smooth";

  // 3. Disaster & NDMA Risk Calculations
  const isExtremeHeat = temp > 40;
  const isSevereStorm = rainChance > 75 || condition.toLowerCase().includes("thunder") || windSpeed > 45;
  const alertColor = isSevereStorm ? "🔴 Red Alert (Severe Storm/Inundation)" : isExtremeHeat ? "🟠 Orange Alert (Heatwave)" : rainChance > 50 ? "🟡 Yellow Alert (Watch)" : "🟢 Green Alert (Normal)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-black/95 border border-yellow-400/35 shadow-2xl shadow-yellow-400/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/20 bg-yellow-400/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>Sector Decision Intelligence & Advisory</span>
              </h2>
              <p className="text-xs text-yellow-400 font-mono">
                {city} • {temp}°C • {condition}
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

        {/* Sector Tabs */}
        <div className="flex border-b border-white/10 bg-gray-950/60 px-6 pt-3 gap-2 overflow-x-auto scrollbar-none font-mono text-xs">
          <button
            onClick={() => setSelectedTab("farmer")}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              selectedTab === "farmer"
                ? "border-yellow-400 text-yellow-400 font-bold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Sprout className="w-4 h-4" />
            <span>Agriculture / Farmer</span>
          </button>

          <button
            onClick={() => setSelectedTab("disaster")}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              selectedTab === "disaster"
                ? "border-yellow-400 text-yellow-400 font-bold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>NDMA & Disaster Early Warning</span>
          </button>

          <button
            onClick={() => setSelectedTab("pilot")}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              selectedTab === "pilot"
                ? "border-yellow-400 text-yellow-400 font-bold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Plane className="w-4 h-4" />
            <span>Aviation / Pilot METAR</span>
          </button>

          <button
            onClick={() => setSelectedTab("citizen")}
            className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer shrink-0 ${
              selectedTab === "citizen"
                ? "border-yellow-400 text-yellow-400 font-bold"
                : "border-transparent text-gray-400 hover:text-gray-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Public Health & Citizen</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-xs text-gray-200 scrollbar-thin scrollbar-thumb-yellow-400/30">
          {/* TAB 1: FARMER */}
          {selectedTab === "farmer" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase">Pesticide Spraying</span>
                    {isSprayingSafe ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <span className={`text-sm font-bold block ${isSprayingSafe ? "text-emerald-400" : "text-red-400"}`}>
                    {isSprayingSafe ? "FEASIBLE (Safe)" : "UNSAFE (Wash-off risk)"}
                  </span>
                  <p className="text-[10px] text-gray-400">
                    Wind {windSpeed} km/h • Rain chance {rainChance}%
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase">Irrigation Demand</span>
                    <Droplets className="w-4 h-4 text-cyan-400" />
                  </div>
                  <span className={`text-sm font-bold block ${isIrrigationNeeded ? "text-yellow-400" : "text-emerald-400"}`}>
                    {isIrrigationNeeded ? "REQUIRED (Dry)" : "DELAY (Rain incoming)"}
                  </span>
                  <p className="text-[10px] text-gray-400">
                    Soil moisture {soilMoistureEst}% saturation
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 uppercase">Fungal Disease Risk</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className={`text-sm font-bold block ${humidity > 80 ? "text-amber-400" : "text-emerald-400"}`}>
                    {humidity > 80 ? "HIGH (High humidity)" : "LOW (Safe range)"}
                  </span>
                  <p className="text-[10px] text-gray-400">
                    Relative Humidity {humidity}%
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 space-y-2">
                <h4 className="font-bold text-yellow-300 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-yellow-400" />
                  <span>IMD Gramin Krishi Mausam Seva (Agri Advisory)</span>
                </h4>
                <ul className="space-y-1 text-xs text-gray-300 list-disc list-inside leading-relaxed">
                  <li>Keep field drainage channels open to prevent stagnation during sudden convective showers.</li>
                  <li>Delay harvesting of open grains if rain probability exceeds 60% in the next 48 hours.</li>
                  <li>Maintain mulching in dry zones to preserve soil moisture under high ambient temperatures.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: DISASTER RESPONSE (NDMA) */}
          {selectedTab === "disaster" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gray-950 border border-white/15 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">Current IMD Alert Level</span>
                  <p className="text-base font-bold text-yellow-400 mt-0.5">{alertColor}</p>
                </div>
                <ShieldAlert className="w-8 h-8 text-yellow-400" />
              </div>

              <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-2.5">
                <h4 className="font-bold text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>National Disaster Management Authority (NDMA) Safety Protocols</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                    <span className="text-emerald-400 font-bold block mb-1">✔ DO&apos;S</span>
                    <ul className="space-y-1 text-[11px] text-gray-300 list-disc list-inside">
                      <li>Keep emergency power banks & radios charged.</li>
                      <li>Stay away from loose electrical wires & trees.</li>
                      <li>Store clean drinking water and emergency medicines.</li>
                    </ul>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                    <span className="text-red-400 font-bold block mb-1">✖ DON&apos;TS</span>
                    <ul className="space-y-1 text-[11px] text-gray-300 list-disc list-inside">
                      <li>Do not drive across submerged roads or bridges.</li>
                      <li>Do not take shelter under solitary tall trees during lightning.</li>
                      <li>Do not spread unverified weather rumors.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: AVIATION & PILOT */}
          {selectedTab === "pilot" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/10 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase">VFR Flight Status</span>
                  <span className={`text-sm font-bold block ${isVFRFlightSafe ? "text-emerald-400" : "text-amber-400"}`}>
                    {isVFRFlightSafe ? "VFR OPTIMAL" : "IFR CAUTION"}
                  </span>
                  <p className="text-[10px] text-gray-400">Standard VFR visibility clear</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/10 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase">En-Route Turbulence</span>
                  <span className="text-sm font-bold text-yellow-400 block">{turbulenceLevel}</span>
                  <p className="text-[10px] text-gray-400">Surface wind {windSpeed} km/h</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/10 space-y-1">
                  <span className="text-[10px] text-gray-400 uppercase">Altimeter (QNH)</span>
                  <span className="text-sm font-bold text-white block">{pressure} hPa</span>
                  <p className="text-[10px] text-gray-400">Standard barometric level</p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-black/60 border border-white/10 font-mono text-xs space-y-1">
                <span className="text-[10px] text-gray-400 uppercase">Synthetic METAR String:</span>
                <p className="text-yellow-300 font-bold tracking-wider">
                  METAR {city.slice(0, 4).toUpperCase()} 010000Z 240{windSpeed.toString().padStart(2, "0")}KT 9999 {condition.toUpperCase()} {temp}/{Math.round(temp - 4)} Q{pressure} NOSIG
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: CITIZEN */}
          {selectedTab === "citizen" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/10 space-y-1.5">
                  <span className="text-[10px] text-gray-400 uppercase">Outdoor Comfort Index</span>
                  <span className="text-sm font-bold text-yellow-400 block">
                    {temp > 35 ? "Hot & Humid" : temp < 15 ? "Cool & Crisp" : "Comfortable"}
                  </span>
                  <p className="text-[10px] text-gray-400">Feels like {Math.round(temp + 2)}°C</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-gray-950/80 border border-white/10 space-y-1.5">
                  <span className="text-[10px] text-gray-400 uppercase">Commuter & Travel Risk</span>
                  <span className={`text-sm font-bold block ${rainChance > 50 ? "text-amber-400" : "text-emerald-400"}`}>
                    {rainChance > 50 ? "Carry Umbrella (Rain likely)" : "Normal Commuting"}
                  </span>
                  <p className="text-[10px] text-gray-400">Precipitation probability {rainChance}%</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
