"use client"

import React, { useState, useEffect, useRef } from "react"
import { MapPin, ChevronDown, ChevronRight, ArrowLeft, Search, Check, Navigation, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { INDIA_LOCATIONS, StateInfo, CityInfo } from "@/lib/india-locations"
import { useTranslation } from "@/lib/i18n"
import { reverseGeocode } from "@/lib/api"
import { toast } from "react-hot-toast"

interface LocationSelectorProps {
  selectedLocation: string
  onSelect: (location: string, stateName?: string, lat?: number, lng?: number) => void
}

export default function LocationSelector({
  selectedLocation,
  onSelect,
}: LocationSelectorProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [selectedState, setSelectedState] = useState<StateInfo | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLocating, setIsLocating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset internal state whenever opened or closed
  const toggleOpen = () => {
    if (!isOpen) {
      setSelectedState(null)
      setSearchQuery("")
      setIsOpen(true)
    } else {
      setIsOpen(false)
      setSelectedState(null)
      setSearchQuery("")
    }
  }

  // Real-time GPS Detection (like Google Maps)
  const handleGPSDetect = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser")
      return
    }

    setIsLocating(true)
    const toastId = toast.loading("Detecting your exact GPS location...")

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          const geoRes = await reverseGeocode(latitude, longitude)
          const detectedCity = geoRes.city || "Delhi"
          const detectedState = geoRes.state || ""

          onSelect(detectedCity, detectedState, latitude, longitude)
          toast.success(`📍 Located in ${detectedCity}${detectedState ? `, ${detectedState}` : ""}`, { id: toastId })
          setIsOpen(false)
          setSelectedState(null)
          setSearchQuery("")
        } catch (err) {
          toast.error("Could not resolve location name from GPS coordinates", { id: toastId })
        } finally {
          setIsLocating(false)
        }
      },
      (error) => {
        setIsLocating(false)
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please allow location access in your browser settings.", { id: toastId })
        } else {
          toast.error("Failed to acquire GPS position.", { id: toastId })
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  }

  // Handle outside click to close popover without layout shift
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedState(null)
        setSearchQuery("")
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Focus search input on step change
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen, selectedState])

  // Filter states or cities based on query
  const filteredStates = INDIA_LOCATIONS.filter(
    (s) =>
      s.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.state_local && s.state_local.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredCities = selectedState
    ? selectedState.cities.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.name_local && c.name_local.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : []

  const handleStateClick = (state: StateInfo, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedState(state)
    setSearchQuery("")
  }

  const handleCityClick = (city: CityInfo, e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(city.name, selectedState?.state, city.lat, city.lng)
    setIsOpen(false)
    setSelectedState(null)
    setSearchQuery("")
  }

  const handleBackToStates = (e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedState(null)
    setSearchQuery("")
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {/* Trigger Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={toggleOpen}
          className="flex-1 justify-between bg-white dark:bg-gray-900 border-gray-200 dark:border-yellow-500/20 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 h-11 px-4 rounded-2xl shadow-sm transition-all"
          aria-haspopup="dialog"
          aria-expanded={isOpen}
        >
          <div className="flex items-center gap-2.5 overflow-hidden text-ellipsis whitespace-nowrap">
            <MapPin className="w-4 h-4 text-yellow-500 shrink-0" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {selectedLocation || t("select_location")}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </Button>

        {/* Instant Live GPS Button */}
        <Button
          type="button"
          onClick={handleGPSDetect}
          disabled={isLocating}
          title="Detect live GPS location like Google Maps"
          className="h-11 px-3.5 bg-yellow-400 hover:bg-yellow-500 text-black font-bold rounded-2xl shadow-sm transition-all shrink-0"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Floating Overlay Popover - Absolute positioning with high z-index */}
      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-full min-w-[320px] max-w-[380px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-yellow-500/30 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
          style={{ willChange: "transform, opacity" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header & GPS Quick Action */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 space-y-2">
            {/* GPS Auto-Detect Row */}
            <button
              type="button"
              onClick={handleGPSDetect}
              disabled={isLocating}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-950 dark:text-yellow-200 border border-yellow-400/40 rounded-xl text-xs font-bold transition-all"
            >
              {isLocating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-600 dark:text-yellow-400" />
                  <span>Detecting GPS Location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                  <span>Use Current Live Location (GPS)</span>
                </>
              )}
            </button>

            {selectedState ? (
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleBackToStates}
                  className="flex items-center gap-1.5 text-xs font-bold text-yellow-600 dark:text-yellow-400 hover:underline px-1 py-0.5 rounded focus:outline-none"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {t("back_to_states")}
                </button>
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {selectedState.state}
                </span>
              </div>
            ) : (
              <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-1 pt-1">
                Or Select State & City
              </div>
            )}

            {/* Search Input with event propagation stoppage */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  e.stopPropagation()
                  setSearchQuery(e.target.value)
                }}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                placeholder={selectedState ? t("search_city") : t("search_state")}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          {/* List Area */}
          <div className="max-h-[260px] overflow-y-auto p-1.5 scrollbar-thin scrollbar-thumb-yellow-400 dark:scrollbar-thumb-yellow-500">
            {!selectedState ? (
              // Step 1: States List
              filteredStates.length > 0 ? (
                filteredStates.map((state) => (
                  <button
                    key={state.state}
                    type="button"
                    onClick={(e) => handleStateClick(state, e)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-gray-900 dark:text-gray-100 transition-colors group"
                  >
                    <div>
                      <div className="font-semibold text-xs text-gray-900 dark:text-white group-hover:text-yellow-600 dark:group-hover:text-yellow-400">
                        {state.state}
                      </div>
                      {state.state_local && (
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {state.state_local} • {state.cities.length} cities
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-yellow-500 group-hover:translate-x-0.5 transition-all" />
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-gray-500">No states matching "{searchQuery}"</div>
              )
            ) : (
              // Step 2: Cities List
              filteredCities.length > 0 ? (
                filteredCities.map((city) => {
                  const isSelected = selectedLocation.toLowerCase() === city.name.toLowerCase()
                  return (
                    <button
                      key={city.name}
                      type="button"
                      onClick={(e) => handleCityClick(city, e)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left transition-colors ${
                        isSelected
                          ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 font-bold"
                          : "hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs">{city.name}</div>
                        {city.name_local && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">
                            {city.name_local} {city.district ? `• ${city.district}` : ""}
                          </div>
                        )}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />}
                    </button>
                  )
                })
              ) : (
                <div className="p-6 text-center text-xs text-gray-500">No cities matching "{searchQuery}"</div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
