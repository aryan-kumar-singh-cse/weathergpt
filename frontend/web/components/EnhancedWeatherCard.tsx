"use client"

import { Thermometer, Wind, Droplets, Gauge, Eye, MapPin, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { typography, radius, shadows } from "@/lib/design-system"

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

interface WeatherCardProps {
  weather: Weather | null
  isLoading: boolean
}

export default function EnhancedWeatherCard({ weather, isLoading }: WeatherCardProps) {
  const getConditionIcon = (condition: string) => {
    const iconMap: Record<string, string> = {
      'sunny': '☀️',
      'partly-cloudy': '⛅',
      'cloudy': '☁️',
      'rainy': '🌧️',
      'storm': '⛈️',
      'clear': '🌙'
    }
    return iconMap[condition] || '🌤️'
  }

  const getConditionLabel = (condition: string) => {
    const labelMap: Record<string, string> = {
      'sunny': 'Clear sunny skies',
      'partly-cloudy': 'Partly cloudy',
      'cloudy': 'Overcast',
      'rainy': 'Rain expected',
      'storm': 'Thunderstorms',
      'clear': 'Clear night'
    }
    return labelMap[condition] || 'Fair weather'
  }

  const getUVLevel = (uv?: number): { label: string; color: string } => {
    if (!uv) return { label: 'Unknown', color: 'text-gray-500' }
    if (uv <= 2) return { label: 'Low', color: 'text-green-600 dark:text-green-400' }
    if (uv <= 5) return { label: 'Moderate', color: 'text-yellow-600 dark:text-yellow-400' }
    if (uv <= 7) return { label: 'High', color: 'text-orange-600 dark:text-orange-400' }
    if (uv <= 10) return { label: 'Very High', color: 'text-red-600 dark:text-red-400' }
    return { label: 'Extreme', color: 'text-purple-600 dark:text-purple-400' }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 flex items-center justify-center">
          <div
            className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"
            role="status"
            aria-label="Loading weather data"
          />
          <span className="sr-only">Loading weather information...</span>
        </CardContent>
      </Card>
    )
  }

  if (!weather) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <MapPin className="w-12 h-12 text-gray-400" aria-hidden="true" />
            <p className={`${typography.body} text-gray-600 dark:text-gray-400`}>
              Select a location to view weather data
            </p>
            <p className={`${typography.bodySmall} text-gray-500 dark:text-gray-500`}>
              Choose from the location selector or search above
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const uvLevel = getUVLevel(weather.uvIndex)

  return (
    <Card className="w-full overflow-hidden">
      {/* Hero Section with Current Weather */}
      <div
        className={`
          bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500
          p-6 sm:p-8 text-white
          relative overflow-hidden
        `}
        role="region"
        aria-label="Current weather conditions"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10" aria-hidden="true">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            {/* Location */}
            {weather.location && (
              <div className="flex items-center gap-2 text-white/90 mb-3">
                <MapPin className="w-4 h-4" aria-hidden="true" />
                <span className={typography.bodySmall}>
                  {weather.location}{weather.state ? `, ${weather.state}` : ''}
                </span>
              </div>
            )}

            {/* Temperature Display */}
            <div className="mb-2">
              <h2 className={`${typography.display} mb-1`}>
                {weather.temperature !== undefined ? `${Math.round(weather.temperature)}°` : '--°'}
              </h2>
              <p className="text-white/80 text-lg">
                Feels like {weather.feelsLike !== undefined ? `${Math.round(weather.feelsLike)}°C` : '--°C'}
              </p>
            </div>

            {/* Condition Label */}
            {weather.condition && (
              <p className={`${typography.body} text-white/90`}>
                {getConditionLabel(weather.condition)}
              </p>
            )}

            {/* Last Updated */}
            {weather.lastUpdated && (
              <div className="flex items-center gap-2 mt-3 text-white/70">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                <time className={typography.caption}>
                  Updated {weather.lastUpdated}
                </time>
              </div>
            )}
          </div>

          {/* Weather Icon */}
          <div className="text-8xl sm:text-9xl animate-weather-pulse" aria-label={weather.condition ? getConditionLabel(weather.condition) : 'Weather icon'}>
            {getConditionIcon(weather.condition || 'sunny')}
          </div>
        </div>
      </div>

      {/* Weather Metrics Grid */}
      <CardContent className="p-4 sm:p-6">
        <h3 className="sr-only">Detailed weather metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">

          {/* Temperature */}
          <div
            className={`
              flex items-center gap-3 p-3 sm:p-4
              bg-gradient-to-br from-red-50 to-orange-50
              dark:from-red-950/20 dark:to-orange-950/20
              ${radius.lg} ${shadows.sm}
              border border-red-100 dark:border-red-900/30
            `}
            role="group"
            aria-label="Temperature information"
          >
            <div className="flex-shrink-0">
              <Thermometer className="w-5 h-5 text-red-600 dark:text-red-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className={`${typography.caption} text-gray-600 dark:text-gray-400`}>Temperature</p>
              <p className={`${typography.h4} text-gray-900 dark:text-white truncate`}>
                {weather.temperature !== undefined ? `${Math.round(weather.temperature)}°C` : '--°C'}
              </p>
            </div>
          </div>

          {/* Humidity */}
          <div
            className={`
              flex items-center gap-3 p-3 sm:p-4
              bg-gradient-to-br from-blue-50 to-cyan-50
              dark:from-blue-950/20 dark:to-cyan-950/20
              ${radius.lg} ${shadows.sm}
              border border-blue-100 dark:border-blue-900/30
            `}
            role="group"
            aria-label="Humidity information"
          >
            <div className="flex-shrink-0">
              <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className={`${typography.caption} text-gray-600 dark:text-gray-400`}>Humidity</p>
              <p className={`${typography.h4} text-gray-900 dark:text-white truncate`}>
                {weather.humidity !== undefined ? `${weather.humidity}%` : '--%'}
              </p>
            </div>
          </div>

          {/* Wind Speed */}
          <div
            className={`
              flex items-center gap-3 p-3 sm:p-4
              bg-gradient-to-br from-green-50 to-emerald-50
              dark:from-green-950/20 dark:to-emerald-950/20
              ${radius.lg} ${shadows.sm}
              border border-green-100 dark:border-green-900/30
            `}
            role="group"
            aria-label="Wind speed information"
          >
            <div className="flex-shrink-0">
              <Wind className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className={`${typography.caption} text-gray-600 dark:text-gray-400`}>Wind Speed</p>
              <p className={`${typography.h4} text-gray-900 dark:text-white truncate`}>
                {weather.windSpeed !== undefined ? `${weather.windSpeed} km/h` : '-- km/h'}
              </p>
            </div>
          </div>

          {/* UV Index */}
          <div
            className={`
              flex items-center gap-3 p-3 sm:p-4
              bg-gradient-to-br from-orange-50 to-amber-50
              dark:from-orange-950/20 dark:to-amber-950/20
              ${radius.lg} ${shadows.sm}
              border border-orange-100 dark:border-orange-900/30
            `}
            role="group"
            aria-label="UV index information"
          >
            <div className="flex-shrink-0">
              <Gauge className="w-5 h-5 text-orange-600 dark:text-orange-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className={`${typography.caption} text-gray-600 dark:text-gray-400`}>UV Index</p>
              <p className={`${typography.h4} text-gray-900 dark:text-white`}>
                {weather.uvIndex !== undefined ? (
                  <>
                    <span>{weather.uvIndex}/11</span>
                    <span className={`ml-2 ${typography.caption} ${uvLevel.color}`}>
                      {uvLevel.label}
                    </span>
                  </>
                ) : (
                  '--/11'
                )}
              </p>
            </div>
          </div>

          {/* Pressure */}
          <div
            className={`
              flex items-center gap-3 p-3 sm:p-4
              bg-gradient-to-br from-purple-50 to-violet-50
              dark:from-purple-950/20 dark:to-violet-950/20
              ${radius.lg} ${shadows.sm}
              border border-purple-100 dark:border-purple-900/30
            `}
            role="group"
            aria-label="Atmospheric pressure information"
          >
            <div className="flex-shrink-0">
              <Gauge className="w-5 h-5 text-purple-600 dark:text-purple-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className={`${typography.caption} text-gray-600 dark:text-gray-400`}>Pressure</p>
              <p className={`${typography.h4} text-gray-900 dark:text-white truncate`}>
                {weather.pressure !== undefined ? `${weather.pressure} hPa` : '-- hPa'}
              </p>
            </div>
          </div>

          {/* Visibility */}
          <div
            className={`
              flex items-center gap-3 p-3 sm:p-4
              bg-gradient-to-br from-cyan-50 to-sky-50
              dark:from-cyan-950/20 dark:to-sky-950/20
              ${radius.lg} ${shadows.sm}
              border border-cyan-100 dark:border-cyan-900/30
            `}
            role="group"
            aria-label="Visibility information"
          >
            <div className="flex-shrink-0">
              <Eye className="w-5 h-5 text-cyan-600 dark:text-cyan-400" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className={`${typography.caption} text-gray-600 dark:text-gray-400`}>Visibility</p>
              <p className={`${typography.h4} text-gray-900 dark:text-white truncate`}>
                {weather.visibility !== undefined ? `${weather.visibility} km` : '-- km'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
