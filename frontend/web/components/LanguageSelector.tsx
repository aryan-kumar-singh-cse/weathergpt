"use client"

import { useState } from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'हिन्दी (Hindi)', flag: '🇮🇳' },
  { code: 'ta', name: 'தமிழ் (Tamil)', flag: '🇮🇳' },
  { code: 'te', name: 'తెలుగు (Telugu)', flag: '🇮🇳' },
  { code: 'bn', name: 'বাংলা (Bengali)', flag: '🇮🇳' },
  { code: 'mr', name: 'मराठी (Marathi)', flag: '🇮🇳' },
  { code: 'kn', name: 'ಕನ್ನಡ (Kannada)', flag: '🇮🇳' },
  { code: 'gu', name: 'ગુજરાતી (Gujarati)', flag: '🇮🇳' },
  { code: 'ml', name: 'മലയാളം (Malayalam)', flag: '🇮🇳' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ (Punjabi)', flag: '🇮🇳' },
]

interface LanguageSelectorProps {
  onLanguageChange: (language: string) => void
}

export default function LanguageSelector({ onLanguageChange }: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLang, setSelectedLang] = useState('en')

  const handleLanguageChange = (value: string) => {
    setSelectedLang(value)
    onLanguageChange(value)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between bg-white dark:bg-gray-900 border-gray-200 dark:border-yellow-500/20 hover:bg-yellow-50 dark:hover:bg-yellow-900/10">
          <div className="flex items-center gap-2">
            <Languages className="w-4 h-4 text-yellow-500" />
            <span className="text-sm text-gray-900 dark:text-white">
              <span className="text-lg">{languages.find(l => l.code === selectedLang)?.flag || '🇺🇸'}</span> Language
            </span>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-yellow-500/20" align="start">
        <Select value={selectedLang} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-full justify-between bg-white dark:bg-gray-900 border-gray-200 dark:border-yellow-500/20">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-yellow-500/20">
            {languages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code} className="hover:bg-yellow-50 dark:hover:bg-yellow-900/10 focus:bg-yellow-50 dark:focus:bg-yellow-900/10">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-gray-900 dark:text-white">{lang.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PopoverContent>
    </Popover>
  )
}
