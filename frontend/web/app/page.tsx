"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import WeatherSummaryCard from "@/components/WeatherSummaryCard";
import InfoStrip from "@/components/InfoStrip";
import DetailedForecastPanel, { DetailedDay } from "@/components/DetailedForecastPanel";
import ChatInputBar, { ChatMessage } from "@/components/ChatInputBar";
import SectorAdvisoryModal from "@/components/SectorAdvisoryModal";
import WeatherBulletinExportModal from "@/components/WeatherBulletinExportModal";
import ClimateBenchmarkModal from "@/components/ClimateBenchmarkModal";
import WeatherRadarModal from "@/components/WeatherRadarModal";
import LightningProximityModal from "@/components/LightningProximityModal";
import SmartCropCalendarModal from "@/components/SmartCropCalendarModal";
import SatelliteViewerModal from "@/components/SatelliteViewerModal";
import DisasterReliefModal from "@/components/DisasterReliefModal";
import RuralSmsSimulatorModal from "@/components/RuralSmsSimulatorModal";
import { Preferences } from "@/components/SettingsPanel";
import type { WeatherCondition } from "@/components/WeatherGlobe";
import { SupportedLanguage, TRANSLATIONS } from "@/lib/translations";
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
  uvIndex?: number;
  aqi?: number;
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonPhase?: string;
  visibility?: number;
  dewPoint?: number;
  forecast?: ForecastDay[];
};

