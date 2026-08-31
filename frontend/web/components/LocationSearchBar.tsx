"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, X, MapPin, Loader2, Sparkles, Clock, Globe } from "lucide-react";

type Props = {
  onSelectCity: (city: string) => void;
  currentCity?: string;
};

const POPULAR_CITIES = [
  { name: "Mumbai", state: "Maharashtra", country: "India" },
  { name: "Delhi", state: "National Capital", country: "India" },
  { name: "Bengaluru", state: "Karnataka", country: "India" },
  { name: "Jaipur", state: "Rajasthan", country: "India" },
  { name: "Shimla", state: "Himachal Pradesh", country: "India" },
  { name: "Goa", state: "Goa", country: "India" },
  { name: "London", state: "England", country: "UK" },
  { name: "Paris", state: "Île-de-France", country: "France" },
  { name: "Tokyo", state: "Kanto", country: "Japan" },
  { name: "Dubai", state: "Dubai", country: "UAE" },
  { name: "New York", state: "New York", country: "USA" },
  { name: "Singapore", state: "Central", country: "Singapore" },
];

export default function LocationSearchBar({
  onSelectCity,
  currentCity,
}: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("weathergpt_recent_searches");
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {}
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

  const handleSelect = (cityName: string) => {
    if (!cityName.trim()) return;
    const cleanCity = cityName.trim();

    // Save to recents
    const updated = [cleanCity, ...recentSearches.filter((c) => c.toLowerCase() !== cleanCity.toLowerCase())].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem("weathergpt_recent_searches", JSON.stringify(updated));
    } catch {}

    setQuery("");
    setIsOpen(false);
    onSelectCity(cleanCity);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      handleSelect(query);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const filteredCities = query.trim()
    ? POPULAR_CITIES.filter(
        (c) =>
          c.name.toLowerCase().includes(query.toLowerCase()) ||
          c.state.toLowerCase().includes(query.toLowerCase()) ||
          c.country.toLowerCase().includes(query.toLowerCase())
      )
    : POPULAR_CITIES;

  return (
    <div ref={containerRef} className="relative z-30 w-full max-w-xs md:max-w-sm">
      {/* Search Input Box */}
      <div
        className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl
                   bg-black/75 backdrop-blur-2xl border transition-all duration-200 shadow-lg ${
                     isOpen
                       ? "border-yellow-400 bg-black/95 ring-2 ring-yellow-400/20"
                       : "border-yellow-400/30 hover:border-yellow-400/60"
                   }`}
      >
        <Search className="w-4 h-4 text-yellow-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search any global city..."
          className="flex-1 bg-transparent text-white placeholder-gray-500 text-xs font-mono outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="text-gray-400 hover:text-white p-0.5 rounded-full cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Auto-suggest Dropdown Modal */}
      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-2 rounded-2xl
                     bg-black/95 backdrop-blur-2xl border border-yellow-400/30
                     shadow-2xl shadow-black p-3 text-white font-mono animate-fade-in max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/30"
        >
          {/* Custom typed search action */}
          {query.trim() && (
            <button
              onClick={() => handleSelect(query)}
              className="w-full text-left p-2.5 rounded-xl bg-yellow-400/15 hover:bg-yellow-400/25 border border-yellow-400/40 text-yellow-300 text-xs flex items-center justify-between transition cursor-pointer mb-2"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-yellow-400" />
                <span>Search for &quot;{query}&quot;</span>
              </div>
              <span className="text-[10px] text-gray-400">Press Enter ↵</span>
            </button>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && !query.trim() && (
            <div className="mb-3">
              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5 mb-1.5 px-1">
                <Clock className="w-3 h-3 text-yellow-400" />
                <span>Recent Searches</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recentSearches.map((city, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(city)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-gray-900 border border-white/10 hover:border-yellow-400/40 text-gray-200 hover:text-yellow-300 transition cursor-pointer flex items-center gap-1"
                  >
                    <MapPin className="w-3 h-3 text-yellow-400/70" />
                    <span>{city}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular / Suggested Cities */}
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider flex items-center gap-1.5 mb-1.5 px-1">
              <Globe className="w-3 h-3 text-yellow-400" />
              <span>{query.trim() ? "Matching Locations" : "Popular Hubs"}</span>
            </span>
            <div className="space-y-1">
              {filteredCities.map((city, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(city.name)}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-yellow-400/10 hover:border-yellow-400/30 border border-transparent text-xs flex items-center justify-between transition cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-yellow-400 transition" />
                    <span className="font-semibold text-white group-hover:text-yellow-300 transition">
                      {city.name}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      • {city.state}, {city.country}
                    </span>
                  </div>
                  {currentCity?.toLowerCase() === city.name.toLowerCase() && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-bold">
                      ACTIVE
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
