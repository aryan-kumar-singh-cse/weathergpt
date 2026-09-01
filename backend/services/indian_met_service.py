"""
WeatherGPT Sovereign Indian Meteorological Service (SIH26068)
Direct ingestion from IndianAPI (IMD Stations), CPCB Air Quality, and Open Government Data (OGD)
"""

import logging
import os
from typing import Dict, Any, Optional
import httpx

logger = logging.getLogger(__name__)

INDIA_API_BASE = "https://weather.indianapi.in"
DEFAULT_INDIA_API_KEY = os.getenv("INDIA_API_KEY", "sk-live-kImnfJDjA3MVto9SbkiSivOxKQz2pfQoS9qhIbn7")


class IndianMetService:
    """
    Indigenous Indian Meteorological & IMD Station Adapter.
    Ingests live IMD observations, station bulletins, and astronomical ephemeris.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or DEFAULT_INDIA_API_KEY
        self.timeout = 5.0

    async def fetch_imd_city_weather(self, city_name: str) -> Optional[Dict[str, Any]]:
        """
        Fetch official IMD observation from IndiaAPI.
        Returns parsed station telemetry or None if unavailable/rate-limited.
        """
        if not self.api_key:
            return None

        clean_city = city_name.split(",")[0].strip()

        try:
            headers = {"x-api-key": self.api_key}
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                url = f"{INDIA_API_BASE}/india/weather"
                res = await client.get(url, params={"city": clean_city}, headers=headers)
                
                if res.status_code == 200:
                    data = res.json()
                    weather = data.get("weather", {})
                    current = weather.get("current", {})
                    forecast = weather.get("forecast", [])
                    astro = weather.get("astronomical", {})

                    max_temp = current.get("temperature", {}).get("max", {}).get("value")
                    min_temp = current.get("temperature", {}).get("min", {}).get("value")
                    morning_hum = current.get("humidity", {}).get("morning")
                    evening_hum = current.get("humidity", {}).get("evening")
                    avg_hum = (
                        int((morning_hum + evening_hum) / 2)
                        if morning_hum and evening_hum
                        else morning_hum or evening_hum or 65
                    )

                    return {
                        "source": "IMD_IndiaAPI",
                        "station_city": data.get("city", clean_city),
                        "temperature_max": max_temp,
                        "temperature_min": min_temp,
                        "current_temp": max_temp or min_temp,
                        "humidity": avg_hum,
                        "rainfall": current.get("rainfall"),
                        "forecast": forecast,
                        "astronomical": astro,
                    }
        except Exception as e:
            logger.info(f"IndiaAPI IMD endpoint skipped: {e}")

        return None


# Global instance
indian_met_service = IndianMetService()
