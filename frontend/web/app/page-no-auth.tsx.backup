"use client"

import { useState, useEffect } from "react"
import { Search, Menu, Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, MapPin, MessageSquare, Mic, Moon, Sun as SunIcon, Sparkles } from "lucide-react"
import { toast } from "react-hot-toast"
import ThemeProvider from "@/components/ThemeProvider"
import WeatherCard from "@/components/WeatherCard"
import ChatInterface from "@/components/ChatInterface"
import LocationSelector from "@/components/LocationSelector"
import LanguageSelector from "@/components/LanguageSelector"
import RoleSelector from "@/components/RoleSelector"
import SeverityBanner from "@/components/SeverityBanner"
import { getCurrentWeatherByCity } from "@/lib/api"

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [forecastData, setForecastData] = useState<any>(null)
  const [alerts, setAlerts] = useState<any>([])
  const [isLoading, setIsLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [role, setRole] = useState<string>("citizen")
  const [language, setLanguage] = useState<string>("en")

  const locations = [
    { name: "Mumbai", state: "Maharashtra", lat: 19.076, lng: 72.8777 },
    { name: "Delhi", state: "Delhi", lat: 28.7041, lng: 77.1025 },
    { name: "Bangalore", state: "Karnataka", lat: 12.9716, lng: 77.5946 },
    { name: "Chennai", state: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
    { name: "Kolkata", state: "West Bengal", lat: 22.5726, lng: 88.3639 },
    { name: "Hyderabad", state: "Telangana", lat: 17.3850, lng: 78.4867 },
    { name: "Pune", state: "Maharashtra", lat: 18.5204, lng: 73.8567 },
    { name: "Ahmedabad", state: "Gujarat", lat: 23.0225, lng: 72.5714 },
    { name: "Jaipur", state: "Rajasthan", lat: 26.9124, lng: 75.7873 },
    { name: "Lucknow", state: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
    { name: "Kochi", state: "Kerala", lat: 9.9312, lng: 76.2534 },
    { name: "Goa", state: "Goa", lat: 15.2993, lng: 73.9892 },
    { name: "Surat", state: "Gujarat", lat: 21.1702, lng: 72.8311 },
    { name: "Bhubaneswar", state: "Odisha", lat: 20.2961, lng: 85.8245 },
  ]

  const fetchWeatherData = async (locationName: string) => {
    setIsLoading(true)
    try {
      const location = locations.find(l => l.name === locationName)
      if (!location) return

      const weather = await getCurrentWeatherByCity(locationName)

      setWeatherData(weather.current)
      setForecastData(weather.forecast)
      setAlerts((weather as any).severity?.alerts || [])
    } catch (error) {
      toast.error("Failed to fetch weather data")
      setWeatherData(null)
      setForecastData(null)
      setAlerts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedLocation) {
      fetchWeatherData(selectedLocation)
    }
  }, [selectedLocation])

  const handleSearch = (query: string) => {
    setIsSearching(true)
    const found = locations.find(l => l.name.toLowerCase() === query.toLowerCase())
    if (found) {
      setSelectedLocation(found.name)
      setIsSearching(false)
    } else {
      toast.error("Location not found")
      setIsSearching(false)
    }
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    if (darkMode) {
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-200/50 dark:border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <Menu className="w-6 h-6 text-gray-800 dark:text-white" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <SunIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">WeatherGPT</h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">AI-Powered Forecasting</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search Bar */}
              <div className="hidden md:flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition-all">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search location..."
                  className="bg-transparent border-none outline-none text-sm w-48 text-gray-900 dark:text-white placeholder-gray-400"
                  value={selectedLocation || ""}
                  onChange={(e) => {
                    setSelectedLocation(e.target.value)
                    setIsSearching(false)
                  }}
                />
              </div>

              {/* Mobile Search */}
              <div className="flex md:hidden items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-700">
                <Search className="w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="City..."
                  className="bg-transparent border-none outline-none text-sm w-32 text-gray-900 dark:text-white"
                  value={selectedLocation || ""}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                />
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                {darkMode ? (
                  <SunIcon className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Weather Card */}
          <div className="lg:col-span-2 space-y-6">
            {/* Severity Alert Banner */}
            <SeverityBanner
              severity={weatherData?.severity || 'normal'}
              alerts={alerts}
            />

            <WeatherCard weather={weatherData} isLoading={isLoading} />

            {/* Forecast */}
            {forecastData && forecastData.daily && (
              <div className="glass rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Cloud className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">7-Day Forecast</h2>
                </div>
                <div className="space-y-3">
                  {forecastData.daily.map((day: any, index: number) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-gray-200/30 dark:border-white/5 last:border-0">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{day.date}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {day.weather_code === 0 && '☀️'}
                          {day.weather_code === 1 && '🌤️'}
                          {day.weather_code === 2 && '⛅'}
                          {day.weather_code === 3 && '☁️'}
                          {(day.weather_code === 61 || day.weather_code === 63 || day.weather_code === 65) && '🌧️'}
                          {(day.weather_code === 95 || day.weather_code === 96 || day.weather_code === 99) && '⛈️'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{day.temperature_min}°</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{day.temperature_max}°</span>
                        <span className="text-sm text-blue-600 dark:text-blue-400">
                          {day.precipitation_probability}% 🌧️
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {day.wind_speed_max} km/h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Location Selector */}
            <LocationSelector
              locations={locations}
              selectedLocation={selectedLocation}
              onSelect={setSelectedLocation}
            />

            {/* Language Selector */}
            <LanguageSelector onLanguageChange={setLanguage} />

            {/* Role Selector */}
            <RoleSelector value={role} onChange={setRole} />

            {/* Chat Interface */}
            <div className="glass rounded-2xl p-6 border border-gray-200/50 dark:border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ask WeatherGPT</h2>
              </div>
              <ChatInterface
                location={selectedLocation || "your location"}
                role={role}
                language={language}
              />
            </div>

            {/* Data Source Info */}
            <div className="glass rounded-2xl p-4 border border-gray-200/50 dark:border-white/10">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-purple-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Powered by</h3>
              </div>
              <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded">Open-Meteo</span>
                  <span>Live weather data</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded">3-Tier LLM</span>
                  <span>Groq → Gemini → Ollama</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded">Grounded</span>
                  <span>No hallucinated data</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Search Dropdown */}
      {isSearching && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden flex items-start justify-center pt-20">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 w-[90%] max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
            <div className="space-y-2">
              {locations.map((location) => (
                <button
                  key={location.name}
                  onClick={() => handleSearch(location.name)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{location.name}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">{location.state}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200/50 dark:border-white/10 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            WeatherGPT © 2026. AI-powered weather forecasting with multilingual support.
          </p>
        </div>
      </footer>
    </div>
  )
}