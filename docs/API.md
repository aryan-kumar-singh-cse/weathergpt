# WeatherGPT API Documentation

## Overview

WeatherGPT API implements a three-layer conversational weather query pipeline with user-provided LLM keys:

1. **Intent + Entity Extraction** — LLM parses natural language → structured JSON
2. **Retrieval** — Geocode location → fetch live Open-Meteo data → classify severity
3. **Grounded Response** — LLM generates natural language from retrieved data (no hallucinations)

**LLM Provider Model:** Two-tier fallback (Groq → Gemini) using encrypted user-provided API keys

**Base URL:** `http://localhost:8000/api/v1`

**Authentication:** None required for demo (add API_SECRET_KEY in production)

---

## Main Endpoint: `/ask`

The primary conversational interface. Processes natural language weather queries with role-aware, multilingual responses.

### Request

```http
POST /api/v1/ask
Content-Type: application/json

{
  "query": "Will it rain in Mumbai tomorrow?",
  "language": "en",  // Optional: en|hi|ta|te|bn|mr|kn|gu|ml|pa (default: en)
  "role": "citizen",  // Optional: citizen|farmer|pilot|disaster-manager (default: citizen)
  "location_hint": null  // Optional: {city: "Mumbai", lat: 19.076, lng: 72.8777}
}
```

### Response

```json
{
  "query": "Will it rain in Mumbai tomorrow?",
  "intent": {
    "place": "Mumbai",
    "language": "en",
    "intent": "forecast",
    "nationwide": false,
    "confidence": 0.9
  },
  "weather": {
    "location": {
      "lat": 19.076,
      "lng": 72.8777,
      "timezone": "Asia/Kolkata"
    },
    "current": {
      "temperature": 32.5,
      "apparent_temperature": 38.2,
      "humidity": 75,
      "precipitation": 0.0,
      "pressure": 1012.5,
      "wind_speed": 15.3,
      "wind_direction": 270,
      "weather_code": 0,
      "time": "2026-08-27T11:00:00"
    },
    "forecast": {
      "days": [
        {
          "date": "2026-08-28",
          "temperature_max": 34.0,
          "temperature_min": 26.0,
          "precipitation_sum": 15.0,
          "precipitation_probability": 60,
          "wind_speed_max": 20.0,
          "weather_code": 61
        }
        // ... 6 more days
      ]
    },
    "data_source": "Open-Meteo",
    "timestamp": "2026-08-27T11:00:00Z"
  },
  "severity": {
    "severity": "warning",
    "alerts": [
      "High heat: Temperature above 40°C"
    ],
    "alert_count": 1
  },
  "response": "Based on Open-Meteo forecast, there is a 60% chance of rain tomorrow in Mumbai with expected rainfall of 15mm. Current temperature is 32.5°C with high humidity at 75%. Consider carrying an umbrella.",
  "language": "en",
  "role": "citizen",
  "grounding_source": "Open-Meteo",
  "llm_tier_used": "primary",
  "timestamp": "2026-08-27T11:00:00Z"
}
```

### Role-Specific Response Examples

Same query `"Will it rain in Mumbai tomorrow?"` with different roles:

**Role: citizen**
```
"Based on Open-Meteo forecast, there is a 60% chance of rain tomorrow in Mumbai with expected rainfall of 15mm. Consider carrying an umbrella and plan indoor activities if possible."
```

**Role: farmer**
```
"Tomorrow shows 60% rain probability in Mumbai with 15mm accumulation expected. Good conditions for irrigation timing. Soil moisture will be favorable. Avoid heavy field work during afternoon heat (34°C high). Wind at 20 km/h may affect spraying operations."
```

**Role: pilot**
```
"Mumbai weather brief for tomorrow: 60% precipitation probability, 15mm accumulation. Visibility expected 8-10km, wind 20 km/h from W (270°). Ceiling variable. Temperature 26-34°C. Monitor for updates on convective activity. No severe weather warnings."
```

