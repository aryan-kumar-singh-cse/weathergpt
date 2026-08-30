"use client"

import React, { useState } from "react"
import {
  Thermometer,
  Wind,
  Droplets,
  Gauge,
  Eye,
  Sun,
  Cloud,
  CloudRain,
  Calendar,
  Info,
  AlertTriangle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useTranslation } from "@/lib/i18n"
import { ForecastDay, Outlook30Data } from "@/lib/types"

interface WeatherCardProps {
  weather: any
  forecastDays: ForecastDay[]
  outlook30: Outlook30Data | null
  locationName: string
  isLoading: boolean
}

export default function WeatherCard({
  weather,
  forecastDays,
  outlook30,
  locationName,
  isLoading,
}: WeatherCardProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<"current" | "forecast7" | "outlook30">("current")

  const getWeatherIcon = (code: number) => {
    if (code === 0) return "☀️"
    if (code === 1 || code === 2) return "🌤️"
    if (code === 3) return "☁️"
    if (code >= 45 && code <= 48) return "🌫️"
    if (code >= 51 && code <= 67) return "🌧️"
    if (code >= 71 && code <= 86) return "❄️"
    if (code >= 95) return "⛈️"
    return "⛅"
  }

  if (isLoading) {
    return (
      <Card className="w-full rounded-3xl border border-gray-200 dark:border-yellow-500/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl overflow-hidden min-h-[360px] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">{t("loading")}</p>
        </div>
      </Card>
    )
  }

  const current = weather || {}

  return (
    <Card className="w-full rounded-3xl border border-gray-200 dark:border-yellow-500/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl overflow-hidden transition-all">
      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-3 bg-gray-50/70 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setActiveTab("current")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "current"
              ? "bg-yellow-400 text-black shadow-md"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
        >
          {t("current_weather")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("forecast7")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "forecast7"
              ? "bg-yellow-400 text-black shadow-md"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
        >
          {t("forecast_7day")}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("outlook30")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
            activeTab === "outlook30"
              ? "bg-yellow-400 text-black shadow-md"
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800"
          }`}
        >
          {t("outlook_30day")}
        </button>
      </div>

      <CardContent className="p-6 space-y-6">
        {activeTab === "current" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Hero Temp Banner */}
            <div className="flex items-center justify-between p-6 bg-gradient-to-br from-yellow-400/20 via-yellow-500/10 to-transparent dark:from-yellow-400/10 dark:via-gray-800/40 dark:to-transparent rounded-3xl border border-yellow-500/20">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-yellow-700 dark:text-yellow-400">
                  {locationName || "Current Location"}
                </div>
                <div className="text-5xl sm:text-6xl font-black text-gray-900 dark:text-white mt-1">
                  {current.temperature !== undefined ? `${Math.round(current.temperature)}°C` : "--"}
                </div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
                  {t("feels_like")}: {current.apparent_temperature !== undefined ? `${Math.round(current.apparent_temperature)}°C` : "--"}
                </div>
              </div>
              <div className="text-6xl sm:text-7xl drop-shadow-lg">
                {getWeatherIcon(current.weather_code || 0)}
              </div>
            </div>

            {/* Meteorological Parameter Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  {t("humidity")}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {current.humidity !== undefined ? `${current.humidity}%` : "--"}
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                  <Wind className="w-3.5 h-3.5 text-teal-500" />
                  {t("wind_speed")}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {current.wind_speed !== undefined ? `${current.wind_speed} km/h` : "--"}
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                  <Gauge className="w-3.5 h-3.5 text-purple-500" />
                  {t("pressure")}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {current.pressure !== undefined ? `${Math.round(current.pressure)} hPa` : "--"}
                </div>
              </div>

              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-semibold">
                  <CloudRain className="w-3.5 h-3.5 text-indigo-500" />
                  {t("precipitation")}
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {current.precipitation !== undefined ? `${current.precipitation} mm` : "0 mm"}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "forecast7" && (
          <div className="space-y-3 animate-in fade-in duration-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {forecastDays.slice(0, 7).map((day, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3.5 bg-gray-50/80 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-yellow-400/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getWeatherIcon(day.weather_code)}</span>
                    <div>
                      <div className="text-xs font-bold text-gray-900 dark:text-white">{day.date}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">
                        {t("rain_probability")}: {day.precipitation_probability}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {Math.round(day.temperature_max)}°
                    </span>
                    <span className="text-xs font-semibold text-gray-400 ml-1.5">
                      / {Math.round(day.temperature_min)}°
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "outlook30" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Accuracy Disclaimer Banner */}
            <div className="flex items-start gap-2.5 p-3.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-500/30 rounded-2xl">
              <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-900 dark:text-yellow-200 leading-relaxed font-medium">
                {outlook30?.disclaimer || t("outlook_disclaimer")}
              </p>
            </div>

            {/* 30-Day Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-yellow-400">
              {(outlook30?.days || []).map((day, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 text-center space-y-1"
                >
                  <div className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                    Day {day.day_number || idx + 1}
                  </div>
                  <div className="text-2xl my-1">{getWeatherIcon(day.weather_code)}</div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white">
                    {Math.round(day.temperature_max)}° / {Math.round(day.temperature_min)}°
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium">
                    {day.precipitation_probability}% rain
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
