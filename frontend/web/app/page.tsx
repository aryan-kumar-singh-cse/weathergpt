"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { NowcastSlot } from "@/components/NowcastSlider";
import { Preferences } from "@/components/SettingsPanel";
import type { WeatherCondition } from "@/components/WeatherGlobe";
import { SupportedLanguage } from "@/lib/translations";
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
  maxTemp?: number;
  minTemp?: number;
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
  aqiCategory?: string;
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
  moonPhase?: string;
  visibility?: number;
  dewPoint?: number;
  updatedAt?: string;
  imdWarning?: string;
  imdSeverity?: "yellow" | "orange" | "red" | "green";
  nowcastSlots?: NowcastSlot[];
  forecast?: ForecastDay[];
};

export default function Home() {
  // Main Dashboard Weather State with 0.1 Decimal Precision matching MAUSAM App
  const [dashboardWeather, setDashboardWeather] = useState<DashboardWeather>({
    city: "Modinagar, Ghaziabad",
    temp: 29.3,
    feelsLike: 36.2,
    maxTemp: 31.7,
    minTemp: 24.9,
    humidity: 80,
    windSpeed: 8.0,
    pressure: 1010,
    condition: "Mainly Clear",
    rainChance: 20,
    weatherType: "clear",
    lat: 28.7695,
    lng: 77.5750,
    uvIndex: 5.4,
    aqi: 35,
    aqiCategory: "Good",
    sunrise: "06:01",
    sunset: "18:41",
    moonrise: "21:30",
    moonset: "10:15",
    moonPhase: "Waxing Gibbous",
    visibility: 10,
    dewPoint: 22.0,
    updatedAt: "Live",
    imdWarning: "",
    imdSeverity: "green",
    nowcastSlots: [],
    forecast: [],
  });

  const [globeCoords, setGlobeCoords] = useState({ lat: 28.7695, lng: 77.5750 });
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

  // Chat-specific response state
  const [chatResponse, setChatResponse] = useState<string | undefined>(undefined);
  const [chatResponseCity, setChatResponseCity] = useState<string | undefined>(undefined);

  const [preferences, setPreferences] = useState<Preferences>({
    defaultLocation: "",
    language: "English",
    occupation: "General Public",
  });

  // 1. Fetch & Update Main Dashboard Location
  const handleSelectDashboardLocation = useCallback(
    async (cityName: string, coords?: { lat: number; lng: number }, isSilentSync = false, customLang?: SupportedLanguage) => {
      if (!cityName) return;

      const activeLang = customLang || selectedLanguage;

      if (coords) {
        setGlobeCoords({ lat: coords.lat, lng: coords.lng });
      }

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
          temp: data.temp ?? 34.4,
          feelsLike: data.feelsLike ?? 36.5,
          maxTemp: data.maxTemp ?? 34.9,
          minTemp: data.minTemp ?? 26.7,
          humidity: data.humidity ?? 41,
          windSpeed: data.windSpeed ?? 2.8,
          pressure: data.pressure ?? 1012,
          condition: data.condition || "Overcast Sky",
          rainChance: data.rainChance ?? 25,
          weatherType: data.weatherType || "cloudy",
          lat: resolvedLat,
          lng: resolvedLng,
          uvIndex: data.uvIndex ?? 5.4,
          aqi: data.aqi ?? 156,
          aqiCategory: data.aqiCategory ?? "Moderate",
          sunrise: data.sunrise ?? "05:58",
          sunset: data.sunset ?? "18:43",
          moonrise: data.moonrise ?? "21:00",
          moonset: data.moonset ?? "09:49",
          moonPhase: data.moonPhase ?? "Waxing Gibbous",
          visibility: data.visibility ?? 10,
          dewPoint: data.dewPoint ?? 21.0,
          updatedAt: data.updatedAt ?? "05:30 PM",
          imdWarning: data.imdWarning ?? "Thunder with Lightning and Light to Moderate Rain",
          imdSeverity: data.imdSeverity ?? "yellow",
          nowcastSlots: data.nowcastSlots || [],
          forecast: data.forecast || [],
        });

        if (data.lat && data.lng) {
          setGlobeCoords({ lat: data.lat, lng: data.lng });
        }

        // Fetch 15-day extended outlook
        try {
          const outlookRes = await get30DayOutlook(resolvedLat, resolvedLng, data.city || cityName);
          if (outlookRes?.days && outlookRes.days.length > 0) {
            const mappedDetailed: DetailedDay[] = outlookRes.days.slice(0, 15).map((d: any) => {
              const dt = new Date(d.date);
              return {
                date: `${dt.getDate()} ${dt.toLocaleString("default", { month: "short" })}`,
                day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dt.getDay()],
                condition: d.precipitation_probability > 40 ? "Rain" : "Partly Cloudy",
                highTemp: parseFloat(d.temperature_max.toFixed(1)),
                lowTemp: parseFloat(d.temperature_min.toFixed(1)),
                rainChance: d.precipitation_probability,
                windSpeed: parseFloat(d.wind_speed_max.toFixed(1)),
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

  // Auto-Refresh Polling Engine (Every 2.5 minutes)
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
    }, 150000);

    return () => {
      clearInterval(counterTimer);
      clearInterval(autoSyncTimer);
    };
  }, [dashboardWeather.city, dashboardWeather.lat, dashboardWeather.lng, handleSelectDashboardLocation]);

  // 2. Multi-Turn Conversational Chat Handler
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
            location: dashboardWeather.city || "Sahibabad, Ghaziabad",
            lat: dashboardWeather.lat,
            lng: dashboardWeather.lng,
            history: formattedHistory,
          }),
        });

        if (!res.ok) throw new Error("Failed to process conversation query");
        const data = await res.json();

        setChatResponse(data.response);
        setChatResponseCity(data.city);

        // Dynamically rotate Earth to location mentioned in chat
        if (data.lat && data.lng) {
          setGlobeCoords({ lat: data.lat, lng: data.lng });
          setDashboardWeather((prev) => ({
            ...prev,
            lat: data.lat,
            lng: data.lng,
            city: data.city || prev.city,
            temp: data.temp ?? prev.temp,
            feelsLike: data.feelsLike ?? prev.feelsLike,
            condition: data.condition || prev.condition,
            weatherType: data.weatherType || prev.weatherType,
            rainChance: data.rainChance ?? prev.rainChance,
            humidity: data.humidity ?? prev.humidity,
            windSpeed: data.windSpeed ?? prev.windSpeed,
          }));
        }

        return data.response as string;
      } catch (err: any) {
        toast.error(err?.message || "Failed to process question");
        return undefined;
      } finally {
        setIsChatLoading(false);
      }
    },
    [preferences, selectedLanguage, dashboardWeather.city, dashboardWeather.lat, dashboardWeather.lng]
  );

  // 3. Live GPS Geolocation Auto-Detection Trigger
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
          const detectedCity = geo.city || "Modinagar, Ghaziabad";

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
        if (isManual && toastId) toast.error("Location permission denied", { id: toastId });
        if (!isManual) {
          handleSelectDashboardLocation("Modinagar, Ghaziabad", { lat: 28.7695, lng: 77.5750 }, true);
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [handleSelectDashboardLocation]);

  // Initial Load: Auto-Prompt User for GPS Location
  useEffect(() => {
    let savedCity = "";
    let savedCoords: { lat: number; lng: number } | undefined;

    try {
      savedCity = localStorage.getItem("weathergpt_active_city") || "";
      const coordsStr = localStorage.getItem("weathergpt_active_coords");
      if (coordsStr) savedCoords = JSON.parse(coordsStr);
    } catch {}

    if (savedCity && savedCoords) {
      handleSelectDashboardLocation(savedCity, savedCoords, true);
    }

    handleGPSDetect(false);
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
          cityName={dashboardWeather.city}
          onSelectLocation={() => setIsSatelliteOpen(true)}
        />
      </div>

      {/* Top Header with Global Search & Vernacular Language Switcher */}
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
          else if (opt === "emergency") setIsDisasterOpen(true);
        }}
      />

      {/* Persistent Main Dashboard Weather Summary Card (Mausam + Apple Weather Layout) */}
      <WeatherSummaryCard
        city={dashboardWeather.city}
        temp={dashboardWeather.temp}
        condition={dashboardWeather.condition}
        feelsLike={dashboardWeather.feelsLike}
        maxTemp={dashboardWeather.maxTemp}
        minTemp={dashboardWeather.minTemp}
        humidity={dashboardWeather.humidity}
        windSpeed={dashboardWeather.windSpeed}
        pressure={dashboardWeather.pressure}
        uvIndex={dashboardWeather.uvIndex}
        aqi={dashboardWeather.aqi}
        aqiCategory={dashboardWeather.aqiCategory}
        sunrise={dashboardWeather.sunrise}
        sunset={dashboardWeather.sunset}
        moonrise={dashboardWeather.moonrise}
        moonset={dashboardWeather.moonset}
        moonPhase={dashboardWeather.moonPhase}
        visibility={dashboardWeather.visibility}
        dewPoint={dashboardWeather.dewPoint}
        updatedAt={dashboardWeather.updatedAt}
        imdWarning={dashboardWeather.imdWarning}
        imdSeverity={dashboardWeather.imdSeverity}
        nowcastSlots={dashboardWeather.nowcastSlots}
        lang={selectedLanguage}
        onRefreshGPS={() => handleGPSDetect(true)}
        isLocating={isLocating}
        onOpenLightning={() => setIsLightningOpen(true)}
        onOpenCropGDD={() => setIsCropGDDOpen(true)}
        onOpenSatellite={() => setIsSatelliteOpen(true)}
        onOpenDisaster={() => setIsDisasterOpen(true)}
        onOpenSms={() => setIsSmsOpen(true)}
      />

      {/* Centered Frosted-Glass Info Strip */}
      {!isForecastOpen && !isChatExpanded && dashboardWeather.city && (
        <InfoStrip
          city={dashboardWeather.city}
          temp={Math.round(dashboardWeather.temp)}
          condition={dashboardWeather.condition}
          rainChance={dashboardWeather.rainChance}
          lang={selectedLanguage}
          onOpenMap={() => setIsSatelliteOpen(true)}
        />
      )}

      {/* Expandable Detailed Forecast Panel with 7-Day Gradient Temperature Bars */}
      <DetailedForecastPanel
        isOpen={isForecastOpen}
        onClose={() => setIsForecastOpen(false)}
        city={dashboardWeather.city}
        days7={detailed7Days}
        days15={detailedDays15}
        lang={selectedLanguage}
      />

      {/* Sector Decision Intelligence Modal */}
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

      {/* Floating Collapsible Chat Input Bar */}
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
          lang={selectedLanguage}
        />
      </div>
    </main>
  );
}
