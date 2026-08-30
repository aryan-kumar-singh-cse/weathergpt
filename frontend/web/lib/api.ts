/**
 * WeatherGPT API Client
 * Centralized API calls to backend
 */

import {
  AskResponse,
  WeatherData,
  LoginResponse,
  LoginStatusResponse,
  ApiCapabilities,
  ExampleQuery,
} from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

/**
 * Login or create user
 */
export async function login(email: string, occupation: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, occupation }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(error.detail || 'Login failed');
  }

  return response.json();
}

/**
 * Main conversational endpoint - ask a weather question
 * Requires email for authentication and rate limiting
 * Retrieves API keys from localStorage and sends them to backend
 */
export async function askWeatherQuestion(
  query: string,
  email: string,
  language: string = 'en',
  role: string = 'citizen'
): Promise<AskResponse> {
  // Retrieve API keys from localStorage
  const groqApiKey = localStorage.getItem('weathergpt_groq_key') || undefined;
  const geminiApiKey = localStorage.getItem('weathergpt_gemini_key') || undefined;

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
      groq_api_key: groqApiKey,
      gemini_api_key: geminiApiKey
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(error.detail || 'Failed to fetch weather data');
  }

  return response.json();
}

/**
 * Get current weather for coordinates
 */
export async function getCurrentWeather(
  lat: number,
  lng: number
): Promise<WeatherData> {
  const response = await fetch(
    `${API_BASE}/weather/current?lat=${lat}&lng=${lng}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch current weather');
  }

  return response.json();
}

/**
 * Get current weather for city
 */
export async function getCurrentWeatherByCity(city: string): Promise<WeatherData> {
  const response = await fetch(
    `${API_BASE}/weather/current?city=${encodeURIComponent(city)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch weather for ${city}`);
  }

  return response.json();
}

/**
 * Get 7-day forecast
 */
export async function getDailyForecast(
  lat: number,
  lng: number,
  days: number = 7
): Promise<WeatherData> {
  const response = await fetch(
    `${API_BASE}/weather/forecast/daily?lat=${lat}&lng=${lng}&days=${days}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch forecast');
  }

  return response.json();
}

/**
 * Get weather alerts for location
 */
export async function getWeatherAlerts(
  lat: number,
  lng: number
): Promise<{ alerts: any[] }> {
  const response = await fetch(
    `${API_BASE}/weather/alerts?lat=${lat}&lng=${lng}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch alerts');
  }

  return response.json();
}

/**
 * Geocode a city name
 */
export async function geocodeCity(city: string): Promise<{ lat: number; lng: number; city: string }> {
  const response = await fetch(
    `${API_BASE}/weather/geocode?city=${encodeURIComponent(city)}`
  );

  if (!response.ok) {
    throw new Error(`Failed to geocode ${city}`);
  }

  return response.json();
}

/**
 * Get API capabilities
 */
export async function getCapabilities(): Promise<ApiCapabilities> {
  const response = await fetch(`${API_BASE}/ask/capabilities`);

  if (!response.ok) {
    throw new Error('Failed to fetch capabilities');
  }

  return response.json();
}

/**
 * Get example queries
 */
export async function getExampleQueries(): Promise<{ examples: ExampleQuery[] }> {
  const response = await fetch(`${API_BASE}/ask/examples`);

  if (!response.ok) {
    throw new Error('Failed to fetch examples');
  }

  return response.json();
}

/**
 * Get service status
 */
export async function getServiceStatus(): Promise<{ status: string; version: string; uptime: number }> {
  const response = await fetch(`${API_BASE}/status`);

  if (!response.ok) {
    throw new Error('Failed to fetch service status');
  }

  return response.json();
}
