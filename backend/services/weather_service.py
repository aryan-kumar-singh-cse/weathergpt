"""
WeatherGPT Weather Data Service
High-precision multi-model weather engine:
1. Indigenous IMD Station Ingestion (IndiaAPI / MoES DPI)
2. High-Resolution ECMWF / DWD ICON Seamless NWP
"""

import logging
from typing import Dict, Any, Optional, List
from datetime import datetime
import httpx
from backend.services.indian_met_service import indian_met_service

logger = logging.getLogger(__name__)


class WeatherService:
    """
    Weather data service integrating Open-Meteo NWP and indigenous IMD Station telemetry.
    Provides current conditions, forecasts, and severity classification.
    """

    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1/forecast"
        self.timeout = 10.0

    async def fetch_weather(self, lat: float, lng: float, city_name: Optional[str] = None) -> Dict[str, Any]:
        """
        Fetch current weather and forecast with multi-tier sovereign Indian fallback.

        Args:
            lat: Latitude
            lng: Longitude
            city_name: Optional city name for IMD station lookup

        Returns:
            Dict with current conditions and 7-day forecast
        """
        # 1. Attempt official IMD observation lookup if city name is available
        imd_data = None
        if city_name:
            try:
                imd_data = await indian_met_service.fetch_imd_city_weather(city_name)
            except Exception as e:
                logger.info(f"IMD station lookup bypassed: {e}")

        # 2. Fetch high-resolution NWP telemetry from Open-Meteo
        params = {
            "latitude": lat,
            "longitude": lng,
            "current": [
                "temperature_2m",
                "relative_humidity_2m",
                "apparent_temperature",
                "precipitation",
                "weather_code",
                "pressure_msl",
                "wind_speed_10m",
                "wind_direction_10m"
            ],
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "precipitation_probability_max",
                "wind_speed_10m_max",
                "weather_code"
            ],
            "timezone": "auto"
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                data = response.json()

            current_dict = self._parse_current(data.get("current", {}))

            # If IMD station observation returned valid data, augment current observation
            data_source = "Open-Meteo ECMWF/DWD"
            if imd_data and imd_data.get("current_temp") is not None:
                current_dict["temperature"] = imd_data["current_temp"]
                if imd_data.get("humidity"):
                    current_dict["humidity"] = imd_data["humidity"]
                data_source = "IMD_Station + Open-Meteo"

            result = {
                "location": {
                    "lat": lat,
                    "lng": lng,
                    "city": city_name or "Live Location",
                    "timezone": data.get("timezone", "UTC")
                },
                "current": current_dict,
                "forecast": self._parse_forecast(data.get("daily", {})),
                "data_source": data_source,
                "imd_station": imd_data.get("station_city") if imd_data else None,
                "timestamp": datetime.utcnow().isoformat()
            }

            return result

        except httpx.TimeoutException:
            logger.error(f"Weather API timeout for lat={lat}, lng={lng}")
            raise Exception("Weather API timeout. Please try again.")
        except httpx.HTTPStatusError as e:
            logger.error(f"Weather API error: {e}")
            raise Exception("Weather API returned an error.")
        except Exception as e:
            logger.error(f"Failed to fetch weather data: {e}")
            raise Exception("Could not fetch weather data.")

    def _parse_current(self, current: Dict) -> Dict[str, Any]:
        """Parse current weather conditions."""
        return {
            "temperature": current.get("temperature_2m", 0),
            "apparent_temperature": current.get("apparent_temperature", 0),
            "humidity": current.get("relative_humidity_2m", 0),
            "precipitation": current.get("precipitation", 0),
            "pressure": current.get("pressure_msl", 1013),
            "wind_speed": current.get("wind_speed_10m", 0),
            "wind_direction": current.get("wind_direction_10m", 0),
            "weather_code": current.get("weather_code", 0),
            "description": self.get_weather_description(current.get("weather_code", 0))
        }

    def _parse_forecast(self, daily: Dict) -> Dict[str, Any]:
        """Parse 7-day daily forecast."""
        days = []
        dates = daily.get("time", [])
        temp_maxs = daily.get("temperature_2m_max", [])
        temp_mins = daily.get("temperature_2m_min", [])
        precip_sums = daily.get("precipitation_sum", [])
        precip_probs = daily.get("precipitation_probability_max", [])
        wind_speeds = daily.get("wind_speed_10m_max", [])
        weather_codes = daily.get("weather_code", [])

        for i in range(min(7, len(dates))):
            day_data = {
                "date": dates[i] if i < len(dates) else "",
                "temperature_max": temp_maxs[i] if i < len(temp_maxs) else 0,
                "temperature_min": temp_mins[i] if i < len(temp_mins) else 0,
                "precipitation_sum": precip_sums[i] if i < len(precip_sums) else 0,
                "precipitation_probability": precip_probs[i] if i < len(precip_probs) else 0,
                "wind_speed_max": wind_speeds[i] if i < len(wind_speeds) else 0,
                "weather_code": weather_codes[i] if i < len(weather_codes) else 0,
                "description": self.get_weather_description(weather_codes[i]) if i < len(weather_codes) else "Clear"
            }
            days.append(day_data)

        return {
            "days": days,
            "forecast_days": len(days)
        }

    def classify_severity(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classify weather severity and generate alert messages.
        """
        current = weather_data.get("current", {})
        forecast = weather_data.get("forecast", {}).get("days", [])

        temp = current.get("temperature", 20)
        wind_speed = current.get("wind_speed", 0)
        weather_code = current.get("weather_code", 0)

        alerts = []
        severity = "normal"

        # Severe weather codes (Thunderstorms, Heavy Rain)
        if weather_code in [95, 96, 99]:
            alerts.append("Thunderstorm warning: Severe convective activity detected")
            severity = "severe"
        elif weather_code in [65, 82]:
            alerts.append("Heavy rain alert: Risk of localized waterlogging")
            severity = "severe"
        elif weather_code in [75, 86]:
            alerts.append("Heavy snow alert: Hazardous conditions")
            severity = "severe"

        # Temperature alerts
        if temp >= 45:
            alerts.append("Extreme heat warning: Temperature exceeds 45°C")
            severity = "extreme"
        elif temp >= 40:
            alerts.append("High heat: Temperature above 40°C")
            severity = max(severity, "warning", key=lambda x: ["normal", "warning", "severe", "extreme"].index(x))
        elif temp <= 0:
            alerts.append("Frost/freeze warning: Temperature at or below 0°C")
            severity = max(severity, "warning", key=lambda x: ["normal", "warning", "severe", "extreme"].index(x))

        # Wind alerts
        if wind_speed >= 62:
            alerts.append("High wind warning: Wind speed exceeds 62 km/h")
            severity = max(severity, "severe", key=lambda x: ["normal", "warning", "severe", "extreme"].index(x))
        elif wind_speed >= 40:
            alerts.append("Strong winds: Wind speed above 40 km/h")
            severity = max(severity, "warning", key=lambda x: ["normal", "warning", "severe", "extreme"].index(x))

        # Check forecast for heavy rain (next 3 days)
        for day in forecast[:3]:
            rain_prob = day.get("precipitation_probability", 0)
            rain_mm = day.get("precipitation_sum", 0)

            if rain_prob >= 80 and rain_mm >= 100:
                alerts.append(f"Heavy rain warning: {rain_prob}% chance of {rain_mm}mm rainfall on {day['date']}")
                severity = max(severity, "severe", key=lambda x: ["normal", "warning", "severe", "extreme"].index(x))
            elif rain_prob >= 70 and rain_mm >= 50:
                alerts.append(f"Moderate rain expected: {rain_prob}% chance of {rain_mm}mm on {day['date']}")
                severity = max(severity, "warning", key=lambda x: ["normal", "warning", "severe", "extreme"].index(x))

        return {
            "severity": severity,
            "alerts": alerts,
            "alert_count": len(alerts)
        }

    def get_weather_description(self, weather_code: int) -> str:
        """
        Convert WMO weather code to human-readable description.
        """
        descriptions = {
            0: "Clear sky",
            1: "Mainly clear",
            2: "Partly cloudy",
            3: "Overcast",
            45: "Foggy",
            48: "Depositing rime fog",
            51: "Light drizzle",
            53: "Moderate drizzle",
            55: "Dense drizzle",
            61: "Slight rain",
            63: "Moderate rain",
            65: "Heavy rain",
            71: "Slight snow",
            73: "Moderate snow",
            75: "Heavy snow",
            77: "Snow grains",
            80: "Slight rain showers",
            81: "Moderate rain showers",
            82: "Violent rain showers",
            85: "Slight snow showers",
            86: "Heavy snow showers",
            95: "Thunderstorm",
            96: "Thunderstorm with slight hail",
            99: "Thunderstorm with heavy hail"
        }
        return descriptions.get(weather_code, "Unknown conditions")


# Global instance
weather_service = WeatherService()
