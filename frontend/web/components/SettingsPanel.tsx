"use client";

import React, { useState } from "react";
import { MapPin, Navigation, X, Loader2 } from "lucide-react";
import { reverseGeocode } from "@/lib/api";

export type Preferences = {
  defaultLocation: string;
  language: string;
  occupation: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  initialPreferences: Preferences;
  onSave: (prefs: Preferences) => void;
};

const LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Bengali",
  "Marathi",
  "Gujarati",
  "Kannada",
  "Malayalam",
  "Punjabi",
];

const OCCUPATIONS = [
  "General Public",
  "Farmer",
  "Disaster Manager",
  "Pilot / Aviation",
  "Researcher",
];

export default function SettingsPanel({
  isOpen,
  onClose,
  initialPreferences,
  onSave,
}: Props) {
  const [prefs, setPrefs] = useState<Preferences>(initialPreferences);
  const [locating, setLocating] = useState(false);

  if (!isOpen) return null;

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const geo = await reverseGeocode(latitude, longitude);
          const detectedCity = geo.city || "Delhi";
          setPrefs((p) => ({
            ...p,
            defaultLocation: detectedCity,
          }));
        } catch {
          setPrefs((p) => ({
            ...p,
            defaultLocation: `${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`,
          }));
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        alert("Location permission denied or unavailable.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = () => {
    onSave(prefs);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-black/90 backdrop-blur-2xl
                   border border-yellow-400/30 p-6 md:p-7 shadow-2xl shadow-black text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-yellow-400/20">
          <h2 className="text-base md:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span className="text-yellow-400">•</span>
            <span>Weather Intelligence Settings</span>
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-yellow-400/20 hover:text-yellow-400 flex items-center justify-center text-gray-400 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 font-mono">
          {/* Default Location */}
          <div>
            <label className="text-xs text-yellow-400/90 font-semibold">Default Location</label>
            <div className="flex gap-2 mt-1.5">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-yellow-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={prefs.defaultLocation}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, defaultLocation: e.target.value }))
                  }
                  placeholder="e.g. Mumbai, Delhi, Bengaluru"
                  className="w-full bg-gray-950/90 border border-yellow-400/30 rounded-xl
                             pl-9 pr-3 py-2.5 text-xs md:text-sm outline-none placeholder-gray-500
                             focus:border-yellow-400 transition-colors text-white"
                />
              </div>
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="text-xs px-3.5 py-2.5 rounded-xl bg-yellow-400/15 border border-yellow-400/40 text-yellow-300
                           hover:bg-yellow-400/25 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {locating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Navigation className="w-3.5 h-3.5 text-yellow-400" />
                )}
                <span>{locating ? "Locating..." : "Use GPS"}</span>
              </button>
            </div>
          </div>

          {/* Preferred Language */}
          <div>
            <label className="text-xs text-yellow-400/90 font-semibold">Preferred Language</label>
            <select
              value={prefs.language}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, language: e.target.value }))
              }
              className="w-full mt-1.5 bg-gray-950/90 border border-yellow-400/30 rounded-xl px-3.5 py-2.5 text-xs md:text-sm outline-none text-white focus:border-yellow-400"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l} className="bg-gray-950 text-white">
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Occupation / Persona */}
          <div>
            <label className="text-xs text-yellow-400/90 font-semibold">Occupation / Role</label>
            <select
              value={prefs.occupation}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, occupation: e.target.value }))
              }
              className="w-full mt-1.5 bg-gray-950/90 border border-yellow-400/30 rounded-xl px-3.5 py-2.5 text-xs md:text-sm outline-none text-white focus:border-yellow-400"
            >
              {OCCUPATIONS.map((o) => (
                <option key={o} value={o} className="bg-gray-950 text-white">
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Save Button */}
        <button
          onClick={handleSave}
          className="w-full mt-6 py-3 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-950
                     font-bold text-xs md:text-sm transition-all shadow-lg shadow-yellow-400/20 cursor-pointer font-mono"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
