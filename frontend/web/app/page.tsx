"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Cloud, Moon, Sun, User, Settings, LogOut, ShieldAlert } from "lucide-react"
import { toast } from "react-hot-toast"
import { useTheme } from "next-themes"
import ErrorBoundary from "@/components/ErrorBoundary"
import ThemeProvider from "@/components/ThemeProvider"
import { LanguageProvider, useTranslation } from "@/lib/i18n"
import WeatherCard from "@/components/WeatherCard"
import ChatInterface from "@/components/ChatInterface"
import LocationSelector from "@/components/LocationSelector"
import RoleSelector from "@/components/RoleSelector"
import SeverityBanner from "@/components/SeverityBanner"
import LoginCard from "@/components/LoginCard"
import ProfileModal from "@/components/ProfileModal"
import { getCurrentWeatherByCity, get30DayOutlook, getUserStatus } from "@/lib/api"
import { findCityDetails } from "@/lib/india-locations"
import { ForecastDay, Outlook30Data } from "@/lib/types"

function MainDashboard() {
  const { theme, setTheme } = useTheme()
  const { t, language, setLanguage } = useTranslation()
  const [mounted, setMounted] = useState(false)

  // Authentication State
  const [authState, setAuthState] = useState<"checking" | "authenticated" | "unauthenticated">("checking")
  const [userEmail, setUserEmail] = useState("")
  const [userName, setUserName] = useState("")
  const [userOccupation, setUserOccupation] = useState("")

  // Location & Preferences
  const [selectedLocation, setSelectedLocation] = useState("Delhi")
  const [role, setRole] = useState("citizen")
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  // Weather Data State
  const [currentWeather, setCurrentWeather] = useState<any>(null)
  const [forecastDays, setForecastDays] = useState<ForecastDay[]>([])
  const [outlook30, setOutlook30] = useState<Outlook30Data | null>(null)
  const [alerts, setAlerts] = useState<string[]>([])
  const [severityLevel, setSeverityLevel] = useState<"normal" | "watch" | "warning" | "severe" | "extreme">("normal")
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Check stored credentials on mount (prefer locally persisted values, verify session via backend)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedEmail = localStorage.getItem("weathergpt_email")
        const storedName = localStorage.getItem("weathergpt_name") || ""
        const storedOccupation = localStorage.getItem("weathergpt_occupation") || ""
        const storedLocation = localStorage.getItem("weathergpt_location") || "Delhi"
        const storedLanguage = localStorage.getItem("weathergpt_language") || "en"

        if (storedEmail) {
          // Immediately populate local values for display
          setUserEmail(storedEmail)
          setUserName(storedName)
          setUserOccupation(storedOccupation)
          setSelectedLocation(storedLocation)
          setLanguage(storedLanguage)

          // Verify session with backend
          try {
            const status = await getUserStatus(storedEmail)
            if (status && status.exists) {
              setAuthState("authenticated")
            } else {
              setAuthState("unauthenticated")
            }
          } catch (backendError) {
            // Backend offline/unreachable: trust local cached credentials
            setAuthState("authenticated")
          }
        } else {
          setAuthState("unauthenticated")
        }
      } catch (error) {
        setAuthState("unauthenticated")
      }
    }

    initAuth()
  }, [setLanguage])

  // Fetch weather data when location changes
  const fetchWeather = useCallback(async (city: string) => {
    setIsLoadingWeather(true)
    try {
      const cityDetails = findCityDetails(city)
      const lat = cityDetails?.lat
      const lng = cityDetails?.lng

      // 1. Current Weather
      const weatherRes = await getCurrentWeatherByCity(city)
      setCurrentWeather(weatherRes.current || null)

      // 2. 7-Day Forecast
      const forecast = weatherRes.forecast?.daily || []
      setForecastDays(forecast)

      // 3. 30-Day Outlook
      try {
        const outlookRes = await get30DayOutlook(lat, lng, city)
        setOutlook30(outlookRes)
      } catch (e) {
        setOutlook30(null)
      }

      // 4. Alerts & Severity
      const alertList = (weatherRes.severity?.alerts as string[]) || []
      setAlerts(alertList)
      setSeverityLevel(weatherRes.severity?.severity || "normal")
    } catch (error: any) {
      toast.error(error?.message || "Failed to load weather data")
    } finally {
      setIsLoadingWeather(false)
    }
  }, [])

  useEffect(() => {
    if (authState === "authenticated" && selectedLocation) {
      fetchWeather(selectedLocation)
    }
  }, [authState, selectedLocation, fetchWeather])

  const handleLoginSuccess = (
    email: string,
    occupation: string,
    name?: string,
    location?: string,
    prefLang?: string
  ) => {
    setUserEmail(email)
    setUserOccupation(occupation)
    if (name) setUserName(name)
    if (location) setSelectedLocation(location)
    if (prefLang) setLanguage(prefLang)
    setAuthState("authenticated")
    toast.success(`Welcome to WeatherGPT!`)
  }

  const handleLogout = () => {
    localStorage.removeItem("weathergpt_email")
    localStorage.removeItem("weathergpt_name")
    localStorage.removeItem("weathergpt_occupation")
    setAuthState("unauthenticated")
    setUserEmail("")
    setUserName("")
    setUserOccupation("")
    toast.success("Logged out successfully")
  }

  const handleLocationSelect = (loc: string) => {
    setSelectedLocation(loc)
    localStorage.setItem("weathergpt_location", loc)
    toast.success(`Location set to ${loc}`)
  }

  const handleProfileUpdated = (newLocation: string, newLang: string) => {
    setSelectedLocation(newLocation)
    setLanguage(newLang)
  }

  if (authState === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-2xl mx-auto animate-pulse">
            <Cloud className="w-8 h-8 text-black" />
          </div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t("loading")}
          </p>
        </div>
      </div>
    )
  }

  if (authState === "unauthenticated") {
    return <LoginCard onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black text-gray-900 dark:text-gray-100 transition-colors duration-300 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-yellow-500/20">
        <div className="container mx-auto px-4 py-3.5 flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <Cloud className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                WeatherGPT
              </h1>
              <p className="text-[11px] font-semibold text-yellow-600 dark:text-yellow-400">
                {t("app_subtitle")}
              </p>
            </div>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* User Badge */}
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-semibold transition-all group"
            >
              <User className="w-3.5 h-3.5 text-yellow-500" />
              <span className="max-w-[120px] truncate">{userName || userOccupation || userEmail}</span>
              <Settings className="w-3.5 h-3.5 text-gray-400 group-hover:text-yellow-500 transition-colors ml-0.5" />
            </button>

            {/* Dark Mode Switcher */}
            {mounted && (
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 text-yellow-400" />
                ) : (
                  <Moon className="w-4 h-4 text-gray-600" />
                )}
              </button>
            )}

            {/* Logout Button */}
            <button
              type="button"
              onClick={handleLogout}
              className="p-2.5 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
              title={t("logout")}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="container mx-auto px-4 py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Weather Intelligence & Forecasts (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Severity Alert Banner */}
            <SeverityBanner severity={severityLevel} alerts={alerts} />

            {/* Main Weather Card (Current + 7-day + 30-day) */}
            <WeatherCard
              weather={currentWeather}
              forecastDays={forecastDays}
              outlook30={outlook30}
              locationName={selectedLocation}
              isLoading={isLoadingWeather}
            />
          </div>

          {/* Right Column: Location, Persona & AI Chat (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Location Selector (State -> City hierarchical overlay) */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-4 border border-gray-200 dark:border-yellow-500/20 shadow-xl space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {t("location")}
              </div>
              <LocationSelector
                selectedLocation={selectedLocation}
                onSelect={handleLocationSelect}
              />
            </div>

            {/* Persona / Role Selector */}
            <RoleSelector value={role} onChange={setRole} />

            {/* AI Conversational Assistant */}
            <ChatInterface
              location={selectedLocation}
              role={role}
              language={language}
              email={userEmail}
              onAuthError={() => setAuthState("unauthenticated")}
            />
          </div>
        </div>
      </main>

      {/* Profile Management Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        email={userEmail}
        currentLocation={selectedLocation}
        currentLanguage={language}
        onProfileUpdated={handleProfileUpdated}
      />

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-yellow-500/20 py-4 bg-white/50 dark:bg-gray-950/50 backdrop-blur-sm mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 dark:text-gray-400 gap-2">
          <span>WeatherGPT © 2026 • SIH26068 AI Weather Intelligence</span>
          <span>Zero-Config Multi-Tier LLM Architecture</span>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <LanguageProvider>
          <MainDashboard />
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
