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
      <header className="relative z-30 flex items-center justify-between gap-3 md:gap-6 px-4 md:px-8 py-3 w-full bg-black/70 backdrop-blur-2xl border-b border-white/5 shrink-0 select-none">
        {/* Left: Brand Logo & Title */}
        <div
          onClick={() => {
            if (typeof window !== "undefined") window.location.reload();
          }}
          className="flex items-center gap-3 shrink-0 cursor-pointer group"
        >
          <img
            src="/logo.png"
            alt="WeatherGPT Logo"
            className="h-11 sm:h-12 md:h-14 w-auto max-w-[160px] md:max-w-[200px] object-contain drop-shadow-[0_2px_16px_rgba(250,204,21,0.35)] transition-transform group-hover:scale-105"
          />
          <div className="hidden lg:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-sm md:text-base font-extrabold tracking-tight text-white font-mono leading-none">
                Weather<span className="text-yellow-400">GPT</span>
              </span>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 uppercase tracking-wider font-mono">
                v2.0
              </span>
            </div>
            <span className="text-[9px] text-gray-400 font-mono tracking-wider truncate max-w-[140px]">
              {t.appSubtitle}
            </span>
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

        {/* Center: Operational Intelligence Action Links (Frameless, clean typography) */}
        <nav className="hidden 2xl:flex items-center gap-4 text-xs font-medium font-sans">
          <button
            onClick={onToggleForecast}
            className={`transition-all cursor-pointer flex items-center gap-1.5 py-1 px-1.5 ${
              isForecastOpen
                ? "text-yellow-400 font-bold border-b-2 border-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          >
            <Calendar className="w-4 h-4 text-yellow-400" />
            <span>{t.detailedForecast}</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("advisory")}
            className="text-gray-300 hover:text-yellow-300 transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-1.5"
          >
            <Activity className="w-4 h-4 text-yellow-400" />
            <span>{t.advisory}</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("radar")}
            className="text-gray-300 hover:text-cyan-300 transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-1.5"
          >
            <Radar className="w-4 h-4 text-cyan-400" />
            <span>{t.radar}</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("bulletin")}
            className="text-gray-300 hover:text-emerald-300 transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-1.5"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>{t.exportBulletin}</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("climate")}
            className="text-gray-300 hover:text-orange-300 transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-1.5"
          >
            <TrendingUp className="w-4 h-4 text-orange-400" />
            <span>{t.climateBenchmark}</span>
          </button>
        </nav>

        {/* Medium Screen Compact Quick Forecast Button */}
        <div className="hidden lg:flex 2xl:hidden items-center gap-2 text-xs font-sans">
          <button
            onClick={onToggleForecast}
            className={`transition-all cursor-pointer flex items-center gap-1.5 py-1 px-2 ${
              isForecastOpen
                ? "text-yellow-400 font-bold border-b-2 border-yellow-400"
                : "text-gray-300 hover:text-yellow-300"
            }`}
          >
            <Calendar className="w-4 h-4 text-yellow-400" />
            <span>{t.detailedForecast}</span>
          </button>

          {/* Quick Tools Dropdown for non-2xl viewports */}
          <div className="relative">
            <button
              onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
              className="p-1.5 text-gray-300 hover:text-yellow-300 transition cursor-pointer"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {toolsDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-2xl bg-black/95 backdrop-blur-2xl border border-yellow-400/30 shadow-2xl p-1.5 z-50 animate-fade-in font-sans text-xs space-y-1">
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

        {/* Right: Live Auto-Sync Indicator + Vernacular Picker (Clean & Frameless) */}
        <div className="flex items-center gap-3 shrink-0 ml-auto">
          {/* Live Auto-Refresh Engine Indicator */}
          {onManualRefresh && (
            <button
              onClick={onManualRefresh}
              disabled={isRefreshing}
              title="Live auto-refresh active. Click to sync fresh telemetry."
              className="hidden sm:flex items-center gap-1.5 py-1 px-1.5 text-[11px] font-sans text-gray-300 hover:text-white transition cursor-pointer"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="text-emerald-400 font-medium">Auto-Sync</span>
              <span className="text-gray-400">• {lastSyncedSecondsAgo}s</span>
              <RefreshCw className={`w-3 h-3 text-yellow-400 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          )}

          {/* Vernacular Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="py-1 px-2 text-white font-sans text-xs flex items-center gap-1.5 transition cursor-pointer hover:text-yellow-300"
            >
              <span>{currentLangObj.flag}</span>
              <span className="font-semibold text-yellow-300">{currentLangObj.nativeName}</span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {langDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-black/95 backdrop-blur-2xl border border-yellow-400/30 shadow-2xl p-1.5 z-50 animate-fade-in font-sans text-xs">
                <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-gray-400 border-b border-white/10 mb-1 font-heading">
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
        </div>
      </header>
    </>
  );
}