**Role: disaster-manager**
```
"WEATHER SITUATION REPORT - Mumbai, 2026-08-28:
Precipitation: 60% probability, 15mm accumulation expected
Risk Level: LOW - Normal rainfall, no flood risk
Temperature: High 34°C (heat advisory threshold)
Wind: 20 km/h, no high wind risk
Recommended Actions: Standard monitoring, heat advisory for vulnerable populations
Data Source: Open-Meteo, confidence: high"
```

---

## Weather Endpoints

### Get Current Weather

```http
GET /api/v1/weather/current?city=Mumbai
GET /api/v1/weather/current?lat=19.076&lng=72.8777
```

**Response:**
```json
{
  "location": {
    "lat": 19.076,
    "lng": 72.8777,
    "city": "Mumbai"
  },
  "current": {
    "temperature": 32.5,
    "apparent_temperature": 38.2,
    "humidity": 75,
    "wind_speed": 15.3,
    "pressure": 1012.5,
    "precipitation": 0.0,
    "weather_code": 0
  },
  "units": {
    "temperature": "celsius",
    "pressure": "hPa",
    "wind_speed": "km/h",
    "precipitation": "mm"
  },
  "data_source": "Open-Meteo",
  "timestamp": "2026-08-27T11:00:00Z"
}
```

### Get Daily Forecast

```http
GET /api/v1/weather/forecast/daily?city=Mumbai&days=7
```

**Response:**
```json
{
  "location": {
    "lat": 19.076,
    "lng": 72.8777,
    "city": "Mumbai"
  },
  "forecast": {
    "daily": [
      {
        "date": "2026-08-28",
        "temperature_max": 34.0,
        "temperature_min": 26.0,
        "precipitation_sum": 15.0,
        "precipitation_probability": 60,
        "wind_speed_max": 20.0,
        "weather_code": 61,
        "weather_description": "Slight rain"
      }
      // ... more days
    ]
  },
  "data_source": "Open-Meteo",
  "valid_time": "2026-08-27T11:00:00Z"
}
```

### Get Weather Alerts

```http
GET /api/v1/weather/alerts?city=Mumbai
```

**Response:**
```json
{
  "location": {
    "lat": 19.076,
    "lng": 72.8777,
    "city": "Mumbai"
  },
  "severity": "warning",
  "alerts": [
    {
      "type": "heatwave",
      "severity": "warning",
      "message": "High heat: Temperature above 40°C",
      "timestamp": "2026-08-27T11:00:00Z"
    }
  ],
  "alert_count": 1,
  "timestamp": "2026-08-27T11:00:00Z"
}
```

### Geocode City

```http
GET /api/v1/weather/geocode?city=Mumbai&country=India
```

**Response:**
```json
{
  "location": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "coordinates": {
    "lat": 19.076,
    "lng": 72.8777,
    "accuracy": "city_center"
  },
  "source": "nominatim"
}
```

---

## Chat Endpoints

### Process Query

```http
POST /api/v1/chat/query
Content-Type: application/json

{
  "query": "What's the temperature in Delhi?",
  "language": "hi",
  "role": "citizen"
}
```

Delegates to `/api/v1/ask` with the same response format.

### Get Capabilities

```http
GET /api/v1/ask/capabilities
```

**Response:**
```json
{
  "supported_languages": ["en", "hi", "ta", "te", "bn", "mr", "kn", "gu", "ml", "pa"],
  "language_names": {
    "en": "English",
    "hi": "हिन्दी (Hindi)",
    "ta": "தமிழ் (Tamil)",
    // ... more
  },
  "supported_roles": [
    {
      "id": "citizen",
      "name": "Citizen",
      "description": "General weather information"
    },
    {
      "id": "farmer",
      "name": "Farmer",
      "description": "Agricultural weather advisory"
    },
    {
      "id": "pilot",
      "name": "Pilot",
      "description": "Aviation weather briefing"
    },
    {
      "id": "disaster-manager",
      "name": "Disaster Manager",
      "description": "Emergency weather briefing"
    }
  ],
  "features": [
    "Natural language query understanding",
    "Intent + entity extraction",
    "Live Open-Meteo data grounding",
    "Role-aware response generation",
    "Multilingual support (10 Indian languages)",
    "Severity classification",
    "Two-tier LLM provider fallback (user-provided keys)"
  ],
  "llm_tiers": {
    "primary": {
      "provider": "Groq",
      "model": "openai/gpt-oss-20b",
      "user_provided": true
    },
    "secondary": {
      "provider": "Gemini",
      "model": "gemini-2.0-flash",
      "user_provided": true
    },
    "last_tier_used": "primary"
  }
}
```

