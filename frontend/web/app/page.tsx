"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import WeatherSummaryCard from "@/components/WeatherSummaryCard";
import InfoStrip from "@/components/InfoStrip";
import DetailedForecastPanel, { DetailedDay } from "@/components/DetailedForecastPanel";
import ChatInputBar, { ChatMessage } from "@/components/ChatInputBar";
import { Preferences } from "@/components/SettingsPanel";
import type { WeatherCondition } from "@/components/WeatherGlobe";
import { reverseGeocode, get30DayOutlook } from "@/lib/api";
import { toast, Toaster } from "react-hot-toast";

// Client-side only 3D Globe import
const WeatherGlobe = dynamic(() => import("@/components/WeatherGlobe"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-950 to-black" />
  ),
});

const gradients: Record<WeatherCondition, string> = {
  clear: "from-black via-[#0d1626] to-[#1a2538]",
  cloudy: "from-black via-[#111822] to-[#1e2734]",
  rainy: "from-black via-[#080d14] to-[#121922]",
};

type ForecastDay = {
  date: number | string;
  day: string;
  condition?: string;
  weatherCode?: number;
  highTemp: number;
  lowTemp?: number;
  rainChance?: number;
};

type DashboardWeather = {
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
  forecast?: ForecastDay[];
};

export default function Home() {
  // Main Dashboard Weather State (Current / Selected Location)
  const [dashboardWeather, setDashboardWeather] = useState<DashboardWeather>({
    city: "Delhi",
    temp: 30,
    feelsLike: 32,
    humidity: 68,
    windSpeed: 10,
    pressure: 1012,
    condition: "Partly Cloudy",
    rainChance: 15,
    weatherType: "clear",
    lat: 28.6139,
    lng: 77.209,
    forecast: [],
  });

  const [globeCoords, setGlobeCoords] = useState({ lat: 28.6139, lng: 77.209 });
  const [detailedDays15, setDetailedDays15] = useState<DetailedDay[]>([]);
  const [isForecastOpen, setIsForecastOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Chat-specific response state (Decoupled from Dashboard)
  const [chatResponse, setChatResponse] = useState<string | undefined>(undefined);
  const [chatResponseCity, setChatResponseCity] = useState<string | undefined>(undefined);

  const [preferences, setPreferences] = useState<Preferences>({
    defaultLocation: "Delhi",
    language: "English",
    occupation: "General Public",
  });

  // 1. Fetch & Update Main Dashboard Location (via Search Bar, GPS, or Settings)
  const handleSelectDashboardLocation = useCallback(
    async (cityName: string, coords?: { lat: number; lng: number }) => {
      if (coords) {
        setGlobeCoords({ lat: coords.lat, lng: coords.lng });
      }

      const toastId = toast.loading(`Loading weather data for ${cityName}...`);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Weather overview for ${cityName}`,
            occupation: preferences.occupation,
            language: preferences.language,
            location: cityName,
          }),
        });

        if (!res.ok) throw new Error("Could not fetch location weather");
        const data = await res.json();

        setDashboardWeather({
          city: data.city || cityName,
          temp: data.temp ?? 30,
          feelsLike: data.feelsLike,
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          pressure: data.pressure,
          condition: data.condition || "Clear Sky",
          rainChance: data.rainChance,
          weatherType: data.weatherType || "clear",
          lat: data.lat ?? coords?.lat ?? 28.61,
          lng: data.lng ?? coords?.lng ?? 77.2,
          forecast: data.forecast || [],
        });

        if (data.lat && data.lng) {
          setGlobeCoords({ lat: data.lat, lng: data.lng });
        }

        // Fetch 15-day extended outlook for detailed window
        try {
          const outlookRes = await get30DayOutlook(data.lat, data.lng, data.city);
          if (outlookRes?.days && outlookRes.days.length > 0) {
            const mappedDetailed: DetailedDay[] = outlookRes.days.slice(0, 15).map((d: any) => {
              const dt = new Date(d.date);
              return {
                date: `${dt.getDate()} ${dt.toLocaleString("default", { month: "short" })}`,
                day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()],
                condition: d.precipitation_probability > 50 ? "Rain" : "Partly Cloudy",
                highTemp: d.temperature_max,
                lowTemp: d.temperature_min,
                rainChance: d.precipitation_probability,
                windSpeed: d.wind_speed_max,
              };
            });
            setDetailedDays15(mappedDetailed);
          }
        } catch {}

        toast.success(`Dashboard viewing ${data.city || cityName}`, { id: toastId });
      } catch (err: any) {
        toast.error(err?.message || "Failed to load weather report", { id: toastId });
      }
    },
    [preferences]
  );

  // 2. Conversational Multi-Turn Chat Handler (Decoupled from Dashboard)
  const handleChatSend = useCallback(
    async (message: string, history?: ChatMessage[]) => {
      setIsChatLoading(true);

      // Map chat messages into role/content format
      const formattedHistory = (history || []).map((m) => ({
        role: m.sender === "assistant" ? "assistant" : "user",
        content: m.text,
      }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            occupation: preferences.occupation,
            language: preferences.language,
            location: dashboardWeather.city,
            history: formattedHistory,
          }),
        });

        if (!res.ok) throw new Error("Failed to process conversation query");
        const data = await res.json();

        // Update chat drawer ONLY (Do not overwrite main dashboard city!)
        setChatResponse(data.response);
        setChatResponseCity(data.city);
      } catch (err: any) {
        toast.error(err?.message || "Failed to process question");
      } finally {
        setIsChatLoading(false);
      }
    },
    [preferences, dashboardWeather.city]
  );

  // 3. Live GPS Geolocation Trigger
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

          setPreferences((prev) => ({ ...prev, defaultLocation: detectedCity }));
          toast.success(`Located in ${detectedCity}`, { id: toastId });

          handleSelectDashboardLocation(detectedCity);
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
  }, [handleSelectDashboardLocation]);

  // Initial Load: User Preferences & Default Dashboard City
  useEffect(() => {
    fetch("/api/user/preferences")
      .then((res) => res.json())
      .then((data: Preferences) => {
        setPreferences(data);
        const initialCity = data.defaultLocation || "Delhi";
        handleSelectDashboardLocation(initialCity);
      })
      .catch(() => {
        handleSelectDashboardLocation("Delhi");
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
        handleSelectDashboardLocation(prefs.defaultLocation);
      }
    } catch {
      toast.error("Failed to save preferences");
    }
  };

  const detailed7Days: DetailedDay[] = (dashboardWeather.forecast || []).map((f) => ({
    date: f.date,
    day: f.day,
    condition: f.condition || "Clear",
    highTemp: f.highTemp,
    lowTemp: f.lowTemp,
    rainChance: f.rainChance,
  }));

  // Toggle Detailed Forecast Panel (auto-minimize chat when forecast opens)
  const toggleDetailedForecast = () => {
    setIsForecastOpen((prev) => {
      const next = !prev;
      if (next) setIsChatExpanded(false);
      return next;
    });
  };

  // Toggle Chat Drawer (auto-minimize forecast panel when chat opens)
  const toggleChatDrawer = (expanded: boolean) => {
    setIsChatExpanded(expanded);
    if (expanded) setIsForecastOpen(false);
  };

  return (
    <main className="relative h-screen w-screen overflow-hidden select-none bg-black">
      <Toaster position="top-right" />

      {/* Dynamic Background Gradient & 3D Globe */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${gradients[dashboardWeather.weatherType]} transition-all duration-1000`}
      >
        <WeatherGlobe
          lat={globeCoords.lat}
          lng={globeCoords.lng}
          weatherCondition={dashboardWeather.weatherType}
        />
      </div>

      {/* Top Header with Global City Search Bar */}
      <Header
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        activeRole={preferences.occupation}
        isForecastOpen={isForecastOpen}
        onToggleForecast={toggleDetailedForecast}
        onSelectSearchCity={(city, coords) => handleSelectDashboardLocation(city, coords)}
        currentCity={dashboardWeather.city}
        onUseCurrentLocation={handleGPSDetect}
        isLocating={isLocating}
        onSelectNavOption={(opt) => {
          setIsChatExpanded(false);
          const loc = dashboardWeather.city;
          if (opt === "overview") handleChatSend(`Give me a detailed overview of ${loc}`);
          else if (opt === "forecast") toggleDetailedForecast();
          else if (opt === "advisory") handleChatSend(`Advisory recommendations for ${loc}`);
          else if (opt === "emergency") handleChatSend(`Are there any weather alerts for ${loc}?`);
        }}
      />

      {/* Persistent Main Dashboard Weather Summary Card (Top-Left) */}
      <WeatherSummaryCard
        city={dashboardWeather.city}
        temp={dashboardWeather.temp}
        condition={dashboardWeather.condition}
        feelsLike={dashboardWeather.feelsLike}
        humidity={dashboardWeather.humidity}
        windSpeed={dashboardWeather.windSpeed}
        pressure={dashboardWeather.pressure}
        onRefreshGPS={handleGPSDetect}
        isLocating={isLocating}
      />

      {/* Centered Frosted-Glass Info Strip (Only when forecast panel is closed) */}
      {!isForecastOpen && (
        <InfoStrip
          city={dashboardWeather.city}
          temp={dashboardWeather.temp}
          condition={dashboardWeather.condition}
          rainChance={dashboardWeather.rainChance}
        />
      )}

      {/* Expandable Detailed Forecast Panel with Black-to-Transparent Gradient Header */}
      <DetailedForecastPanel
        isOpen={isForecastOpen}
        onClose={() => setIsForecastOpen(false)}
        city={dashboardWeather.city}
        days7={detailed7Days}
        days15={detailedDays15}
      />

      {/* Floating Collapsible Chat Input Bar (Decoupled from Dashboard with Multi-Turn Memory) */}
      <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-2xl">
        <ChatInputBar
          onSend={handleChatSend}
          isLoading={isChatLoading}
          latestResponse={chatResponse}
          latestResponseCity={chatResponseCity}
          role={preferences.occupation}
          currentDashboardCity={dashboardWeather.city}
          isExpanded={isChatExpanded}
          onToggleExpanded={toggleChatDrawer}
          onSwitchDashboardCity={(city) => handleSelectDashboardLocation(city)}
        />
      </div>
    </main>
  );
}
