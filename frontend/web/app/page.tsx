"use client"

import { useState, useEffect } from "react"
import { Search, Menu, Sun, Cloud, CloudRain, Wind, Droplets, Thermometer, MapPin, MessageSquare, Mic, Moon, Sun as SunIcon, Sparkles } from "lucide-react"
import { toast } from "react-hot-toast"
import { useTheme } from "next-themes"
import ErrorBoundary from "@/components/ErrorBoundary"
import ThemeProvider from "@/components/ThemeProvider"
import WeatherCard from "@/components/WeatherCard"
import ChatInterface from "@/components/ChatInterface"
import LocationSelector from "@/components/LocationSelector"
import LanguageSelector from "@/components/LanguageSelector"
import RoleSelector from "@/components/RoleSelector"
import SeverityBanner from "@/components/SeverityBanner"
import LoginCard from "@/components/LoginCard"
import { getCurrentWeatherByCity } from "@/lib/api"
import { AlertData, WeatherData, ForecastData } from "@/lib/types"

export default function Home() {
  // Theme management
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Authentication state - using proper state machine to avoid race conditions
  const [authState, setAuthState] = useState<'checking' | 'authenticated' | 'unauthenticated'>('checking')
  const [userEmail, setUserEmail] = useState<string>("")
  const [userOccupation, setUserOccupation] = useState<string>("")

  // App state
  const [selectedLocation, setSelectedLocation] = useState<string>("")
  const [isSearching, setIsSearching] = useState(false)
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [alerts, setAlerts] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
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

  // SSR-safe mounting flag
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check for stored credentials on mount and verify with backend
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedEmail = localStorage.getItem('weathergpt_email')
        const storedOccupation = localStorage.getItem('weathergpt_occupation')

        if (storedEmail && storedOccupation) {
          // Verify with backend that user still exists
          const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

          try {
            const response = await fetch(`${API_URL}/login/status?email=${encodeURIComponent(storedEmail)}`)

            if (response.ok) {
              // User exists in backend - use their current data
              const data = await response.json()
              setUserEmail(data.email)
              setUserOccupation(data.occupation)
              setAuthState('authenticated')
            } else {
              // User no longer exists - clear localStorage and show login
              localStorage.removeItem('weathergpt_email')
              localStorage.removeItem('weathergpt_occupation')
              setAuthState('unauthenticated')
            }
          } catch (backendError) {
            // Backend unreachable - trust localStorage for now
            console.warn('Backend unreachable, using cached credentials:', backendError)
            setUserEmail(storedEmail)
            setUserOccupation(storedOccupation)
            setAuthState('authenticated')
          }
        } else {
          setAuthState('unauthenticated')
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setAuthState('unauthenticated')
      }
    }

    checkAuth()
  }, [])

  const handleLoginSuccess = (email: string, occupation: string) => {
    setUserEmail(email)
    setUserOccupation(occupation)
    setAuthState('authenticated')
    toast.success('Welcome to WeatherGPT!')
  }

  const handleAuthError = () => {
    // Clear stored credentials and show login
    localStorage.removeItem('weathergpt_email')
    localStorage.removeItem('weathergpt_occupation')
    setAuthState('unauthenticated')
    setUserEmail("")
    setUserOccupation("")
    toast.error('Please login again')
  }

  const handleLogout = () => {
    localStorage.removeItem('weathergpt_email')
    localStorage.removeItem('weathergpt_occupation')
    setAuthState('unauthenticated')
    setUserEmail("")
    setUserOccupation("")
    toast.success('Logged out successfully')
  }

  const fetchWeatherData = async (locationName: string) => {
    setIsLoading(true)
    try {
      const location = locations.find(l => l.name === locationName)
      if (!location) return

      const weather = await getCurrentWeatherByCity(locationName)

      setWeatherData(weather)
      setForecastData(weather.forecast || null)
      // API returns alerts as string[], not AlertData[]
      setAlerts((weather.severity?.alerts as unknown as string[]) || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch weather data"
      toast.error(errorMessage)
      setWeatherData(null)
      setForecastData(null)
      setAlerts([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (selectedLocation && authState === 'authenticated') {
      fetchWeatherData(selectedLocation)
    }
  }, [selectedLocation, authState])

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
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  // Show loading state while checking authentication
  if (authState === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black gradient-mesh">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl mx-auto mb-4 animate-pulse">
            <Cloud className="w-8 h-8 text-black" />
          </div>
          <p className="text-gray-700 dark:text-gray-300 font-medium">Loading WeatherGPT...</p>
        </div>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (authState === 'unauthenticated') {
    return <LoginCard onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white dark:bg-black gradient-mesh transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b backdrop-blur-xl border-gray-200 dark:border-yellow-500/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/20">
                <Cloud className="w-7 h-7 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-black dark:text-white">WeatherGPT</h1>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Smart Weather Insights</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* User Info */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-900/80 rounded-full text-xs border border-gray-200 dark:border-yellow-500/20 shadow-sm">
                <span className="text-gray-700 dark:text-gray-300 font-semibold">{userOccupation}</span>
                <span className="text-gray-400 dark:text-gray-600">•</span>
                <button
                  onClick={handleLogout}
                  className="text-yellow-600 dark:text-yellow-400 hover:underline font-semibold transition-colors"
                >
                  Logout
                </button>
              </div>

              {/* Dark Mode Toggle */}
              {mounted && (
                <button
                  onClick={toggleDarkMode}
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors shadow-sm"
                  aria-label="Toggle dark mode"
                >
                  {theme === 'dark' ? (
                    <SunIcon className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Moon className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              )}
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
              severity={weatherData?.severity?.severity || 'normal'}
              alerts={alerts}
            />

            <WeatherCard weather={weatherData?.current || null} isLoading={isLoading} />

            {/* Forecast */}
            {forecastData?.daily && (
              <div className="glass rounded-3xl p-6 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Cloud className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">7-Day Forecast</h2>
                </div>
                <div className="space-y-3">
                  {forecastData.daily.map((day, index: number) => (
                    <div key={index} className="flex items-center justify-between py-3 border-b border-teal-200/30 dark:border-teal-900/30 last:border-0">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{day.date}</span>
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
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{day.temperature_min}°</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">{day.temperature_max}°</span>
                        <span className="text-sm text-teal-600 dark:text-teal-400 font-medium">
                          {day.precipitation_probability}% 🌧️
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
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

            {/* Chat Interface */}
            <div className="glass rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-yellow-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <MessageSquare className="w-5 h-5 text-black" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Ask WeatherGPT</h2>
              </div>
              <ChatInterface
                location={selectedLocation || "your location"}
                role="citizen"
                language={language}
                email={userEmail}
                onAuthError={handleAuthError}
              />
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
      <footer className="border-t border-gray-200 dark:border-yellow-500/20 mt-auto backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
            WeatherGPT © 2026. AI-powered weather forecasting with personalized responses.
          </p>
        </div>
      </footer>
      </div>
    </ErrorBoundary>
  )
}
