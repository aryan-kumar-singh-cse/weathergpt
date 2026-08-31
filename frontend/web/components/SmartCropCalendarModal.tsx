"use client";

import React, { useState } from "react";
import {
  X,
  Sprout,
  Calendar,
  Layers,
  Thermometer,
  Droplets,
  AlertTriangle,
  CheckCircle2,
  Bug,
  Sparkles,
} from "lucide-react";
import { SupportedLanguage, TRANSLATIONS } from "@/lib/translations";

type CropInfo = {
  id: string;
  name: string;
  hindiName: string;
  icon: string;
  baseTemp: number; // Base temperature for GDD calculation
  stages: Array<{ name: string; gddReq: number }>;
  pests: Array<{ name: string; conditionTrigger: string; remedy: string }>;
};

const CROPS_DATABASE: CropInfo[] = [
  {
    id: "paddy",
    name: "Paddy (Rice)",
    hindiName: "धान (चावल)",
    icon: "🌾",
    baseTemp: 10,
    stages: [
      { name: "Nursery / Sowing", gddReq: 250 },
      { name: "Vegetative & Tillering", gddReq: 650 },
      { name: "Panicle Initiation", gddReq: 1100 },
      { name: "Flowering & Milk Stage", gddReq: 1550 },
      { name: "Grain Maturity & Harvest", gddReq: 1950 },
    ],
    pests: [
      {
        name: "Blast & False Smut",
        conditionTrigger: "Humidity > 80% with cloudy sky",
        remedy: "Spray Copper Oxychloride 50 WP @ 2.5 g/L or Tricyclazole 75 WP @ 0.6 g/L.",
      },
      {
        name: "Brown Plant Hopper (BPH)",
        conditionTrigger: "High humidity and stagnant water",
        remedy: "Drain field standing water for 3 days; apply Pymetrozine 50 WG @ 0.6 g/L.",
      },
    ],
  },
  {
    id: "cotton",
    name: "Cotton",
    hindiName: "कपास",
    icon: "🌱",
    baseTemp: 15,
    stages: [
      { name: "Germination & Seedling", gddReq: 300 },
      { name: "Squaring & Vegetative", gddReq: 800 },
      { name: "Boll Formation", gddReq: 1400 },
      { name: "Boll Bursting & Picking", gddReq: 1900 },
    ],
    pests: [
      {
        name: "Pink Bollworm & Whitefly",
        conditionTrigger: "Warm dry periods alternating with light rain",
        remedy: "Install Pheromone traps @ 5/acre; Spray Neem oil 1500 ppm @ 5 ml/L.",
      },
    ],
  },
  {
    id: "wheat",
    name: "Wheat",
    hindiName: "गेहूं",
    icon: "🌿",
    baseTemp: 5,
    stages: [
      { name: "Crown Root Initiation", gddReq: 220 },
      { name: "Tillering & Jointing", gddReq: 600 },
      { name: "Heading & Flowering", gddReq: 1100 },
      { name: "Dough & Ripening", gddReq: 1650 },
    ],
    pests: [
      {
        name: "Yellow Rust (Puccinia striiformis)",
        conditionTrigger: "Cool humid weather with morning dew",
        remedy: "Spray Propiconazole 25 EC @ 1 ml/L upon early symptom detection.",
      },
    ],
  },
  {
    id: "mustard",
    name: "Mustard",
    hindiName: "सरसों",
    icon: "🌻",
    baseTemp: 5,
    stages: [
      { name: "Vegetative Phase", gddReq: 350 },
      { name: "Flowering & Pod Formation", gddReq: 850 },
      { name: "Pod Maturity & Harvest", gddReq: 1300 },
    ],
    pests: [
      {
        name: "Mustard Aphid (Lipaphis erysimi)",
        conditionTrigger: "Cloudy humid weather during flowering",
        remedy: "Spray Dimethoate 30 EC @ 1.7 ml/L or Thiamethoxam 25 WG @ 0.2 g/L.",
      },
    ],
  },
];

type Props = {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  temp: number;
  humidity?: number;
  rainChance?: number;
  lang?: SupportedLanguage;
};

