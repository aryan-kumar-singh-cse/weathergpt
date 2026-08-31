"use client";

import React, { useState } from "react";
import SettingsPanel, { Preferences } from "./SettingsPanel";
import { Cloud, User, Calendar, Activity, Bell, Compass } from "lucide-react";

type Props = {
  preferences: Preferences;
  onSavePreferences: (prefs: Preferences) => void;
  activeRole?: string;
  isForecastOpen?: boolean;
  onToggleForecast?: () => void;
  onSelectNavOption?: (option: string) => void;
};

export default function Header({
  preferences,
  onSavePreferences,
  activeRole = "General Public",
  isForecastOpen = false,
  onToggleForecast,
  onSelectNavOption,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5">
        {/* Brand */}
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg text-white">
            <Cloud className="w-5 h-5 text-white/90" />
          </div>
          <div>
            <span className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              WeatherGPT
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-white/50">
              <span>Meteorological Intelligence</span>
            </div>
          </div>
        </div>

        {/* Center Nav Links / Action Cards */}
        <nav className="hidden md:flex items-center gap-4 text-xs font-medium text-white/80 font-mono">
          <button
            onClick={() => onSelectNavOption?.("overview")}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5 text-white/70" />
            <span>Overview</span>
          </button>

          {/* Detailed Forecast Card (Toggle open/collapse) */}
          <button
            onClick={onToggleForecast}
            className={`px-4 py-2 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${
              isForecastOpen
                ? "bg-white/25 border-white/40 text-white shadow-lg font-bold"
                : "bg-white/10 border-white/20 text-white/90 hover:bg-white/15"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-white" />
            <span>Detailed Forecast</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("advisory")}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-white/70" />
            <span>Advisory</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("emergency")}
            className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Bell className="w-3.5 h-3.5 text-white/70" />
            <span>Alerts</span>
          </button>
        </nav>

        {/* User Profile & Settings Trigger */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-semibold text-white/90 truncate max-w-[130px]">
              {preferences.defaultLocation || "Live GPS"}
            </span>
            <span className="text-[10px] text-white/60 font-mono">
              {preferences.occupation || activeRole}
            </span>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Profile and Settings"
            className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
          >
            <User className="w-5 h-5 text-white/90" />
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
