"use client";

import React, { useState } from "react";
import SettingsPanel, { Preferences } from "./SettingsPanel";
import { Cloud, User, Sparkles } from "lucide-react";

type Props = {
  preferences: Preferences;
  onSavePreferences: (prefs: Preferences) => void;
  activeRole?: string;
  onSelectNavOption?: (option: string) => void;
};

export default function Header({
  preferences,
  onSavePreferences,
  activeRole = "General Public",
  onSelectNavOption,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <header className="relative z-20 flex items-center justify-between px-6 md:px-10 py-5">
        {/* Brand */}
        <div className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg text-yellow-400">
            <Cloud className="w-6 h-6 fill-yellow-400/30" />
          </div>
          <div>
            <span className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-white/90 to-white/70 bg-clip-text text-transparent">
              WeatherGPT
            </span>
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono text-white/50">
              <Sparkles className="w-3 h-3 text-yellow-400" />
              <span>AI Meteorological Intelligence</span>
            </div>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/80 font-mono">
          <button
            onClick={() => onSelectNavOption?.("overview")}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Overview
          </button>
          <button
            onClick={() => onSelectNavOption?.("forecast")}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Forecast
          </button>
          <button
            onClick={() => onSelectNavOption?.("advisory")}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Advisory
          </button>
          <button
            onClick={() => onSelectNavOption?.("emergency")}
            className="hover:text-white transition-colors cursor-pointer"
          >
            Alerts
          </button>
        </nav>

        {/* User Profile & Settings Trigger */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-xs font-semibold text-white/90 truncate max-w-[120px]">
              {preferences.defaultLocation || "Live GPS"}
            </span>
            <span className="text-[10px] text-yellow-400/90 font-mono">
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
