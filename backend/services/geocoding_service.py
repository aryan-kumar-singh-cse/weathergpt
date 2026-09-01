"""
WeatherGPT Geocoding Service
High-precision geocoding and hyper-local reverse geocoding using Nominatim (OSM)
"""

import logging
import re
from typing import Dict, Any, Tuple, Optional
import httpx

logger = logging.getLogger(__name__)


class GeocodingError(Exception):
    """Raised when geocoding fails."""
    pass


class GeocodingService:
    """
    High-precision geocoding service using Nominatim (OpenStreetMap) and Open-Meteo.
    Provides street, locality, neighborhood, district, and city-level coordinate resolution.
    """

    def __init__(self):
        self.base_url = "https://nominatim.openstreetmap.org/search"
        self.timeout = 10.0

        # Common Indian & Global city/district coordinates (fallback for fast resolution/offline)
        self._fallback_cities = {
            "mohan nagar": (28.6780, 77.3890, "Uttar Pradesh"),
            "sahibabad": (28.6811, 77.3787, "Uttar Pradesh"),
            "indrapuram": (28.6415, 77.3745, "Uttar Pradesh"),
            "vaishali": (28.6480, 77.3411, "Uttar Pradesh"),
            "vasundhara": (28.6601, 77.3683, "Uttar Pradesh"),
            "raj nagar": (28.6947, 77.4475, "Uttar Pradesh"),
            "mumbai": (19.0760, 72.8777, "Maharashtra"),
            "delhi": (28.7041, 77.1025, "Delhi"),
            "new delhi": (28.6139, 77.2090, "Delhi"),
            "bangalore": (12.9716, 77.5946, "Karnataka"),
            "bengaluru": (12.9716, 77.5946, "Karnataka"),
            "chennai": (13.0827, 80.2707, "Tamil Nadu"),
            "kolkata": (22.5726, 88.3639, "West Bengal"),
            "hyderabad": (17.3850, 78.4867, "Telangana"),
            "pune": (18.5204, 73.8567, "Maharashtra"),
            "ahmedabad": (23.0225, 72.5714, "Gujarat"),
            "jaipur": (26.9124, 75.7873, "Rajasthan"),
            "lucknow": (26.8467, 80.9462, "Uttar Pradesh"),
            "ghaziabad": (28.6692, 77.4538, "Uttar Pradesh"),
            "noida": (28.5355, 77.3910, "Uttar Pradesh"),
            "greater noida": (28.4744, 77.5040, "Uttar Pradesh"),
            "gurgaon": (28.4595, 77.0266, "Haryana"),
            "gurugram": (28.4595, 77.0266, "Haryana"),
            "faridabad": (28.4089, 77.3178, "Haryana"),
            "meerut": (28.9845, 77.7064, "Uttar Pradesh"),
            "agra": (27.1767, 78.0081, "Uttar Pradesh"),
            "kanpur": (26.4499, 80.3319, "Uttar Pradesh"),
            "varanasi": (25.3176, 82.9739, "Uttar Pradesh"),
            "prayagraj": (25.4358, 81.8463, "Uttar Pradesh"),
            "allahabad": (25.4358, 81.8463, "Uttar Pradesh"),
            "patna": (25.5941, 85.1376, "Bihar"),
            "ranchi": (23.3441, 85.3096, "Jharkhand"),
            "bhopal": (23.2599, 77.4126, "Madhya Pradesh"),
            "indore": (22.7196, 75.8577, "Madhya Pradesh"),
            "gwalior": (26.2183, 78.1828, "Madhya Pradesh"),
            "jabalpur": (23.1815, 79.9864, "Madhya Pradesh"),
            "raipur": (21.2514, 81.6296, "Chhattisgarh"),
            "nagpur": (21.1458, 79.0882, "Maharashtra"),
            "nashik": (19.9975, 73.7898, "Maharashtra"),
            "aurangabad": (19.8762, 75.3433, "Maharashtra"),
            "chhatrapati sambhajinagar": (19.8762, 75.3433, "Maharashtra"),
            "surat": (21.1702, 72.8311, "Gujarat"),
            "vadodara": (22.3072, 73.1812, "Gujarat"),
            "rajkot": (22.3039, 70.8022, "Gujarat"),
            "jodhpur": (26.2389, 73.0243, "Rajasthan"),
            "udaipur": (24.5854, 73.7125, "Rajasthan"),
            "kota": (25.2138, 75.8648, "Rajasthan"),
            "amritsar": (31.6340, 74.8723, "Punjab"),
            "ludhiana": (30.9010, 75.8573, "Punjab"),
            "jalandhar": (31.3260, 75.5762, "Punjab"),
            "chandigarh": (30.7333, 76.7794, "Chandigarh"),
            "shimla": (31.1048, 77.1734, "Himachal Pradesh"),
            "dehradun": (30.3165, 78.0322, "Uttarakhand"),
            "haridwar": (29.9457, 78.1642, "Uttarakhand"),
            "srinagar": (34.0837, 74.7973, "Jammu and Kashmir"),
            "jammu": (32.7266, 74.8570, "Jammu and Kashmir"),
            "guwahati": (26.1445, 91.7362, "Assam"),
            "bhubaneswar": (20.2961, 85.8245, "Odisha"),
            "cuttack": (20.4625, 85.8828, "Odisha"),
            "visakhapatnam": (17.6868, 83.2185, "Andhra Pradesh"),
            "vijayawada": (16.5062, 80.6480, "Andhra Pradesh"),
            "tirupati": (13.6288, 79.4192, "Andhra Pradesh"),
            "kochi": (9.9312, 76.2534, "Kerala"),
            "trivandrum": (8.5241, 76.9366, "Kerala"),
            "thiruvananthapuram": (8.5241, 76.9366, "Kerala"),
            "kozhikode": (11.2588, 75.7804, "Kerala"),
            "wayanad": (11.6854, 76.1320, "Kerala"),
            "kutch": (23.7337, 69.8597, "Gujarat"),
            "bastar": (19.0760, 82.0298, "Chhattisgarh"),
            "thane": (19.2183, 72.9781, "Maharashtra"),
            "gorakhpur": (26.7606, 83.3732, "Uttar Pradesh"),
            "aligarh": (27.8974, 78.0880, "Uttar Pradesh"),
            "bareilly": (28.3670, 79.4304, "Uttar Pradesh"),
            "moradabad": (28.8386, 78.7733, "Uttar Pradesh"),
            "jhansi": (25.4484, 78.5685, "Uttar Pradesh"),
            "mathura": (27.4924, 77.6737, "Uttar Pradesh"),
            "ayodhya": (26.7922, 82.1998, "Uttar Pradesh"),
            "muzaffarnagar": (29.4727, 77.7085, "Uttar Pradesh"),
            "alwar": (27.5530, 76.6346, "Rajasthan"),
            "bikaner": (28.0229, 73.3119, "Rajasthan"),
            "sikar": (27.6094, 75.1398, "Rajasthan"),
            "barmer": (25.7521, 71.3967, "Rajasthan"),
            "jaisalmer": (26.9157, 70.9083, "Rajasthan"),
            "leh": (34.1526, 77.5771, "Ladakh"),
        }

    async def geocode(self, place_name: str, country: str = "India") -> Dict[str, Any]:
        """
        Geocode a place/district/neighbourhood name to coordinates.
        """
        if not place_name or not place_name.strip():
            raise GeocodingError("Place name cannot be empty")

        clean_name = re.sub(r"\b(district|dist|zila|city|town|region)\b", "", place_name, flags=re.IGNORECASE).strip()
        if not clean_name:
            clean_name = place_name.strip()

        lookup_key = clean_name.lower()
        if lookup_key in self._fallback_cities:
            lat, lng, state = self._fallback_cities[lookup_key]
            return {
                "lat": lat,
                "lng": lng,
                "place_name": clean_name.title(),
                "state": state,
                "country": country,
                "source": "curated_catalog"
            }

        # 1. Try Open-Meteo Geocoding API first (fast & reliable)
        try:
            open_meteo_url = "https://geocoding-api.open-meteo.com/v1/search"
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.get(
                    open_meteo_url,
                    params={"name": clean_name, "count": 1, "language": "en", "format": "json"}
                )
                if res.status_code == 200:
                    data = res.json()
                    results = data.get("results", [])
                    if results:
                        top = results[0]
                        return {
                            "lat": float(top["latitude"]),
                            "lng": float(top["longitude"]),
                            "place_name": top.get("name", clean_name.title()),
                            "state": top.get("admin1", ""),
                            "district": top.get("admin2", ""),
                            "country": top.get("country", country),
                            "source": "open_meteo_geocoding"
                        }
        except Exception as e:
            logger.warning(f"Open-Meteo geocoding failed: {e}")

        # 2. Try Nominatim (OpenStreetMap)
        queries = [
            f"{clean_name}, {country}",
            clean_name,
            f"{place_name}, {country}"
        ]

        for q in queries:
            try:
                params = {
                    "q": q,
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 1
                }
                headers = {"User-Agent": "WeatherGPT/1.0 (hackathon meteorological assistant)"}
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(self.base_url, params=params, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        if data and len(data) > 0:
                            res = data[0]
                            return {
                                "lat": float(res["lat"]),
                                "lng": float(res["lon"]),
                                "place_name": clean_name.title(),
                                "state": res.get("address", {}).get("state", ""),
                                "country": res.get("address", {}).get("country", country),
                                "source": "nominatim"
                            }
            except Exception as e:
                logger.warning(f"Geocoding attempt failed for '{q}': {e}")

        # Default fallback
        return {
            "lat": 28.6139,
            "lng": 77.2090,
            "place_name": clean_name.title(),
            "state": "Delhi",
            "country": "India",
            "source": "fallback_default"
        }

    async def reverse_geocode(self, lat: float, lng: float) -> Dict[str, Any]:
        """
        Hyper-local reverse geocoding with neighborhood/suburb/colony/district resolution.
        Matches Apple Weather and Google Weather granular locality accuracy.
        """
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                "lat": lat,
                "lon": lng,
                "format": "json",
                "addressdetails": 1,
                "zoom": 18  # Street and neighborhood level granularity!
            }
            headers = {
                "User-Agent": "WeatherGPT/1.0 (hackathon high-precision hyper-local detector)"
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    addr = data.get("address", {})
                    
                    neighbourhood = addr.get("neighbourhood") or addr.get("suburb") or addr.get("quarter") or addr.get("residential")
                    suburb = addr.get("suburb") or addr.get("city_district") or addr.get("town")
                    city = addr.get("city") or addr.get("municipality") or addr.get("county") or addr.get("state_district")
                    state = addr.get("state", "")
                    country = addr.get("country", "India")

                    # Formulate accurate hyper-local display label
                    if neighbourhood and suburb and neighbourhood != suburb:
                        primary_label = f"{neighbourhood}, {suburb}"
                    elif neighbourhood and city and neighbourhood != city:
                        primary_label = f"{neighbourhood}, {city}"
                    elif suburb and city and suburb != city:
                        primary_label = f"{suburb}, {city}"
                    elif neighbourhood:
                        primary_label = neighbourhood
                    elif suburb:
                        primary_label = suburb
                    elif city:
                        primary_label = city
                    else:
                        primary_label = "Live Location"

                    return {
                        "lat": lat,
                        "lng": lng,
                        "city": primary_label,
                        "neighbourhood": neighbourhood,
                        "suburb": suburb,
                        "macro_city": city,
                        "state": state,
                        "country": country,
                        "display_name": data.get("display_name", f"{primary_label}, {state}"),
                        "source": "nominatim_hyperlocal"
                    }
        except Exception as e:
            logger.warning(f"Nominatim reverse geocode failed: {e}, attempting fallback")

        # Nearest catalog fallback
        best_city = "Delhi"
        best_state = "Delhi"
        min_dist = float("inf")

        for c_name, (c_lat, c_lng, c_state) in self._fallback_cities.items():
            dist = (c_lat - lat) ** 2 + (c_lng - lng) ** 2
            if dist < min_dist:
                min_dist = dist
                best_city = c_name.title()
                best_state = c_state

        return {
            "lat": lat,
            "lng": lng,
            "city": best_city,
            "state": best_state,
            "country": "India",
            "source": "nearest_fallback"
        }


# Global instance
geocoding_service = GeocodingService()
