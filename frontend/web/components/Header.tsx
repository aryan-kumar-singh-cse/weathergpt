"use client";

import React, { useState } from "react";
import SettingsPanel, { Preferences } from "./SettingsPanel";
import LocationSearchBar from "./LocationSearchBar";
import {
  Cloud,
  User,
  Calendar,
  Activity,
  Bell,
  Compass,
  Radar,
  FileText,
  TrendingUp,
  Globe,
  ChevronDown,
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
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const t = TRANSLATIONS[selectedLanguage] || TRANSLATIONS.en;
  const currentLangObj = LANGUAGE_OPTIONS.find((l) => l.code === selectedLanguage) || LANGUAGE_OPTIONS[0];

  return (
    <>
      <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 px-4 md:px-8 py-3.5 border-b border-white/5 bg-black/40 backdrop-blur-md">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-2.5 text-white">
          <div className="w-9 h-9 rounded-2xl bg-black/80 backdrop-blur-xl border border-yellow-400/40 flex items-center justify-center shadow-lg text-yellow-400">
            <Cloud className="w-4 h-4 fill-yellow-400/20" />
          </div>
          <div>
            <span className="text-lg md:text-xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-300 via-yellow-400 to-white bg-clip-text text-transparent">
              {t.appTitle || "WeatherGPT"}
            </span>
            <div className="hidden sm:flex items-center gap-1 text-[9px] font-mono text-gray-400">
              <span className="text-yellow-400">•</span>
              <span>{t.appSubtitle || "Meteorological Intelligence"}</span>
            </div>
          </div>
        </div>

        {/* Global Device-Native City & District Search Bar */}
        <div className="flex-1 max-w-xs md:max-w-sm order-3 sm:order-2">
          <LocationSearchBar
            onSelectCity={onSelectSearchCity}
            currentCity={currentCity}
            onUseCurrentLocation={onUseCurrentLocation}
            isLocating={isLocating}
          />
        </div>

        {/* Center Nav Links / Operational Intelligence Triggers */}
        <nav className="hidden xl:flex items-center gap-1.5 text-xs font-medium text-white/80 font-mono order-2 sm:order-3">
          {/* Detailed Forecast Card (Toggle open/collapse) */}
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
            className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400/30 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Activity className="w-3.5 h-3.5 text-yellow-400" />
            <span>{t.advisory}</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("radar")}
            className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400/30 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <Radar className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t.radar}</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("bulletin")}
            className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400/30 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.exportBulletin}</span>
          </button>

          <button
            onClick={() => onSelectNavOption?.("climate")}
            className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/10 hover:border-yellow-400/30 text-gray-300 hover:text-white transition cursor-pointer flex items-center gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
            <span>Climate Benchmark</span>
          </button>
        </nav>

        {/* Vernacular Language Picker & User Profile */}
        <div className="flex items-center gap-2.5 order-2 sm:order-4">
          {/* Vernacular Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="px-2.5 py-1.5 rounded-xl bg-black/75 border border-yellow-400/35 hover:border-yellow-400 text-white font-mono text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
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

          <div className="hidden md:flex flex-col items-end text-right">
            <span className="text-xs font-semibold text-white truncate max-w-[110px]">
              {currentCity || preferences.defaultLocation || "Live GPS"}
            </span>
            <span className="text-[10px] text-yellow-400 font-mono">
              {preferences.occupation || activeRole}
            </span>
          </div>

          <button
            onClick={() => setSettingsOpen(true)}
            aria-label="Profile and Settings"
            className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/70 backdrop-blur-xl border border-yellow-400/30 flex items-center justify-center text-yellow-400 hover:bg-yellow-400/20 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
          >
            <User className="w-4 h-4" />
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
