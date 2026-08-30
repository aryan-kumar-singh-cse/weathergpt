"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import WeatherSummaryCard from "@/components/WeatherSummaryCard";
import InfoStrip from "@/components/InfoStrip";
import ForecastStrip, { ForecastDay } from "@/components/ForecastStrip";
import ChatInputBar from "@/components/ChatInputBar";
import { Preferences } from "@/components/SettingsPanel";
import type { WeatherCondition } from "@/components/WeatherGlobe";
import { reverseGeocode, get30DayOutlook } from "@/lib/api";
import { toast, Toaster } from "react-hot-toast";

// Client-side only 3D Globe import
const WeatherGlobe = dynamic(() => import("@/components/WeatherGlobe"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e2e] via-[#141a24] to-black" />
  ),
});

const gradients: Record<WeatherCondition, string> = {
  clear: "from-[#0a0e2e] via-[#1a2456] to-[#2d3f7a]",
  cloudy: "from-[#141a24] via-[#2a3442] to-[#3d4a5c]",
  rainy: "from-black via-[#0d1218] to-[#1a2530]",
};

type WeatherResult = {
  city: string;
  temp: number;
  feelsLike?: number;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  condition: string;
  rainChance?: number;
  weatherType: WeatherCondition;
  lat: number;
  lng: number;
  response?: string;
  forecast?: ForecastDay[];
};

export default function Home() {
  const [location, setLocation] = useState({ lat: 28.6139, lng: 77.209 });
  const [weatherCondition, setWeatherCondition] = useState<WeatherCondition>("clear");
  const [result, setResult] = useState<WeatherResult | null>(null);
  const [outlook30Days, setOutlook30Days] = useState<ForecastDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [preferences, setPreferences] = useState<Preferences>({
    defaultLocation: "Delhi",
    language: "English",
    occupation: "General Public",
  });

  const handleSend = useCallback(
    async (message: string, prefsOverride?: Preferences, customLocation?: string) => {
      setIsLoading(true);
      const activePrefs = prefsOverride ?? preferences;
      const targetLoc = customLocation || activePrefs.defaultLocation || "Delhi";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            occupation: activePrefs.occupation,
            language: activePrefs.language,
            location: targetLoc,
          }),
        });

        if (!res.ok) throw new Error("Failed to process weather request");
        const data: WeatherResult = await res.json();

        setResult(data);
        setWeatherCondition(data.weatherType || "clear");
        if (data.lat && data.lng) {
          setLocation({ lat: data.lat, lng: data.lng });
        }

        // Fetch 30-day extended outlook for the forecast strip toggle
        try {
          const outlookRes = await get30DayOutlook(data.lat, data.lng, data.city);
          if (outlookRes?.days) {
            const mapped30: ForecastDay[] = outlookRes.days.map((d: any) => {
              const dt = new Date(d.date);
              return {
                date: dt.getDate(),
                day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()],
                icon: d.precipitation_probability > 50 ? "🌧️" : "🌤️",
                highTemp: d.temperature_max,
                lowTemp: d.temperature_min,
                rainChance: d.precipitation_probability,
              };
            });
            setOutlook30Days(mapped30);
          }
        } catch {}
      } catch (err: any) {
        toast.error(err?.message || "Failed to fetch weather update");
      } finally {
        setIsLoading(false);
      }
    },
    [preferences]
  );

  // Live GPS Geolocation Trigger (Google Maps style)
  const handleGPSDetect = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    const toastId = toast.loading("Detecting your exact GPS location...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const geo = await reverseGeocode(latitude, longitude);
          const detectedCity = geo.city || "Delhi";

          setLocation({ lat: latitude, lng: longitude });
          setPreferences((prev) => ({ ...prev, defaultLocation: detectedCity }));
          toast.success(`📍 Located in ${detectedCity}`, { id: toastId });

          handleSend(`Weather in ${detectedCity}`, undefined, detectedCity);
        } catch {
          toast.error("Could not reverse geocode GPS location", { id: toastId });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        toast.error("Location permission denied", { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [handleSend]);

  // Initial Load: Preferences & Initial Weather Populating
  useEffect(() => {
    fetch("/api/user/preferences")
      .then((res) => res.json())
      .then((data: Preferences) => {
        setPreferences(data);
        const city = data.defaultLocation || "Delhi";
        handleSend(`Current weather in ${city}`, data, city);
      })
      .catch(() => {
        handleSend("Current weather in Delhi", undefined, "Delhi");
      });
  }, []);

  const handleSavePreferences = async (prefs: Preferences) => {
    setPreferences(prefs);
    try {
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      toast.success("Preferences saved successfully!");
      if (prefs.defaultLocation) {
        handleSend(`Weather in ${prefs.defaultLocation}`, prefs, prefs.defaultLocation);
      }
    } catch {
      toast.error("Failed to save preferences");
    }
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden select-none">
      <Toaster position="top-right" />

      {/* Dynamic Background Gradient & 3D Globe */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${gradients[weatherCondition]} transition-all duration-1000`}
      >
        <WeatherGlobe
          lat={location.lat}
          lng={location.lng}
          weatherCondition={weatherCondition}
        />
      </div>

      {/* Header */}
      <Header
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        activeRole={preferences.occupation}
        onSelectNavOption={(opt) => {
          if (opt === "overview") handleSend(`Give me an overview of ${preferences.defaultLocation}`);
          else if (opt === "forecast") handleSend(`7-day forecast for ${preferences.defaultLocation}`);
          else if (opt === "advisory") handleSend(`Advisory recommendations for ${preferences.defaultLocation}`);
          else if (opt === "emergency") handleSend(`Are there any weather alerts for ${preferences.defaultLocation}?`);
        }}
      />

      {/* Persistent Weather Summary Card (Top-Left) */}
      <WeatherSummaryCard
        city={result?.city ?? preferences.defaultLocation ?? "Delhi"}
        temp={result?.temp ?? 30}
        condition={result?.condition ?? "Partly Cloudy"}
        feelsLike={result?.feelsLike}
        humidity={result?.humidity}
        windSpeed={result?.windSpeed}
        pressure={result?.pressure}
        onRefreshGPS={handleGPSDetect}
        isLocating={isLocating}
      />

      {/* Centered Frosted-Glass Info Strip */}
      {result && (
        <InfoStrip
          city={result.city}
          temp={result.temp}
          condition={result.condition}
          rainChance={result.rainChance}
        />
      )}

      {/* Horizontal Frosted-Glass Forecast Strip */}
      {result?.forecast && result.forecast.length > 0 && (
        <ForecastStrip days={result.forecast} outlook30Days={outlook30Days} />
      )}

      {/* Floating Collapsible Chat Input Bar (Bottom-Center) */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl">
        <ChatInputBar
          onSend={(msg) => handleSend(msg)}
          isLoading={isLoading}
          latestResponse={result?.response}
          role={preferences.occupation}
          city={result?.city ?? preferences.defaultLocation ?? "Delhi"}
        />
      </div>
    </main>
  );
}
