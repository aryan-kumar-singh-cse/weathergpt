"use client";

import React, { useState } from "react";
import {
  User,
  MapPin,
  Navigation,
  X,
  Loader2,
  Sprout,
  ShieldAlert,
  Plane,
  Building2,
  FlaskConical,
  Smartphone,
  Bell,
  Volume2,
  CheckCircle2,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { reverseGeocode } from "@/lib/api";
import { toast } from "react-hot-toast";

export type Preferences = {
  name?: string;
  defaultLocation: string;
  language: string;
  occupation: string;
  phone?: string;
  selectedCrops?: string[];
  soilType?: string;
  irrigationType?: string;
  alertLightning?: boolean;
  alertHeavyRain?: boolean;
  alertSevereAqi?: boolean;
  alertHeatwave?: boolean;
  voiceReadout?: boolean;
  tempUnit?: "C" | "F";
  windUnit?: "kmh" | "knots" | "ms";
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

const ROLES = [
  { id: "Farmer", label: "Krishi Mitra (Farmer)", icon: Sprout, color: "text-emerald-400 border-emerald-500/40 bg-emerald-950/30" },
  { id: "Disaster Manager", label: "Aapda Mitra (NDMA)", icon: ShieldAlert, color: "text-red-400 border-red-500/40 bg-red-950/30" },
  { id: "Pilot / Aviation", label: "Aviator / Drone Pilot", icon: Plane, color: "text-sky-400 border-sky-500/40 bg-sky-950/30" },
  { id: "General Public", label: "Citizen / Urban Health", icon: Building2, color: "text-yellow-400 border-yellow-500/40 bg-yellow-950/30" },
  { id: "Researcher", label: "Met Researcher / Scientist", icon: FlaskConical, color: "text-purple-400 border-purple-500/40 bg-purple-950/30" },
];

const CROPS_LIST = [
  "Paddy (Rice)",
  "Wheat",
  "Mustard",
  "Cotton",
  "Sugarcane",
  "Maize",
  "Potato",
  "Tomato",
  "Pulses / Gram",
  "Soybean",
];

const SOIL_TYPES = [
  "Alluvial Soil (Indo-Gangetic Plains)",
  "Black Cotton Soil (Deccan Trap)",
  "Red & Yellow Soil",
  "Laterite Soil",
  "Clayey Loam",
  "Sandy Loam",
];

export default function SettingsPanel({
  isOpen,
  onClose,
  initialPreferences,
  onSave,
}: Props) {
  const [activeTab, setActiveTab] = useState<"identity" | "sector" | "alerts" | "preferences">("identity");
  const [prefs, setPrefs] = useState<Preferences>({
    name: initialPreferences.name || "Aryan Kumar Singh",
    defaultLocation: initialPreferences.defaultLocation || "Sahibabad, Ghaziabad",
    language: initialPreferences.language || "English",
    occupation: initialPreferences.occupation || "General Public",
    phone: initialPreferences.phone || "+91 98765 43210",
    selectedCrops: initialPreferences.selectedCrops || ["Wheat", "Mustard"],
    soilType: initialPreferences.soilType || "Alluvial Soil (Indo-Gangetic Plains)",
    irrigationType: initialPreferences.irrigationType || "Canal / Borewell",
    alertLightning: initialPreferences.alertLightning ?? true,
    alertHeavyRain: initialPreferences.alertHeavyRain ?? true,
    alertSevereAqi: initialPreferences.alertSevereAqi ?? true,
    alertHeatwave: initialPreferences.alertHeatwave ?? true,
    voiceReadout: initialPreferences.voiceReadout ?? true,
    tempUnit: initialPreferences.tempUnit || "C",
    windUnit: initialPreferences.windUnit || "kmh",
  });

  const [locating, setLocating] = useState(false);

  if (!isOpen) return null;

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const geo = await reverseGeocode(latitude, longitude);
          const detectedCity = geo.city || "Sahibabad, Ghaziabad";
          setPrefs((p) => ({
            ...p,
            defaultLocation: detectedCity,
          }));
          toast.success(`Location set to ${detectedCity}`);
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
        toast.error("Location permission denied or unavailable.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleCrop = (crop: string) => {
    setPrefs((p) => {
      const current = p.selectedCrops || [];
      if (current.includes(crop)) {
        return { ...p, selectedCrops: current.filter((c) => c !== crop) };
      } else {
        return { ...p, selectedCrops: [...current, crop] };
      }
    });
  };

  const handleSave = () => {
    onSave(prefs);
    toast.success("Profile & Sector preferences saved!");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in font-mono"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-black/95 backdrop-blur-2xl border border-yellow-400/35 p-6 md:p-7 shadow-2xl shadow-black text-white max-h-[90vh] flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-yellow-400/20">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-yellow-400/15 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base md:text-lg font-bold text-white tracking-tight">
                  User Profile & Sector Intelligence
                </h3>
                <p className="text-[11px] text-gray-400">
                  SIH26068 Multi-Sector Role Customization
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-yellow-400/20 hover:text-yellow-400 text-gray-400 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-4 grid grid-cols-4 gap-1 p-1 rounded-2xl bg-gray-950/80 border border-white/10 text-center text-xs font-semibold">
            <button
              onClick={() => setActiveTab("identity")}
              className={`py-2 rounded-xl transition cursor-pointer ${
                activeTab === "identity"
                  ? "bg-yellow-400 text-gray-950 font-bold shadow-md shadow-yellow-400/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              👤 Identity
            </button>
            <button
              onClick={() => setActiveTab("sector")}
              className={`py-2 rounded-xl transition cursor-pointer ${
                activeTab === "sector"
                  ? "bg-yellow-400 text-gray-950 font-bold shadow-md shadow-yellow-400/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              🌾 Sector
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`py-2 rounded-xl transition cursor-pointer ${
                activeTab === "alerts"
                  ? "bg-yellow-400 text-gray-950 font-bold shadow-md shadow-yellow-400/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              📲 Alerts
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`py-2 rounded-xl transition cursor-pointer ${
                activeTab === "preferences"
                  ? "bg-yellow-400 text-gray-950 font-bold shadow-md shadow-yellow-400/20"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              ⚙️ Voice
            </button>
          </div>
        </div>

        {/* Tab Contents */}
        <div className="my-4 overflow-y-auto max-h-[50vh] pr-1 space-y-4">
          {/* TAB 1: IDENTITY & ROLE */}
          {activeTab === "identity" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Full Name / Operator ID
                </label>
                <input
                  type="text"
                  value={prefs.name}
                  onChange={(e) => setPrefs({ ...prefs, name: e.target.value })}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-white/15 text-sm text-white focus:border-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Primary Location / District
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prefs.defaultLocation}
                    onChange={(e) => setPrefs({ ...prefs, defaultLocation: e.target.value })}
                    placeholder="e.g. Sahibabad, Ghaziabad"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-950 border border-white/15 text-sm text-white focus:border-yellow-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={useCurrentLocation}
                    disabled={locating}
                    className="px-3.5 py-2.5 rounded-xl bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/40 text-yellow-300 transition flex items-center gap-1.5 text-xs font-bold shrink-0 cursor-pointer"
                  >
                    {locating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Navigation className="w-3.5 h-3.5" />}
                    <span>GPS</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">
                  Select Sector Operational Role
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {ROLES.map((role) => {
                    const isSelected = prefs.occupation === role.id;
                    const Icon = role.icon;
                    return (
                      <button
                        key={role.id}
                        type="button"
                        onClick={() => setPrefs({ ...prefs, occupation: role.id })}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-left cursor-pointer ${
                          isSelected
                            ? `${role.color} border-current shadow-md`
                            : "bg-gray-950 border-white/10 hover:border-white/25 text-gray-300"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5" />
                          <div>
                            <span className="text-xs font-bold block text-white">{role.label}</span>
                            <span className="text-[10px] text-gray-400">
                              {role.id === "Farmer"
                                ? "Tailored Krishi Vigyan Kendra crop advisories & GDD tracking"
                                : role.id === "Disaster Manager"
                                ? "Real-time NDMA lightning alerts & relief camp coordination"
                                : role.id === "Pilot / Aviation"
                                ? "METAR, crosswinds, and convective storm ceilings"
                                : "Personalized AQI, UV index, and daily weather insights"}
                            </span>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-yellow-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SECTOR CUSTOMIZATION */}
          {activeTab === "sector" && (
            <div className="space-y-4">
              {prefs.occupation === "Farmer" ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-emerald-400 mb-1.5">
                      🌾 Select Your Sown / Planned Crops (Multi-Select)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CROPS_LIST.map((crop) => {
                        const isChecked = (prefs.selectedCrops || []).includes(crop);
                        return (
                          <button
                            key={crop}
                            type="button"
                            onClick={() => toggleCrop(crop)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                              isChecked
                                ? "bg-emerald-950/60 border-emerald-400 text-emerald-300"
                                : "bg-gray-950 border-white/10 text-gray-400 hover:text-white"
                            }`}
                          >
                            <span>{crop}</span>
                            {isChecked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-300 mb-1">
                      Farmland Soil Classification
                    </label>
                    <select
                      value={prefs.soilType}
                      onChange={(e) => setPrefs({ ...prefs, soilType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-white/15 text-xs text-white focus:border-yellow-400 focus:outline-none"
                    >
                      {SOIL_TYPES.map((soil) => (
                        <option key={soil} value={soil} className="bg-gray-900">
                          {soil}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : prefs.occupation === "Disaster Manager" ? (
                <div className="p-4 rounded-2xl bg-red-950/40 border border-red-500/30 text-white space-y-3">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs">
                    <ShieldAlert className="w-4 h-4" />
                    <span>NDMA Incident Command Protocol</span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Your account is configured for direct emergency broadcast, flood contour mapping, and shelter radius calculation.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                      <span className="text-gray-400 block text-[10px]">Response Radius</span>
                      <span className="font-bold text-yellow-400">25 km Grid</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-black/60 border border-white/10">
                      <span className="text-gray-400 block text-[10px]">DAMINI Sensitivity</span>
                      <span className="font-bold text-red-400">High Risk (&lt;15 km)</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-yellow-950/30 border border-yellow-400/20 text-white space-y-3">
                  <div className="flex items-center gap-2 text-yellow-400 font-bold text-xs">
                    <Building2 className="w-4 h-4" />
                    <span>Citizen Microclimate & Health Shield</span>
                  </div>
                  <p className="text-xs text-gray-300">
                    Customized alerts for asthma-sensitive AQI thresholds, outdoor fitness windows, and solar UV radiation protection.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMERGENCY 2G SMS & ALERTS */}
          {activeTab === "alerts" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Registered Mobile Number for 2G SMS Broadcast
                </label>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-yellow-400 shrink-0" />
                  <input
                    type="tel"
                    value={prefs.phone}
                    onChange={(e) => setPrefs({ ...prefs, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-950 border border-white/15 text-sm text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-gray-400 block mt-1">
                  Enables offline SMS delivery during network power cuts or 2G rural conditions.
                </span>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="block text-xs font-bold text-yellow-400">
                  Automated Emergency Dispatch Triggers
                </label>

                {[
                  { key: "alertLightning", label: "⚡ DAMINI Convective Lightning (<15 km)" },
                  { key: "alertHeavyRain", label: "🌧️ IMD Heavy Rainfall Warning (>65 mm)" },
                  { key: "alertSevereAqi", label: "🌫️ CPCB Severe Pollution Spike (AQI > 300)" },
                  { key: "alertHeatwave", label: "🌡️ IMD Extreme Heatwave Warning (>42°C)" },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="p-3 rounded-xl bg-gray-950 border border-white/10 flex items-center justify-between cursor-pointer hover:border-yellow-400/40"
                  >
                    <span className="text-xs font-medium text-white">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={(prefs as any)[item.key]}
                      onChange={(e) => setPrefs({ ...prefs, [item.key]: e.target.checked })}
                      className="w-4 h-4 accent-yellow-400 cursor-pointer"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: PREFERENCES & AUDIO VOICE */}
          {activeTab === "preferences" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1">
                  Default Regional Vernacular Language
                </label>
                <select
                  value={prefs.language}
                  onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-950 border border-white/15 text-sm text-white focus:border-yellow-400 focus:outline-none"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang} className="bg-gray-900">
                      {lang}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Temperature Unit
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-950 border border-white/15">
                    <button
                      type="button"
                      onClick={() => setPrefs({ ...prefs, tempUnit: "C" })}
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        prefs.tempUnit === "C" ? "bg-yellow-400 text-black" : "text-gray-400"
                      }`}
                    >
                      °C (Celsius)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrefs({ ...prefs, tempUnit: "F" })}
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        prefs.tempUnit === "F" ? "bg-yellow-400 text-black" : "text-gray-400"
                      }`}
                    >
                      °F (Fahrenheit)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-300 mb-1">
                    Wind Speed Unit
                  </label>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-gray-950 border border-white/15">
                    <button
                      type="button"
                      onClick={() => setPrefs({ ...prefs, windUnit: "kmh" })}
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        prefs.windUnit === "kmh" ? "bg-yellow-400 text-black" : "text-gray-400"
                      }`}
                    >
                      km/h
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrefs({ ...prefs, windUnit: "knots" })}
                      className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                        prefs.windUnit === "knots" ? "bg-yellow-400 text-black" : "text-gray-400"
                      }`}
                    >
                      knots
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-yellow-950/30 border border-yellow-400/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Volume2 className="w-4 h-4 text-yellow-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Auto Voice Readout</span>
                    <span className="text-[10px] text-gray-400">
                      Speaks generated meteorological advisories aloud in vernacular voice
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.voiceReadout}
                  onChange={(e) => setPrefs({ ...prefs, voiceReadout: e.target.checked })}
                  className="w-4 h-4 accent-yellow-400 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-gray-950 text-xs font-bold transition shadow-lg shadow-yellow-400/20 flex items-center gap-2 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
        </div>
      </div>
    </div>
  );
}