export default function SmartCropCalendarModal({
  isOpen,
  onClose,
  city,
  temp,
  humidity = 65,
  rainChance = 20,
  lang = "en",
}: Props) {
  const [selectedCropId, setSelectedCropId] = useState("paddy");
  const [daysAfterSowing, setDaysAfterSowing] = useState(45);

  if (!isOpen) return null;

  const currentCrop = CROPS_DATABASE.find((c) => c.id === selectedCropId) || CROPS_DATABASE[0];

  // Calculate Growing Degree Days (GDD)
  const dailyEffectiveGDD = Math.max(0, temp - currentCrop.baseTemp);
  const accumulatedGDD = Math.round(daysAfterSowing * (dailyEffectiveGDD || 15));

  // Determine stage based on GDD
  let currentStageIndex = 0;
  for (let i = 0; i < currentCrop.stages.length; i++) {
    if (accumulatedGDD >= currentCrop.stages[i].gddReq) {
      currentStageIndex = i;
    }
  }
  const currentStage = currentCrop.stages[Math.min(currentStageIndex, currentCrop.stages.length - 1)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-black/95 border border-yellow-400/40 shadow-2xl shadow-yellow-400/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/20 bg-yellow-400/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center text-yellow-400">
              <Sprout className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>Krishi Vigyan Kendra • Crop Phenology & GDD Engine</span>
              </h2>
              <p className="text-xs text-yellow-400 font-mono">
                {city} • Micro-Climate Agronomic Intelligence
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
        <div className="p-6 space-y-5 font-mono text-xs text-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/30">
          {/* Crop Selector Tabs */}
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2">
              Select Your Crop:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CROPS_DATABASE.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCropId(c.id)}
                  className={`p-2.5 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2 ${
                    selectedCropId === c.id
                      ? "bg-yellow-400/20 border-yellow-400 text-yellow-300 font-bold shadow-lg shadow-yellow-400/10"
                      : "bg-gray-950 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  <span className="text-xl">{c.icon}</span>
                  <div>
                    <span className="text-xs block leading-tight">{c.name}</span>
                    <span className="text-[9px] text-gray-400 block">{c.hindiName}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Sowing Duration Slider */}
          <div className="p-4 rounded-2xl bg-gray-950/80 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-white">Days After Sowing (DAS):</span>
              </div>
              <span className="text-base font-extrabold text-yellow-400">{daysAfterSowing} Days</span>
            </div>

            <input
              type="range"
              min="5"
              max="150"
              value={daysAfterSowing}
              onChange={(e) => setDaysAfterSowing(Number(e.target.value))}
              className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
            />

            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>Sowing (Day 0)</span>
              <span>Mid Season</span>
              <span>Harvest (Day 150)</span>
            </div>
          </div>

          {/* GDD & Phenological Stage Tracker */}
          <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-yellow-300 uppercase tracking-widest font-bold">
                Current Phenological Phase
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30">
                GDD: {accumulatedGDD} °C-days
              </span>
            </div>

            <p className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span>{currentStage.name}</span>
            </p>

            <div className="w-full bg-gray-900 rounded-full h-2 overflow-hidden border border-white/10">
              <div
                className="bg-gradient-to-r from-yellow-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (daysAfterSowing / 130) * 100)}%` }}
              />
            </div>
          </div>

          {/* Real-time Pest & Disease Warning */}
          <div className="space-y-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Weather-Triggered Disease & Pest Advisory:
            </span>
            {currentCrop.pests.map((pest, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-gray-950 border border-white/10 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white text-xs">{pest.name}</span>
                  </div>
                  <span className="text-[9px] text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Risk Active
                  </span>
                </div>

                <p className="text-[10px] text-gray-400">
                  <strong>Trigger:</strong> {pest.conditionTrigger}
                </p>

                <p className="text-[11px] text-emerald-300 bg-emerald-950/20 p-2 rounded-xl border border-emerald-500/20 leading-relaxed">
                  <strong>Action:</strong> {pest.remedy}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
