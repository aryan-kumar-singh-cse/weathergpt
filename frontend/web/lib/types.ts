/**
 * WeatherGPT TypeScript Type Definitions
 */

export type WeatherCode = 0 | 1 | 2 | 3 | 45 | 48 | 51 | 53 | 55 | 56 | 57 | 61 | 63 | 65 | 66 | 67 | 71 | 73 | 75 | 77 | 80 | 81 | 82 | 85 | 86 | 95 | 96 | 99

export interface LocationData {
  lat: number
  lng: number
  city?: string
  state?: string
  timezone?: string
}

export interface CurrentWeatherData {
  temperature: number
  apparent_temperature: number
  humidity: number
  precipitation: number
  pressure: number
  wind_speed: number
  wind_direction: number
  weather_code: WeatherCode
  time: string
}

export interface ForecastDay {
  date: string
  day_number?: number
  temperature_max: number
  temperature_min: number
  precipitation_sum: number
  precipitation_probability: number
  wind_speed_max: number
  weather_code: WeatherCode
  confidence?: string
}

export interface ForecastData {
  daily: ForecastDay[]
}

export interface Outlook30Data {
  location: LocationData
  outlook_days: number
  days: ForecastDay[]
  disclaimer: string
  data_source?: string
  timestamp: string
}

export interface SeverityData {
  severity: 'normal' | 'watch' | 'warning' | 'severe' | 'extreme'
  alerts: string[]
  alert_count: number
}

export interface IntentData {
  place: string
  language: string
  intent: string
  nationwide: boolean
  confidence: number
}

export interface AskResponse {
  query: string
  intent: IntentData
  weather: {
    location: LocationData
    current: CurrentWeatherData
    forecast: ForecastData
    data_source: string
    timestamp: string
  }
  severity: SeverityData
  response: string
  language: string
  role: string
  grounding_source: string
  llm_tier_used: string | null
  timestamp: string
  rate_limit?: {
    remaining: number
    limit: number
    reset_at?: string
  }
}

export interface UserProfile {
  email: string
  name?: string
  occupation: string
  location?: string
  preferred_language?: string
  created_at?: string
  last_login?: string
}

export interface LoginResponse {
  email: string
  name?: string
  occupation: string
  location?: string
  preferred_language?: string
  message: string
  is_new_user: boolean
}

export interface LoginStatusResponse {
  exists: boolean
  email: string
  name?: string
  occupation: string
  location?: string
  preferred_language?: string
}

export type AuthState = 'checking' | 'authenticated' | 'unauthenticated'

