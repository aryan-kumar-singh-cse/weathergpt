"use client"

import { useState } from "react"
import { Thermometer, Wind, Droplets, Gauge, Eye, Sun, MapPin } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface Weather {
  location?: string
  state?: string
  temperature?: number
  feelsLike?: number
  humidity?: number
  windSpeed?: number
  pressure?: number
  uvIndex?: number
  visibility?: number
  condition?: string
  lastUpdated?: string
}

export default function WeatherCard({ weather, isLoading }: { weather: Weather | null; isLoading: boolean }) {
  const [selectedTab, setSelectedTab] = useState("weather")

  const getConditionIcon = (condition: string) => {
    switch (condition) {
      case 'sunny': return '☀️'
      case 'partly-cloudy': return '⛅'
      case 'cloudy': return '☁️'
      case 'rainy': return '🌧️'
      case 'storm': return '⛈️'
      default: return '🌤️'
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </CardContent>
      </Card>
    )
  }

  if (!weather) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p>No weather data available</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full overflow-hidden">
      <div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            {weather.location && (
              <div className="flex items-center gap-2 text-white/90">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{weather.location}, {weather.state}</span>
              </div>
            )}
            <h2 className="text-7xl font-bold mt-2">
              {weather.temperature || '--'}°
            </h2>
            <p className="text-white/80 mt-1">
              Feels like {weather.feelsLike || '--'}°
            </p>
          </div>
          <div className="text-9xl animate-weather-pulse">
            {getConditionIcon(weather.condition || 'sunny')}
          </div>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Thermometer className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-200">Temperature</p>
              <p className="font-semibold text-gray-900 dark:text-white">{weather.temperature || '--'}°C</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Droplets className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-200">Humidity</p>
              <p className="font-semibold text-gray-900 dark:text-white">{weather.humidity || '--'}%</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Wind className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-200">Wind Speed</p>
              <p className="font-semibold text-gray-900 dark:text-white">{weather.windSpeed || '--'} km/h</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Gauge className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-200">UV Index</p>
              <p className="font-semibold text-gray-900 dark:text-white">{weather.uvIndex || '--'}/11</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Gauge className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-200">Pressure</p>
              <p className="font-semibold text-gray-900 dark:text-white">{weather.pressure || '--'} hPa</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Eye className="w-5 h-5 text-cyan-500" />
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-200">Visibility</p>
              <p className="font-semibold text-gray-900 dark:text-white">{weather.visibility || '--'} km</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