export default function Home() {
  // Main Dashboard Weather State
  const [dashboardWeather, setDashboardWeather] = useState<DashboardWeather>({
    city: "",
    temp: 28,
    feelsLike: 30,
    humidity: 68,
    windSpeed: 10,
    pressure: 1012,
    condition: "Clear Sky",
    rainChance: 15,
    weatherType: "clear",
    lat: 28.6780,
    lng: 77.3890,
    uvIndex: 5.6,
    aqi: 78,
    sunrise: "05:58 AM",
    sunset: "06:38 PM",
    moonrise: "07:15 PM",
    moonPhase: "Waxing Gibbous",
    visibility: 10,
    dewPoint: 21,
    forecast: [],
  });

  const [globeCoords, setGlobeCoords] = useState({ lat: 28.6780, lng: 77.3890 });
  const [detailedDays15, setDetailedDays15] = useState<DetailedDay[]>([]);
  const [isForecastOpen, setIsForecastOpen] = useState(false);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Live Auto-Refresh & Background Polling State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedSecondsAgo, setLastSyncedSecondsAgo] = useState(0);

  // Operational Modal States (SIH High Impact Features)
  const [isAdvisoryOpen, setIsAdvisoryOpen] = useState(false);
  const [isBulletinOpen, setIsBulletinOpen] = useState(false);
  const [isClimateOpen, setIsClimateOpen] = useState(false);
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const [isLightningOpen, setIsLightningOpen] = useState(false);
  const [isCropGDDOpen, setIsCropGDDOpen] = useState(false);
  const [isSatelliteOpen, setIsSatelliteOpen] = useState(false);
  const [isDisasterOpen, setIsDisasterOpen] = useState(false);
  const [isSmsOpen, setIsSmsOpen] = useState(false);

  // Vernacular Multi-Lingual State
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>("en");

  // Chat-specific response state (Decoupled from Dashboard)
  const [chatResponse, setChatResponse] = useState<string | undefined>(undefined);
  const [chatResponseCity, setChatResponseCity] = useState<string | undefined>(undefined);

  const [preferences, setPreferences] = useState<Preferences>({
    defaultLocation: "",
    language: "English",
    occupation: "General Public",
  });

  // 1. Fetch & Update Main Dashboard Location (via Search Bar, GPS, or Settings)
  const handleSelectDashboardLocation = useCallback(
    async (cityName: string, coords?: { lat: number; lng: number }, isSilentSync = false, customLang?: SupportedLanguage) => {
      if (!cityName) return;

      const activeLang = customLang || selectedLanguage;

      if (coords) {
        setGlobeCoords({ lat: coords.lat, lng: coords.lng });
      }

      // Persist active city and coordinates in localStorage
      try {
        localStorage.setItem("weathergpt_active_city", cityName);
        if (coords) {
          localStorage.setItem("weathergpt_active_coords", JSON.stringify(coords));
        }
      } catch {}

      let toastId: string | undefined;
      if (!isSilentSync) {
        toastId = toast.loading(`Loading live weather for ${cityName}...`);
      } else {
        setIsRefreshing(true);
      }

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: `Weather overview for ${cityName}`,
            occupation: preferences.occupation,
            language: activeLang,
            location: cityName,
            lat: coords?.lat ?? globeCoords.lat,
            lng: coords?.lng ?? globeCoords.lng,
          }),
        });

        if (!res.ok) throw new Error("Could not fetch location weather");
        const data = await res.json();

        const resolvedLat = data.lat ?? coords?.lat ?? globeCoords.lat;
        const resolvedLng = data.lng ?? coords?.lng ?? globeCoords.lng;

        setDashboardWeather({
          city: data.city || cityName,
          temp: data.temp ?? 28,
          feelsLike: data.feelsLike,
          humidity: data.humidity,
          windSpeed: data.windSpeed,
          pressure: data.pressure,
          condition: data.condition || "Clear Sky",
          rainChance: data.rainChance,
          weatherType: data.weatherType || "clear",
          lat: resolvedLat,
          lng: resolvedLng,
          uvIndex: data.uvIndex ?? 5.6,
          aqi: data.aqi ?? 78,
          sunrise: data.sunrise ?? "05:58 AM",
          sunset: data.sunset ?? "06:38 PM",
          moonrise: data.moonrise ?? "07:15 PM",
          moonPhase: data.moonPhase ?? "Waxing Gibbous",
          visibility: data.visibility ?? 10,
          dewPoint: data.dewPoint ?? 21,
          forecast: data.forecast || [],
        });

        if (data.lat && data.lng) {
          setGlobeCoords({ lat: data.lat, lng: data.lng });
        }

        // Fetch 15-day extended outlook for detailed window
        try {
          const outlookRes = await get30DayOutlook(resolvedLat, resolvedLng, data.city || cityName);
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

        setLastSyncedSecondsAgo(0);
        if (toastId) {
          toast.success(`Viewing live ${data.city || cityName}`, { id: toastId });
        }
      } catch (err: any) {
        if (toastId) {
          toast.error(err?.message || "Failed to load weather report", { id: toastId });
        }
      } finally {
        setIsRefreshing(false);
      }
    },
    [preferences.occupation, selectedLanguage, globeCoords.lat, globeCoords.lng]
  );

  // Auto-Refresh Polling Engine (Every 2.5 minutes + 1s seconds counter)
  useEffect(() => {
    const counterTimer = setInterval(() => {
      setLastSyncedSecondsAgo((prev) => prev + 1);
    }, 1000);

    const autoSyncTimer = setInterval(() => {
      if (dashboardWeather.city) {
        handleSelectDashboardLocation(
          dashboardWeather.city,
          { lat: dashboardWeather.lat, lng: dashboardWeather.lng },
          true
        );
      }
    }, 150000); // 2.5 minutes

    return () => {
      clearInterval(counterTimer);
      clearInterval(autoSyncTimer);
    };
  }, [dashboardWeather.city, dashboardWeather.lat, dashboardWeather.lng, handleSelectDashboardLocation]);

  // 2. Conversational Multi-Turn Chat Handler (Decoupled from Dashboard)
  const handleChatSend = useCallback(
    async (message: string, history?: ChatMessage[]) => {
      setIsChatLoading(true);

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
            language: selectedLanguage,
            location: dashboardWeather.city || "Live Location",
            lat: dashboardWeather.lat,
            lng: dashboardWeather.lng,
            history: formattedHistory,
          }),
        });

        if (!res.ok) throw new Error("Failed to process conversation query");
        const data = await res.json();

        setChatResponse(data.response);
        setChatResponseCity(data.city);
      } catch (err: any) {
        toast.error(err?.message || "Failed to process question");
      } finally {
        setIsChatLoading(false);
      }
    },
    [preferences, selectedLanguage, dashboardWeather.city, dashboardWeather.lat, dashboardWeather.lng]
  );

  // 3. Live GPS Geolocation Trigger (Hyper-local precision down to neighborhood / colony)
  const handleGPSDetect = useCallback((isManual = true) => {
    if (!navigator.geolocation) {
      if (isManual) toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    let toastId: string | undefined;
    if (isManual) {
      toastId = toast.loading("Detecting exact GPS locality...");
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const geo = await reverseGeocode(latitude, longitude);
          const detectedCity = geo.city || "Mohan Nagar, Sahibabad";

          setPreferences((prev) => ({ ...prev, defaultLocation: detectedCity }));
          if (toastId) toast.success(`Located at ${detectedCity}`, { id: toastId });

          handleSelectDashboardLocation(detectedCity, { lat: latitude, lng: longitude });
        } catch {
          if (toastId) toast.error("Could not reverse geocode GPS location", { id: toastId });
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        if (toastId) toast.error("Location permission denied", { id: toastId });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [handleSelectDashboardLocation]);

  // Initial Load: Priority to User's Saved Location / GPS instead of resetting to Delhi!
  useEffect(() => {
    let savedCity = "";
    let savedCoords: { lat: number; lng: number } | undefined;

    try {
      savedCity = localStorage.getItem("weathergpt_active_city") || "";
      const coordsStr = localStorage.getItem("weathergpt_active_coords");
      if (coordsStr) savedCoords = JSON.parse(coordsStr);
    } catch {}

    if (savedCity && savedCoords) {
      handleSelectDashboardLocation(savedCity, savedCoords);
    } else {
      // Auto-detect user's exact hyper-local position on first load
      handleGPSDetect(false);
    }
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

  const toggleDetailedForecast = () => {
    setIsForecastOpen((prev) => {
      const next = !prev;
      if (next) setIsChatExpanded(false);
      return next;
    });
  };

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

      {/* Top Header with Clean Non-Wrapping Layout, Global Search & Vernacular Language Switcher */}
      <Header
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        activeRole={preferences.occupation}
        isForecastOpen={isForecastOpen}
        onToggleForecast={toggleDetailedForecast}
        onSelectSearchCity={(city, coords) => handleSelectDashboardLocation(city, coords)}
        currentCity={dashboardWeather.city}
        onUseCurrentLocation={() => handleGPSDetect(true)}
        isLocating={isLocating}
        selectedLanguage={selectedLanguage}
        onSelectLanguage={(lang) => {
          setSelectedLanguage(lang);
          toast.success(`Language set to ${lang.toUpperCase()}`);
          if (dashboardWeather.city) {
            handleSelectDashboardLocation(
              dashboardWeather.city,
              { lat: dashboardWeather.lat, lng: dashboardWeather.lng },
              false,
              lang
            );
          }
        }}
        onManualRefresh={() => {
          if (dashboardWeather.city) {
            handleSelectDashboardLocation(
              dashboardWeather.city,
              { lat: dashboardWeather.lat, lng: dashboardWeather.lng },
              false
            );
          }
        }}
        isRefreshing={isRefreshing}
        lastSyncedSecondsAgo={lastSyncedSecondsAgo}
        onSelectNavOption={(opt) => {
          setIsChatExpanded(false);
          const loc = dashboardWeather.city || "your location";
          if (opt === "overview") handleChatSend(`Detailed overview of ${loc}`);
          else if (opt === "advisory") setIsAdvisoryOpen(true);
          else if (opt === "radar") setIsRadarOpen(true);
          else if (opt === "bulletin") setIsBulletinOpen(true);
          else if (opt === "climate") setIsClimateOpen(true);
          else if (opt === "emergency") handleChatSend(`Are there any weather alerts or risks for ${loc}?`);
        }}
      />

      {/* Persistent Main Dashboard Weather Summary Card */}
      <WeatherSummaryCard
        city={dashboardWeather.city}
        temp={dashboardWeather.temp}
        condition={dashboardWeather.condition}
        feelsLike={dashboardWeather.feelsLike}
        humidity={dashboardWeather.humidity}
        windSpeed={dashboardWeather.windSpeed}
        pressure={dashboardWeather.pressure}
        uvIndex={dashboardWeather.uvIndex}
        aqi={dashboardWeather.aqi}
        sunrise={dashboardWeather.sunrise}
        sunset={dashboardWeather.sunset}
        moonrise={dashboardWeather.moonrise}
        moonPhase={dashboardWeather.moonPhase}
        visibility={dashboardWeather.visibility}
        dewPoint={dashboardWeather.dewPoint}
        lang={selectedLanguage}
        onRefreshGPS={() => handleGPSDetect(true)}
        isLocating={isLocating}
        onOpenLightning={() => setIsLightningOpen(true)}
        onOpenCropGDD={() => setIsCropGDDOpen(true)}
        onOpenSatellite={() => setIsSatelliteOpen(true)}
        onOpenDisaster={() => setIsDisasterOpen(true)}
        onOpenSms={() => setIsSmsOpen(true)}
      />

      {/* Centered Frosted-Glass Info Strip (Only when forecast panel and chat drawer are closed) */}
      {!isForecastOpen && !isChatExpanded && dashboardWeather.city && (
        <InfoStrip
          city={dashboardWeather.city}
          temp={dashboardWeather.temp}
          condition={dashboardWeather.condition}
          rainChance={dashboardWeather.rainChance}
          lang={selectedLanguage}
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

      {/* Sector Decision Intelligence Modal (Agriculture / NDMA / Aviation / Citizen) */}
      <SectorAdvisoryModal
        isOpen={isAdvisoryOpen}
        onClose={() => setIsAdvisoryOpen(false)}
        city={dashboardWeather.city}
        temp={dashboardWeather.temp}
        humidity={dashboardWeather.humidity}
        windSpeed={dashboardWeather.windSpeed}
        pressure={dashboardWeather.pressure}
        rainChance={dashboardWeather.rainChance}
        condition={dashboardWeather.condition}
        activeRole={preferences.occupation}
        lang={selectedLanguage}
      />

      {/* 1-Click WhatsApp & PDF Bulletin Export Modal */}
      <WeatherBulletinExportModal
        isOpen={isBulletinOpen}
        onClose={() => setIsBulletinOpen(false)}
        city={dashboardWeather.city}
        temp={dashboardWeather.temp}
        condition={dashboardWeather.condition}
        humidity={dashboardWeather.humidity}
        windSpeed={dashboardWeather.windSpeed}
        pressure={dashboardWeather.pressure}
        rainChance={dashboardWeather.rainChance}
        forecast={dashboardWeather.forecast}
        role={preferences.occupation}
        lang={selectedLanguage}
      />

      {/* 30-Year Climate Benchmark & Monsoon Deviation Modal */}
      <ClimateBenchmarkModal
        isOpen={isClimateOpen}
        onClose={() => setIsClimateOpen(false)}
        city={dashboardWeather.city}
        temp={dashboardWeather.temp}
        rainChance={dashboardWeather.rainChance}
        lang={selectedLanguage}
      />

      {/* Interactive Weather Radar & Synoptic Map Modal */}
      <WeatherRadarModal
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
        city={dashboardWeather.city}
        lat={dashboardWeather.lat}
        lng={dashboardWeather.lng}
        lang={selectedLanguage}
      />

      {/* ⚡ DAMINI Lightning Strike & Convective Nowcasting Risk Analyzer Modal */}
      <LightningProximityModal
        isOpen={isLightningOpen}
        onClose={() => setIsLightningOpen(false)}
        city={dashboardWeather.city}
        lat={dashboardWeather.lat}
        lng={dashboardWeather.lng}
        condition={dashboardWeather.condition}
        rainChance={dashboardWeather.rainChance}
        temp={dashboardWeather.temp}
        humidity={dashboardWeather.humidity}
        lang={selectedLanguage}
      />

      {/* 🌾 Krishi Vigyan Kendra Crop Phenology & GDD Engine Modal */}
      <SmartCropCalendarModal
        isOpen={isCropGDDOpen}
        onClose={() => setIsCropGDDOpen(false)}
        city={dashboardWeather.city}
        temp={dashboardWeather.temp}
        humidity={dashboardWeather.humidity}
        rainChance={dashboardWeather.rainChance}
        lang={selectedLanguage}
      />

      {/* 🛰️ ISRO INSAT-3DR Geostationary Cloud & Synoptic Satellite Feed Modal */}
      <SatelliteViewerModal
        isOpen={isSatelliteOpen}
        onClose={() => setIsSatelliteOpen(false)}
        city={dashboardWeather.city}
        lat={dashboardWeather.lat}
        lng={dashboardWeather.lng}
        condition={dashboardWeather.condition}
        rainChance={dashboardWeather.rainChance}
        lang={selectedLanguage}
      />

      {/* 🚨 NDMA Multi-Hazard Disaster & Relief Camp Hub Modal */}
      <DisasterReliefModal
        isOpen={isDisasterOpen}
        onClose={() => setIsDisasterOpen(false)}
        city={dashboardWeather.city}
        temp={dashboardWeather.temp}
        rainChance={dashboardWeather.rainChance}
        windSpeed={dashboardWeather.windSpeed}
        lang={selectedLanguage}
      />

      {/* 📲 Rural 2G/3G SMS & Automated IVR Voice Broadcast Modal */}
      <RuralSmsSimulatorModal
        isOpen={isSmsOpen}
        onClose={() => setIsSmsOpen(false)}
        city={dashboardWeather.city}
        temp={dashboardWeather.temp}
        condition={dashboardWeather.condition}
        rainChance={dashboardWeather.rainChance}
        windSpeed={dashboardWeather.windSpeed}
        lang={selectedLanguage}
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
