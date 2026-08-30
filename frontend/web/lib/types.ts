/**
 * WeatherGPT TypeScript Type Definitions
 * Replaces `any` types with proper interfaces
 */

// Weather Code Mapping (WMO Weather interpretation codes)
export type WeatherCode = 0 | 1 | 2 | 3 | 45 | 48 | 51 | 53 | 55 | 56 | 57 | 61 | 63 | 65 | 66 | 67 | 71 | 73 | 75 | 77 | 80 | 81 | 82 | 85 | 86 | 95 | 96 | 99

export interface LocationData {
  lat: number
  lng: number
  city?: string
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
  temperature_max: number
  temperature_min: number
  precipitation_sum: number
  precipitation_probability: number
  wind_speed_max: number
  weather_code: WeatherCode
}

export interface ForecastData {
  daily: ForecastDay[]
}

export interface WeatherData {
  location: LocationData
  current: CurrentWeatherData
  forecast?: ForecastData
  data_source: string
  timestamp: string
  severity?: SeverityData
}

export interface SeverityData {
  severity: 'normal' | 'warning' | 'severe' | 'extreme'
  alerts: string[]
  alert_count: number
}

export interface AlertData {
  id: string
  type: string
  severity: 'minor' | 'moderate' | 'severe' | 'extreme'
  title: string
  description: string
  area: string
  effective: string
  expires: string
  source?: string
}

export interface IntentData {
  place: string
  language: string
  intent: string
  nationwide: boolean
  confidence: number
}

export interface RateLimitInfo {
  remaining: number
  limit: number
  reset_at: string
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
  rate_limit?: RateLimitInfo
}

export interface LoginResponse {
  message: string
  user: {
    email: string
    occupation: string
    created_at: string
  }
}

export interface LoginStatusResponse {
  email: string
  occupation: string
  exists: boolean
}

export interface ApiError {
  detail: string | ErrorDetail[]
}

export interface ErrorDetail {
  loc: string[]
  msg: string
  type: string
}

// Authentication states
export type AuthState = 'checking' | 'authenticated' | 'unauthenticated'

// User data
export interface UserData {
  email: string
  occupation: string
}

// API Capabilities
export interface ApiCapabilities {
  languages: string[]
  roles: string[]
  max_forecast_days: number
  rate_limits: {
    requests_per_day: number
    requests_per_hour: number
  }
}

// Example query structure
export interface ExampleQuery {
  query: string
  language: string
  description: string
}
