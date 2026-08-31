"use client";

import React, { useState } from "react";
import SettingsPanel, { Preferences } from "./SettingsPanel";
import LocationSearchBar from "./LocationSearchBar";
import { Cloud, User, Calendar, Activity, Bell, Compass } from "lucide-react";

type Props = {
  preferences: Preferences;
  onSavePreferences: (prefs: Preferences) => void;
  activeRole?: string;
  isForecastOpen?: boolean;
  onToggleForecast?: () => void;
  onSelectNavOption?: (option: string) => void;
  onSelectSearchCity: (city: string) => void;
  currentCity?: string;
};

export default function Header({
  preferences,
  onSavePreferences,
  activeRole = "General Public",
  isForecastOpen = false,
  onToggleForecast,
  onSelectNavOption,
  onSelectSearchCity,
  currentCity,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-4 px-6 md:px-10 py-4.5">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-2xl bg-black/70 backdrop-blur-xl border border-yellow-400/40 flex items-center justify-center shadow-lg text-yellow-400">
            <Cloud className="w-5 h-5 fill-yellow-400/20" />
          </div>
          <div>
            <span className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 via-yellow-400 to-white bg-clip-text text-transparent">
              WeatherGPT
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-gray-400">
              <span className="text-yellow-400">•</span>
              <span>Meteorological Intelligence</span>
            </div>
          </div>
        </div>

        {/* Global City Search Bar */}
        <div className="flex-1 max-w-sm order-3 sm:order-2">
          <LocationSearchBar
            onSelectCity={onSelectSearchCity}
            currentCity={currentCity}
          />
        </div>

        {/* Center Nav Links / Action Cards */}
        <nav className="hidden lg:flex items-center gap-2.5 text-xs font-medium text-white/80 font-mono order-2 sm:order-3">
          <button
            onClick={() => onSelectNavOption?.("overview")}
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400/30 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-gray-400" />
            <span>Overview</span>
          </button>

          {/* Detailed Forecast Card (Toggle open/collapse) */}
          <button
            onClick={onToggleForecast}
            className={`px-3.5 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              isForecastOpen
                ? "bg-yellow-400 text-gray-950 border-yellow-400 shadow-lg shadow-yellow-400/20 font-bold"
                : "bg-black/60 border-yellow-400/40 text-yellow-400 hover:bg-yellow-400/10"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Detailed Forecast</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("advisory")}
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400/30 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-gray-400" />
            <span>Advisory</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("emergency")}
            className="px-3 py-2 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400/30 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-gray-400" />
            <span>Alerts</span>
          </button>
        </nav>

        {/* User Profile & Settings Trigger */}
        <div className="flex items-center gap-3 order-2 sm:order-4">
          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-xs font-semibold text-white truncate max-w-[120px]">
              {currentCity || preferences.defaultLocation || "Live GPS"}
            </span>
            <span className="text-[10px] text-yellow-400 font-mono">
              {preferences.occupation || activeRole}
            </span>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Profile and Settings"
            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-black/70 backdrop-blur-xl border border-yellow-400/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-400/20 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </header>

      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialPreferences={preferences}
        onSave={onSavePreferences}
      />
    </>
  );
}
