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
} from "lucide-react";
import { SupportedLanguage } from "@/lib/translations";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  lat: number;
  lng: number;
  lang?: SupportedLanguage;
};

export default function SatelliteViewerModal({
  isOpen,
  onClose,
  city,
  lat,
  lng,
  lang = "en",
}: Props) {
  const [activeChannel, setActiveChannel] = useState<"tir" | "wv" | "vis" | "ctbt">("tir");

  if (!isOpen) return null;

  const channelDescriptions: Record<string, { title: string; desc: string; url: string }> = {
    tir: {
      title: "TIR-1 (Thermal Infrared 10.8 µm)",
      desc: "Measures cloud-top brightness temperature. Essential for tracking deep convective clouds, thunderstorm anvils, and cyclone eyes 24/7.",
      url: "https://mausam.imd.gov.in/imd_latest/contents/img/insat_tir.gif",
    },
    wv: {
      title: "Water Vapor Channel (6.8 µm)",
      desc: "Captures upper-tropospheric humidity streams, dry intrusions, and jet streams driving monsoon depressions.",
      url: "https://mausam.imd.gov.in/imd_latest/contents/img/insat_wv.gif",
    },
    vis: {
      title: "Visible Band (0.65 µm)",
      desc: "High-resolution true-color albedo mapping of low cloud formations, fog, and snow cover during daylight.",
      url: "https://mausam.imd.gov.in/imd_latest/contents/img/insat_vis.gif",
    },
    ctbt: {
      title: "Cloud Top Brightness (CTBT Colorized)",
      desc: "Color-enhanced convective height analysis. Red and violet hues indicate intense cloudburst potential.",
      url: "https://mausam.imd.gov.in/imd_latest/contents/img/insat_rgb.gif",
    },
  };

  const currentCh = channelDescriptions[activeChannel];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-3xl bg-black/95 border border-yellow-400/40 shadow-2xl shadow-yellow-400/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/20 bg-yellow-400/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center text-yellow-400">
              <Satellite className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>ISRO INSAT-3DR & MOSDAC Geostationary Feed</span>
              </h2>
              <p className="text-xs text-yellow-400 font-mono">
                Subcontinent Sector • 74°E Geostationary Orbit • 4km Res
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

        {/* Channel Selector Bar */}
        <div className="flex border-b border-white/10 bg-gray-950/80 px-6 py-2.5 gap-2 overflow-x-auto scrollbar-none font-mono text-xs">
          <button
            onClick={() => setActiveChannel("tir")}
            className={`px-3 py-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
              activeChannel === "tir"
                ? "bg-yellow-400/20 border-yellow-400 text-yellow-300 font-bold"
                : "bg-gray-900 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            TIR-1 Thermal IR
          </button>

          <button
            onClick={() => setActiveChannel("wv")}
            className={`px-3 py-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
              activeChannel === "wv"
                ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold"
                : "bg-gray-900 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            Water Vapor (WV)
          </button>

          <button
            onClick={() => setActiveChannel("vis")}
            className={`px-3 py-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
              activeChannel === "vis"
                ? "bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold"
                : "bg-gray-900 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            Visible (VIS)
          </button>

          <button
            onClick={() => setActiveChannel("ctbt")}
            className={`px-3 py-1.5 rounded-xl border transition cursor-pointer shrink-0 ${
              activeChannel === "ctbt"
                ? "bg-orange-500/20 border-orange-400 text-orange-300 font-bold"
                : "bg-gray-900 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            CTBT Colorized
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 font-mono text-xs text-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/30">
          <div className="p-3.5 rounded-2xl bg-gray-950/90 border border-white/10 space-y-1">
            <span className="text-yellow-300 font-bold block">{currentCh.title}</span>
            <p className="text-[11px] text-gray-400 leading-relaxed">{currentCh.desc}</p>
          </div>

          {/* Interactive Satellite Imagery Simulator */}
          <div className="relative w-full h-80 rounded-2xl bg-gray-950 border border-white/10 overflow-hidden flex items-center justify-center">
            {/* Background Synoptic Earth Map */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/40 via-black to-black flex items-center justify-center">
              <div className="relative w-64 h-64 rounded-full border border-yellow-400/30 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border border-cyan-400/20 animate-pulse" />
                <span className="text-xs font-bold text-yellow-300 tracking-widest uppercase">
                  INSAT-3DR SCAN
                </span>
              </div>
            </div>

            {/* Live Station Centroid Target */}
            <div className="z-10 bg-black/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-yellow-400/40 text-center space-y-1">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest block">
                Target Centroid
              </span>
              <span className="text-sm font-extrabold text-white block">{city.toUpperCase()}</span>
              <span className="text-[10px] text-yellow-400 block">
                {lat.toFixed(2)}°N, {lng.toFixed(2)}°E
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
