"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Search,
  X,
  MapPin,
  Loader2,
  Navigation,
  Star,
  Clock,
  Globe,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  CloudSnow,
  Sparkles,
} from "lucide-react";

export type SearchLocationResult = {
  id: string;
  name: string;
  district?: string;
  state?: string;
  country?: string;
  countryCode?: string;
  flag?: string;
  lat: number;
  lng: number;
  temp?: number | null;
  weatherCode?: number;
  condition?: string;
};

type Props = {
  onSelectCity: (city: string, coords?: { lat: number; lng: number }) => void;
  currentCity?: string;
  onUseCurrentLocation?: () => void;
  isLocating?: boolean;
};

function renderMiniWeatherIcon(condition?: string) {
  const cond = (condition || "").toLowerCase();
  if (cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower")) {
    return <CloudRain className="w-3.5 h-3.5 text-cyan-400 shrink-0" />;
  }
  if (cond.includes("storm") || cond.includes("thunder")) {
    return <CloudLightning className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
  }
  if (cond.includes("snow") || cond.includes("ice")) {
    return <CloudSnow className="w-3.5 h-3.5 text-sky-200 shrink-0" />;
  }
  if (cond.includes("cloud") || cond.includes("overcast") || cond.includes("fog")) {
    return <Cloud className="w-3.5 h-3.5 text-gray-300 shrink-0" />;
  }
  return <Sun className="w-3.5 h-3.5 text-yellow-400 shrink-0" />;
}

