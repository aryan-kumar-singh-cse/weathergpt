/**
 * WeatherGPT API Client
 * Centralized API calls to backend
 */

import {
  AskResponse,
  LoginResponse,
  LoginStatusResponse,
  Outlook30Data,
  ForecastData,
} from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/**
 * Login or register user
 */
export async function login(
  email: string,
  occupation: string,
  name?: string,
  location?: string,
  preferred_language?: string
): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      name: name || undefined,
      occupation,
      location: location || 'Delhi',
      preferred_language: preferred_language || 'en',
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }))
    throw new Error(error.detail || 'Login failed')
  }

  return response.json()
}

/**
 * Get user login status & profile
 */
export async function getUserStatus(email: string): Promise<LoginStatusResponse> {
  const response = await fetch(`${API_BASE}/login/status?email=${encodeURIComponent(email.trim().toLowerCase())}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'User not found' }))
    throw new Error(error.detail || 'User not found')
  }

  return response.json()
}

/**
 * Update user location or language preference
 */
export async function updateUserProfile(
  email: string,
  location?: string,
  preferred_language?: string
): Promise<{ success: boolean; email: string; location?: string; preferred_language?: string }> {
  const response = await fetch(`${API_BASE}/user/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      location: location || undefined,
      preferred_language: preferred_language || undefined,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to update profile' }))
    throw new Error(error.detail || 'Failed to update profile')
  }

  return response.json()
}

/**
 * Main conversational endpoint - ask a weather question using shared team API keys
 */
export async function askWeatherQuestion(
  query: string,
  email: string,
  language: string = 'en',
  role: string = 'citizen',
  location?: string
): Promise<AskResponse> {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      email,
      language,
      role,
      location: location || undefined,
    }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Failed to process request' }))
    throw new Error(error.detail || 'Failed to process request')
  }

  return response.json()
}

/**
 * Get current weather for a city
 */
export async function getCurrentWeather(city: string) {
  const response = await fetch(
    `${API_BASE}/weather/current?city=${encodeURIComponent(city)}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch current weather')
  }

  return response.json()
}

/**
 * Get daily forecast
 */
export async function getDailyForecast(
  lat: number,
  lng: number,
  days: number = 7
): Promise<ForecastData> {
  const response = await fetch(
    `${API_BASE}/weather/forecast/daily?lat=${lat}&lng=${lng}&days=${days}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch forecast')
  }

  return response.json()
}

/**
 * Get 30-day extended outlook with disclaimer
 */
export async function get30DayOutlook(
  lat?: number,
  lng?: number,
  city?: string
): Promise<Outlook30Data> {
  let url = `${API_BASE}/weather/forecast/outlook30`
  if (city) {
    url += `?city=${encodeURIComponent(city)}`
  } else if (lat !== undefined && lng !== undefined) {
    url += `?lat=${lat}&lng=${lng}`
  }

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch 30-day outlook')
  }

  return response.json()
}

/**
 * Reverse geocode GPS coordinates to hyper-local neighborhood / locality name
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ city: string; state?: string; country?: string; display_name?: string }> {
  try {
    const res = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.city) return data;
    }
  } catch {}

  const response = await fetch(
    `${API_BASE}/weather/reverse-geocode?lat=${lat}&lng=${lng}`
  )

  if (!response.ok) {
    throw new Error('Failed to reverse geocode location')
  }

  return response.json()
}
