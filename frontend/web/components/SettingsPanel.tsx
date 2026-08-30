"use client";

import React, { useState } from "react";
import { MapPin, Navigation, Check, X, Loader2 } from "lucide-react";
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-gray-950/70 backdrop-blur-2xl
                   border border-white/20 p-6 md:p-7 shadow-2xl text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
          <h2 className="text-lg font-bold tracking-tight">Weather Intelligence Settings</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition p-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Default Location */}
          <div>
            <label className="text-xs font-mono text-white/70">Default Location</label>
            <div className="flex gap-2 mt-1.5">
              <div className="relative flex-1">
                <MapPin className="w-4 h-4 text-yellow-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={prefs.defaultLocation}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, defaultLocation: e.target.value }))
                  }
                  placeholder="e.g. Mumbai, Delhi, Bengaluru"
                  className="w-full bg-white/5 border border-white/20 rounded-xl
                             pl-9 pr-3 py-2.5 text-xs md:text-sm outline-none placeholder-white/40
                             focus:border-yellow-400/50 transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={locating}
                className="text-xs px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20
                           hover:bg-white/20 transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
            <label className="text-xs font-mono text-white/70">Preferred Language</label>
            <select
              value={prefs.language}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, language: e.target.value }))
              }
              className="w-full mt-1.5 bg-gray-900/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs md:text-sm outline-none text-white focus:border-yellow-400/50"
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l} className="bg-gray-900 text-white">
                  {l}
                </option>
              ))}
            </select>
          </div>

          {/* Occupation / Persona */}
          <div>
            <label className="text-xs font-mono text-white/70">Occupation / Role</label>
            <select
              value={prefs.occupation}
              onChange={(e) =>
                setPrefs((p) => ({ ...p, occupation: e.target.value }))
              }
              className="w-full mt-1.5 bg-gray-900/80 border border-white/20 rounded-xl px-3.5 py-2.5 text-xs md:text-sm outline-none text-white focus:border-yellow-400/50"
            >
              {OCCUPATIONS.map((o) => (
                <option key={o} value={o} className="bg-gray-900 text-white">
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
                     font-bold text-xs md:text-sm transition-all shadow-lg hover:shadow-yellow-400/20 cursor-pointer"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
}
