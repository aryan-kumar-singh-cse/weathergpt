"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Cloud, ArrowRight, User, Briefcase, MapPin, Languages, Loader2 } from "lucide-react"
import { login, getUserStatus } from "@/lib/api"
import { validateEmail, validateOccupation } from "@/lib/validation"
import { useTranslation, SUPPORTED_LANGUAGES } from "@/lib/i18n"
import LocationSelector from "@/components/LocationSelector"

interface LoginCardProps {
  onLoginSuccess: (email: string, occupation: string, name?: string, location?: string, language?: string) => void
}

export default function LoginCard({ onLoginSuccess }: LoginCardProps) {
  const { t, setLanguage } = useTranslation()
  const [step, setStep] = useState<"email" | "details">("email")
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [occupation, setOccupation] = useState("")
  const [location, setLocation] = useState("Delhi")
  const [selectedLang, setSelectedLang] = useState("en")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const emailValidation = validateEmail(email)
    if (!emailValidation.isValid) {
      setError(emailValidation.error || "Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      // Check if user exists in backend
      const normalizedEmail = email.trim().toLowerCase()
      const data = await getUserStatus(normalizedEmail)

      if (data && data.exists) {
        // Existing user: Save to localStorage and log in
        localStorage.setItem("weathergpt_email", data.email)
        if (data.name) localStorage.setItem("weathergpt_name", data.name)
        localStorage.setItem("weathergpt_occupation", data.occupation)
        if (data.location) localStorage.setItem("weathergpt_location", data.location)
        if (data.preferred_language) {
          localStorage.setItem("weathergpt_language", data.preferred_language)
          setLanguage(data.preferred_language)
        }

        onLoginSuccess(
          data.email,
          data.occupation,
          data.name,
          data.location || "Delhi",
          data.preferred_language || "en"
        )
      } else {
        setStep("details")
      }
    } catch (err: any) {
      // If 404 or new user, move to details step
      setStep("details")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const occupationValidation = validateOccupation(occupation)
    if (!occupationValidation.isValid) {
      setError(occupationValidation.error || "Please enter your occupation")
      return
    }

    setIsLoading(true)

    try {
      const normalizedEmail = email.trim().toLowerCase()
      const result = await login(
        normalizedEmail,
        occupation,
        name.trim() || undefined,
        location,
        selectedLang
      )

      // Save user session client-side
      localStorage.setItem("weathergpt_email", result.email)
      if (result.name) localStorage.setItem("weathergpt_name", result.name)
      localStorage.setItem("weathergpt_occupation", result.occupation)
      localStorage.setItem("weathergpt_location", result.location || location)
      localStorage.setItem("weathergpt_language", result.preferred_language || selectedLang)
      setLanguage(result.preferred_language || selectedLang)

      onLoginSuccess(
        result.email,
        result.occupation,
        result.name,
        result.location || location,
        result.preferred_language || selectedLang
      )
    } catch (err: any) {
      setError(err?.message || "Failed to create user account. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white dark:bg-black gradient-mesh transition-colors">
      <Card className="w-full max-w-md shadow-2xl border border-gray-200 dark:border-yellow-500/20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl">
        <CardHeader className="text-center space-y-3 pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-xl shadow-yellow-500/20 mx-auto">
            <Cloud className="w-9 h-9 text-black" />
          </div>
          <div>
            <CardTitle className="text-2xl font-black text-gray-900 dark:text-white">
              WeatherGPT
            </CardTitle>
            <CardDescription className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-1">
              Smart India Hackathon 2026 • AI Weather Intelligence
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          {step === "email" ? (
            // Step 1: Email Identification
            <form onSubmit={handleEmailCheck} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Email Address
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoFocus
                  className="h-11 rounded-2xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {error && (
                <div className="p-3 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-11 rounded-2xl shadow-lg transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            // Step 2: User Profile Setup
            <form onSubmit={handleRegistration} className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-[11px] font-bold uppercase text-gray-500">
                  Email Address
                </Label>
                <div className="flex items-center justify-between text-xs px-3.5 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium">
                  <span className="truncate text-gray-700 dark:text-gray-300">{email}</span>
                  <button
                    type="button"
                    onClick={() => setStep("email")}
                    className="text-yellow-600 dark:text-yellow-400 hover:underline font-bold text-[11px]"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-name" className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-yellow-500" />
                  Full Name (Optional)
                </Label>
                <Input
                  id="reg-name"
                  type="text"
                  placeholder="e.g. Aryan Singh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                  className="h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs"
                />
              </div>

              {/* Occupation */}
              <div className="space-y-1.5">
                <Label htmlFor="reg-occupation" className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-yellow-500" />
                  Occupation
                </Label>
                <Input
                  id="reg-occupation"
                  type="text"
                  placeholder="e.g. Wheat Farmer in Punjab, Commercial Pilot, Student"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  required
                  disabled={isLoading}
                  className="h-10 rounded-xl bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-xs"
                />
              </div>

              {/* Default Location */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-yellow-500" />
                  Preferred Location
                </Label>
                <LocationSelector
                  selectedLocation={location}
                  onSelect={(loc) => setLocation(loc)}
                />
              </div>

              {/* Preferred Language */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-yellow-500" />
                  Preferred Language
                </Label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-yellow-400"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name} ({lang.nativeName})
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="p-3 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-11 rounded-2xl shadow-lg transition-all mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting WeatherGPT...
                  </>
                ) : (
                  "Enter WeatherGPT"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
