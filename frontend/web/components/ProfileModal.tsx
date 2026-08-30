"use client"

import React, { useState, useEffect } from "react"
import { X, MapPin, Languages, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation, SUPPORTED_LANGUAGES } from "@/lib/i18n"
import { updateUserProfile } from "@/lib/api"
import LocationSelector from "@/components/LocationSelector"
import { toast } from "react-hot-toast"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  email: string
  currentLocation: string
  currentLanguage: string
  onProfileUpdated: (newLocation: string, newLanguage: string) => void
}

export default function ProfileModal({
  isOpen,
  onClose,
  email,
  currentLocation,
  currentLanguage,
  onProfileUpdated,
}: ProfileModalProps) {
  const { t, setLanguage } = useTranslation()
  const [location, setLocation] = useState(currentLocation || "Delhi")
  const [languageCode, setLanguageCode] = useState(currentLanguage || "en")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setLocation(currentLocation || "Delhi")
      setLanguageCode(currentLanguage || "en")
    }
  }, [isOpen, currentLocation, currentLanguage])

  if (!isOpen) return null

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // 1. Persist locally first
      localStorage.setItem("weathergpt_location", location)
      localStorage.setItem("weathergpt_language", languageCode)
      setLanguage(languageCode)

      // 2. Synchronize to backend
      if (email) {
        await updateUserProfile(email, location, languageCode).catch((err) => {
          console.warn("Backend sync failed, locally cached:", err)
        })
      }

      // 3. Refresh app state & close
      onProfileUpdated(location, languageCode)
      toast.success(t("saved_success"))
      onClose()
    } catch (error) {
      toast.error("Failed to save profile changes")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-2xl border border-gray-200 dark:border-yellow-500/20 space-y-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("profile")}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form - Limited strictly to Location & Language */}
        <form onSubmit={handleSave} className="space-y-5">
          {/* Location Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-yellow-500" />
              {t("location")}
            </label>
            <LocationSelector
              selectedLocation={location}
              onSelect={(loc) => setLocation(loc)}
            />
          </div>

          {/* Language Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              <Languages className="w-3.5 h-3.5 text-yellow-500" />
              {t("language")}
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto p-1 scrollbar-thin">
              {SUPPORTED_LANGUAGES.map((lang) => {
                const isSelected = languageCode === lang.code
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => setLanguageCode(lang.code)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-yellow-400/10 border-yellow-500 text-yellow-900 dark:text-yellow-300 font-bold"
                        : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    <span className="truncate">
                      {lang.flag} {lang.nativeName}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-yellow-500 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSaving}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold h-11 rounded-2xl shadow-lg transition-all"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("saving")}
                </>
              ) : (
                t("save_changes")
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
