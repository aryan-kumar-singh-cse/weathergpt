"use client";

import React, { useState } from "react";
import SettingsPanel, { Preferences } from "./SettingsPanel";
import LocationSearchBar from "./LocationSearchBar";
import {
  Cloud,
  User,
  Calendar,
  Activity,
  Radar,
  FileText,
  TrendingUp,
  ChevronDown,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import {
  SupportedLanguage,
  LANGUAGE_OPTIONS,
  TRANSLATIONS,
} from "@/lib/translations";

type Props = {
  preferences: Preferences;
  onSavePreferences: (prefs: Preferences) => void;
  activeRole?: string;
  isForecastOpen?: boolean;
  onToggleForecast?: () => void;
  onSelectNavOption?: (option: string) => void;
  onSelectSearchCity: (city: string, coords?: { lat: number; lng: number }) => void;
  currentCity?: string;
  onUseCurrentLocation?: () => void;
  isLocating?: boolean;
  selectedLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onManualRefresh?: () => void;
  isRefreshing?: boolean;
  lastSyncedSecondsAgo?: number;
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
  onUseCurrentLocation,
  isLocating,
  selectedLanguage = "en",
  onSelectLanguage,
  onManualRefresh,
  isRefreshing = false,
  lastSyncedSecondsAgo = 5,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
  const currentLangObj = LANGUAGE_OPTIONS.find((l) => l.code === selectedLanguage) || LANGUAGE_OPTIONS[0];

  return (
    <>
      <header className="relative z-30 flex items-center justify-between gap-2 md:gap-4 px-4 md:px-8 py-2.5 w-full bg-black/80 backdrop-blur-2xl border-b border-white/10 shrink-0 select-none">
        {/* Left: Brand & Tagline */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-2xl bg-black/90 backdrop-blur-xl border border-yellow-400/40 flex items-center justify-center shadow-lg text-yellow-400">
            <Cloud className="w-4 h-4 fill-yellow-400/20" />
          </div>
          <div>
            <span className="text-base md:text-lg font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 via-yellow-400 to-white bg-clip-text text-transparent">
              {t.appTitle || "WeatherGPT"}
            </span>
            <div className="hidden sm:flex items-center gap-1 text-[9px] font-mono text-gray-400">
              <span className="text-yellow-400">•</span>
              <span>{t.appSubtitle || "Meteorological Intelligence"}</span>
            </div>
          </div>
        </div>

        {/* Center-Left: Global Device-Native Search Bar */}
        <div className="w-44 sm:w-60 md:w-72 lg:w-80 shrink-0">
          <LocationSearchBar
            onSelectCity={onSelectSearchCity}
            currentCity={currentCity}
            onUseCurrentLocation={onUseCurrentLocation}
            isLocating={isLocating}
          />
        </div>

        {/* Center: Operational Intelligence Action Buttons (Responsive) */}
        <nav className="hidden 2xl:flex items-center gap-1.5 text-xs font-medium text-white/80 font-mono">
          <button
            onClick={onToggleForecast}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              isForecastOpen
                ? "bg-yellow-400 text-gray-950 border-yellow-400 shadow-lg shadow-yellow-400/20 font-bold"
                : "bg-black/60 border-yellow-400/35 text-yellow-400 hover:bg-yellow-400/10"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.detailedForecast}</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("advisory")}
            className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400/30 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-yellow-400" />
            <span>{t.advisory}</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("radar")}
            className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400/30 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Radar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.radar}</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("bulletin")}
            className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400/30 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.exportBulletin}</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("climate")}
            className="px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400/30 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
            <span>{t.climateBenchmark}</span>
          </button>
        </nav>

        {/* Medium Screen Compact Quick Forecast Button */}
        <div className="hidden lg:flex 2xl:hidden items-center gap-1.5 font-mono text-xs">
          <button
            onClick={onToggleForecast}
            className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
              isForecastOpen
                ? "bg-yellow-400 text-gray-950 border-yellow-400 font-bold"
                : "bg-black/60 border-yellow-400/35 text-yellow-400 hover:bg-yellow-400/10"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.detailedForecast}</span>
          </button>

          {/* Quick Tools Dropdown for non-2xl viewports */}
          <div className="relative">
            <button
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              className="p-2 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400 text-gray-300 hover:text-white transition cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {toolsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-black/95 backdrop-blur-2xl border border-yellow-400/30 shadow-2xl p-1.5 z-50 animate-fade-in font-mono text-xs space-y-1">
                <button
                  onClick={() => {
                    onSelectNavOption?.("advisory");
                    setToolsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-gray-200 flex items-center gap-2 cursor-pointer"
                >
                  <Activity className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{t.advisory}</span>
                </button>
                <button
                  onClick={() => {
                    onSelectNavOption?.("radar");
                    setToolsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-gray-200 flex items-center gap-2 cursor-pointer"
                >
                  <Radar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{t.radar}</span>
                </button>
                <button
                  onClick={() => {
                    onSelectNavOption?.("bulletin");
                    setToolsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-gray-200 flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t.exportBulletin}</span>
                </button>
                <button
                  onClick={() => {
                    onSelectNavOption?.("climate");
                    setToolsDropdownOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-white/10 text-gray-200 flex items-center gap-2 cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                  <span>{t.climateBenchmark}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Auto-Sync Indicator + Vernacular Picker + Profile Button (Firmly pinned on the right) */}
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {/* Live Auto-Refresh Engine Indicator */}
          {onManualRefresh && (
            <button
              onClick={onManualRefresh}
              disabled={isRefreshing}
              title="Live auto-refresh active. Click to sync fresh telemetry."
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-950/90 border border-white/10 hover:border-yellow-400/40 text-[10px] font-mono text-gray-300 hover:text-white transition cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="text-emerald-400 font-bold">Auto-Sync</span>
              <span className="text-gray-400">• {lastSyncedSecondsAgo}s</span>
              <RefreshCw className={`w-3 h-3 text-yellow-400 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          {/* Vernacular Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="px-2.5 py-1.5 rounded-xl bg-black/85 border border-yellow-400/35 hover:border-yellow-400 text-white font-mono text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
            >
              <span>{currentLangObj.flag}</span>
              <span className="font-bold text-yellow-300">{currentLangObj.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-black/95 backdrop-blur-2xl border border-yellow-400/30 shadow-2xl p-1.5 z-50 animate-fade-in font-mono text-xs">
                <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-gray-400 border-b border-white/10 mb-1">
                  Select Vernacular
                </div>
                {LANGUAGE_OPTIONS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      onSelectLanguage(l.code);
                      setLangDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                      selectedLanguage === l.code
                        ? "bg-yellow-400/20 text-yellow-300 font-bold border border-yellow-400/30"
                        : "hover:bg-white/10 text-gray-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{l.flag}</span>
                      <span>{l.nativeName}</span>
                    </div>
                    <span className="text-[10px] text-gray-500">{l.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile / Settings Button removed as requested to keep UI clutter-free on main page */}
        </div>
      </header>
    </>
  );
}