### Get Example Queries

```http
GET /api/v1/ask/examples
```

**Response:**
```json
{
  "examples": {
    "current_weather": [
      "What's the weather like in Mumbai?",
      "Current temperature in Delhi",
      "How's the weather in Bangalore today?"
    ],
    "forecast": [
      "Will it rain in Hyderabad tomorrow?",
      "What's the forecast for Pune this weekend?",
      "Weather prediction for Kolkata next week"
    ],
    "alerts": [
      "Any weather warnings for Mumbai?",
      "Are there storm alerts in my area?",
      "Is there a heat wave warning?"
    ],
    "role_specific": {
      "farmer": [
        "Should I irrigate my fields today in Nashik?",
        "Is it good weather for planting in Aurangabad?"
      ],
      "pilot": [
        "Flight weather briefing for Mumbai airport",
        "What's the visibility and wind in Delhi?"
      ],
      "disaster_manager": [
        "Weather situation report for coastal Karnataka",
        "Heavy rain risk assessment for Maharashtra"
      ]
    },
    "multilingual": [
      "मुंबई में मौसम कैसा है? (Hindi)",
      "சென்னையில் மழை பெய்யுமா? (Tamil)",
      "কলকাতায় আবহাওয়া কেমন? (Bengali)"
    ]
  }
}
```

---

## Service Status

### Get Service Status

```http
GET /api/v1/status
```

**Response:**
```json
{
  "service": "WeatherGPT",
  "version": "1.0.0",
  "status": "operational",
  "integrations": {
    "llm": {
      "model": "user-provided-keys",
      "primary": {"provider": "Groq", "model": "openai/gpt-oss-20b"},
      "secondary": {"provider": "Gemini", "model": "gemini-2.0-flash"},
      "last_tier_used": "primary"
    },
    "weather_data": {
      "provider": "Open-Meteo",
      "status": "connected"
    },
    "geocoding": {
      "provider": "Nominatim (OpenStreetMap)",
      "status": "connected",
      "fallback_cities": 16
    }
  },
  "capabilities": {
    "languages": 10,
    "roles": 4,
    "data_source": "Open-Meteo (live)",
    "grounding": "enabled",
    "fallback_chain": "2-tier (user keys)"
  },
  "timestamp": "2026-08-27T11:00:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Query cannot be empty"
}
```

### 404 Not Found
```json
{
  "detail": "Location 'UnknownCity' not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Failed to process weather query: All LLM provider tiers failed"
}
```

---

## Weather Codes (WMO Standard)

| Code | Description |
|------|-------------|
| 0 | Clear sky |
| 1 | Mainly clear |
| 2 | Partly cloudy |
| 3 | Overcast |
| 45, 48 | Fog |
| 51, 53, 55 | Drizzle (light, moderate, dense) |
| 61, 63, 65 | Rain (slight, moderate, heavy) |
| 71, 73, 75 | Snow (slight, moderate, heavy) |
| 80, 81, 82 | Rain showers (slight, moderate, violent) |
| 95, 96, 99 | Thunderstorm (possibly with hail) |

---

## Severity Levels

| Level | Threshold | UI Color |
|-------|-----------|----------|
| `normal` | No alerts | Green (not shown) |
| `warning` | Temp ≥40°C OR Wind ≥40 km/h OR Rain 70%/50mm | Yellow |
| `severe` | Wind ≥62 km/h OR Rain 80%/100mm | Orange |
| `extreme` | Temp ≥45°C | Red |

---

## Rate Limits

**Current (Demo):** None

**Production Recommendations:**
- Free tier: 100 requests/hour per IP
- Authenticated: 1000 requests/hour per API key
- Groq free tier: 30 req/min
- Gemini free tier: 15 req/min
- Implement Redis caching for repeated queries

---

## Interactive Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

**Last Updated:** 2026-08-27  
**API Version:** 1.0.0
