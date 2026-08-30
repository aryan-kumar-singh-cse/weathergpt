"use client"

import { useState } from "react"
import { MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface Location {
  name: string
  state: string
  lat: number
  lng: number
}

interface LocationSelectorProps {
  locations: Location[]
  selectedLocation: string
  onSelect: (location: string) => void
}

export default function LocationSelector({
  locations,
  selectedLocation,
  onSelect,
}: LocationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between bg-white dark:bg-gray-900 border-gray-200 dark:border-yellow-500/20 hover:bg-yellow-50 dark:hover:bg-yellow-900/10"
        >
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-900 dark:text-white">
              {selectedLocation || "Select Location"}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-yellow-500/20" align="start">
        <div className="max-h-[300px] overflow-y-auto">
          {locations.map((location) => (
            <button
              key={location.name}
              onClick={() => {
                onSelect(location.name)
                setIsOpen(false)
              }}
              className={`w-full px-4 py-3 text-left hover:bg-yellow-50 dark:hover:bg-yellow-900/10 transition-colors ${
                selectedLocation === location.name
                  ? 'bg-yellow-100 dark:bg-yellow-900/20'
                  : ''
              }`}
            >
              <div className="font-medium text-gray-900 dark:text-white">
                {location.name}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {location.state}
              </div>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