export default function LocationSearchBar({
  onSelectCity,
  currentCity,
  onUseCurrentLocation,
  isLocating = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchLocationResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<SearchLocationResult[]>([]);
  const [favoriteCities, setFavoriteCities] = useState<SearchLocationResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load Recents and Favorites from LocalStorage
  useEffect(() => {
    try {
      const savedRecents = localStorage.getItem("weathergpt_recent_locations_v3");
      if (savedRecents) setRecentSearches(JSON.parse(savedRecents));

      const savedFavs = localStorage.getItem("weathergpt_favorite_locations_v3");
      if (savedFavs) {
        setFavoriteCities(JSON.parse(savedFavs));
      } else {
        // Default initial favorites with district details
        const defaultFavs: SearchLocationResult[] = [
          { id: "19.07-72.87", name: "Mumbai", district: "Mumbai Suburban", state: "Maharashtra", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 19.076, lng: 72.8777, temp: 27, condition: "Partly Cloudy" },
          { id: "28.61-77.20", name: "Delhi", district: "Central Delhi", state: "Delhi", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 28.6139, lng: 77.209, temp: 30, condition: "Clear Sky" },
          { id: "28.66-77.45", name: "Ghaziabad", district: "Ghaziabad District", state: "Uttar Pradesh", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 28.6692, lng: 77.4538, temp: 28, condition: "Mainly Clear" },
          { id: "12.97-77.59", name: "Bengaluru", district: "Bangalore Urban", state: "Karnataka", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 12.9716, lng: 77.5946, temp: 24, condition: "Rain" },
          { id: "11.68-76.13", name: "Wayanad", district: "Wayanad District", state: "Kerala", country: "India", countryCode: "IN", flag: "🇮🇳", lat: 11.6854, lng: 76.1320, temp: 22, condition: "Rain" },
          { id: "51.50--0.12", name: "London", district: "Greater London", state: "England", country: "United Kingdom", countryCode: "GB", flag: "🇬🇧", lat: 51.5074, lng: -0.1278, temp: 21, condition: "Partly Cloudy" },
        ];
        setFavoriteCities(defaultFavs);
      }
    } catch {}
  }, []);

  // Global Keyboard Shortcut: Ctrl + K or / to focus search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === "/" && document.activeElement !== inputRef.current && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Live Geocoding API Query
  const fetchSearchResults = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(searchTerm)}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results || []);
      setSelectedIndex(-1);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (val.trim().length >= 2) {
      setIsLoading(true);
      debounceTimerRef.current = setTimeout(() => {
        fetchSearchResults(val.trim());
      }, 250);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  };

  const handleSelectLocation = (loc: SearchLocationResult) => {
    // Add to recent searches
    const updated = [loc, ...recentSearches.filter((item) => item.name.toLowerCase() !== loc.name.toLowerCase())].slice(0, 6);
    setRecentSearches(updated);
    try {
      localStorage.setItem("weathergpt_recent_locations_v3", JSON.stringify(updated));
    } catch {}

    setQuery("");
    setResults([]);
    setIsOpen(false);
    onSelectCity(loc.name, { lat: loc.lat, lng: loc.lng });
  };

  const toggleFavorite = (e: React.MouseEvent, loc: SearchLocationResult) => {
    e.stopPropagation();
    const isFav = favoriteCities.some((f) => f.name.toLowerCase() === loc.name.toLowerCase());
    let updated: SearchLocationResult[];
    if (isFav) {
      updated = favoriteCities.filter((f) => f.name.toLowerCase() !== loc.name.toLowerCase());
    } else {
      updated = [loc, ...favoriteCities].slice(0, 8);
    }
    setFavoriteCities(updated);
    try {
      localStorage.setItem("weathergpt_favorite_locations_v3", JSON.stringify(updated));
    } catch {}
  };

  const clearRecentHistory = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem("weathergpt_recent_locations_v3");
    } catch {}
  };

  // Keyboard navigation through suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const listToNavigate = results.length > 0 ? results : recentSearches.length > 0 ? recentSearches : favoriteCities;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < listToNavigate.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : listToNavigate.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && listToNavigate[selectedIndex]) {
        handleSelectLocation(listToNavigate[selectedIndex]);
      } else if (query.trim()) {
        if (results.length > 0) {
          handleSelectLocation(results[0]);
        } else {
          onSelectCity(query.trim());
          setIsOpen(false);
          setQuery("");
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative z-30 w-full max-w-sm md:max-w-md">
      {/* Main Frosted Search Input Pill */}
      <div
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl
                   bg-black/80 backdrop-blur-2xl border transition-all duration-200 shadow-xl ${
                     isOpen
                       ? "border-yellow-400 bg-black/95 ring-2 ring-yellow-400/25 shadow-yellow-400/10"
                       : "border-yellow-400/35 hover:border-yellow-400/70"
                   }`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 text-yellow-400 animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-yellow-400 shrink-0" />
        )}

        <input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search district, city, state, or country..."
          className="flex-1 bg-transparent text-white placeholder-gray-500 text-xs font-mono outline-none"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              inputRef.current?.focus();
            }}
            className="text-gray-400 hover:text-white p-1 rounded-full cursor-pointer transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white/10 rounded border border-white/10">
            Ctrl K
          </kbd>
        )}
      </div>

      {/* Rich Dropdown Panel */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl
                     bg-black/95 backdrop-blur-3xl border border-yellow-400/35
                     shadow-2xl shadow-black p-2.5 text-white font-mono animate-fade-in max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/40"
        >
          {/* Quick GPS Location Row */}
          {onUseCurrentLocation && (
            <button
              onClick={() => {
                setIsOpen(false);
                onUseCurrentLocation();
              }}
              disabled={isLocating}
              className="w-full text-left p-2.5 rounded-xl bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-400/30 text-yellow-300 text-xs flex items-center justify-between transition cursor-pointer mb-2 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-yellow-400/20 flex items-center justify-center text-yellow-400">
                  <Navigation className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-semibold text-white group-hover:text-yellow-300 transition">
                    Current Location (GPS)
                  </span>
                  <p className="text-[10px] text-gray-400 font-sans">
                    Use high-accuracy live device geocoding
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-bold">
                {isLocating ? "LOCATING..." : "GPS"}
              </span>
            </button>
          )}

          {/* 1. Live Query Search Results */}
          {query.trim().length >= 2 ? (
            <div>
              <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between border-b border-white/10 mb-1">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-yellow-400" />
                  <span>Matching Districts & Locations</span>
                </span>
                {results.length > 0 && (
                  <span className="text-[10px] text-yellow-400/80">{results.length} found</span>
                )}
              </div>

              {isLoading && results.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                  <span>Searching global meteorological database...</span>
                </div>
              ) : results.length === 0 ? (
                <div className="py-5 text-center text-xs text-gray-400">
                  <p>No locations found matching &quot;{query}&quot;.</p>
                  <button
                    onClick={() => {
                      onSelectCity(query.trim());
                      setIsOpen(false);
                      setQuery("");
                    }}
                    className="mt-2 text-xs font-mono text-yellow-400 hover:underline"
                  >
                    Search WeatherGPT for &quot;{query.trim()}&quot; ↵
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((loc, idx) => {
                    const isFav = favoriteCities.some((f) => f.name.toLowerCase() === loc.name.toLowerCase());
                    const isSelected = selectedIndex === idx;
                    const isActive = currentCity?.toLowerCase() === loc.name.toLowerCase();

                    return (
                      <div
                        key={loc.id || idx}
                        onClick={() => handleSelectLocation(loc)}
                        className={`w-full p-2.5 rounded-xl border text-xs flex items-center justify-between transition cursor-pointer group ${
                          isSelected
                            ? "bg-yellow-400/20 border-yellow-400/60"
                            : "bg-gray-950/80 border-white/5 hover:border-yellow-400/40 hover:bg-yellow-400/10"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <span className="text-base shrink-0 select-none">{loc.flag || "📍"}</span>
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-white group-hover:text-yellow-300 transition truncate">
                                {loc.name}
                              </span>
                              {loc.district && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-sans">
                                  {loc.district}
                                </span>
                              )}
                              {isActive && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-bold">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-gray-400 truncate">
                              {loc.district ? `${loc.district}, ` : ""}
                              {loc.state ? `${loc.state}, ` : ""}
                              {loc.country || ""}
                            </p>
                          </div>
                        </div>

                        {/* Live Temperature Preview & Favorite Star */}
                        <div className="flex items-center gap-2.5 shrink-0">
                          {loc.temp !== undefined && loc.temp !== null && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 border border-white/10">
                              {renderMiniWeatherIcon(loc.condition)}
                              <span className="font-bold text-white text-xs">{loc.temp}°C</span>
                            </div>
                          )}

                          <button
                            onClick={(e) => toggleFavorite(e, loc)}
                            title={isFav ? "Remove from favorites" : "Add to favorites"}
                            className="p-1 rounded-lg hover:bg-white/10 transition text-gray-400 hover:text-yellow-400"
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? "text-yellow-400 fill-yellow-400" : ""}`} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* 2. Recent Searches Section */}
              {recentSearches.length > 0 && (
                <div className="mb-3">
                  <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center justify-between border-b border-white/10 mb-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-yellow-400" />
                      <span>Recent Searches</span>
                    </span>
                    <button
                      onClick={clearRecentHistory}
                      className="text-[10px] text-gray-400 hover:text-red-400 transition cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  <div className="space-y-1">
                    {recentSearches.map((loc, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full px-2.5 py-2 rounded-xl bg-gray-950/60 border border-white/5 hover:border-yellow-400/40 hover:bg-yellow-400/10 text-xs flex items-center justify-between transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm shrink-0">{loc.flag || "📍"}</span>
                          <span className="font-semibold text-white group-hover:text-yellow-300 transition">
                            {loc.name}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate">
                            • {loc.district ? `${loc.district}, ` : ""}{loc.state ? `${loc.state}, ` : ""}{loc.country}
                          </span>
                        </div>

                        {loc.temp !== undefined && loc.temp !== null && (
                          <span className="font-bold text-yellow-400/90 text-xs">{loc.temp}°C</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Favorite / Popular Hubs Section */}
              <div>
                <div className="px-2 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5 border-b border-white/10 mb-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400/30" />
                  <span>Favorite & Popular Hubs</span>
                </div>

                <div className="space-y-1">
                  {favoriteCities.map((loc, idx) => {
                    const isFav = favoriteCities.some((f) => f.name.toLowerCase() === loc.name.toLowerCase());
                    const isActive = currentCity?.toLowerCase() === loc.name.toLowerCase();

                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectLocation(loc)}
                        className="w-full px-2.5 py-2 rounded-xl bg-gray-950/60 border border-white/5 hover:border-yellow-400/40 hover:bg-yellow-400/10 text-xs flex items-center justify-between transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm shrink-0">{loc.flag || "📍"}</span>
                          <span className="font-semibold text-white group-hover:text-yellow-300 transition">
                            {loc.name}
                          </span>
                          <span className="text-[10px] text-gray-400 truncate">
                            • {loc.district ? `${loc.district}, ` : ""}{loc.state ? `${loc.state}, ` : ""}{loc.country}
                          </span>
                          {isActive && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-yellow-400/20 text-yellow-400 font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {loc.temp !== undefined && loc.temp !== null && (
                            <span className="font-bold text-gray-200 group-hover:text-yellow-400 transition text-xs">
                              {loc.temp}°C
                            </span>
                          )}
                          <button
                            onClick={(e) => toggleFavorite(e, loc)}
                            className="p-0.5 text-yellow-400/80 hover:text-yellow-400"
                          >
                            <Star className="w-3 h-3 fill-yellow-400" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
