"""
WeatherGPT Geocoding Service
Geocoding and location resolution using Nominatim
"""

import logging
from typing import Dict, Any, Tuple, Optional
import httpx

logger = logging.getLogger(__name__)


class GeocodingError(Exception):
    """Raised when geocoding fails."""
    pass


class GeocodingService:
    """
    Geocoding service using Nominatim (OpenStreetMap).
    Converts place names to coordinates.
    """

    def __init__(self):
        self.base_url = "https://nominatim.openstreetmap.org/search"
        self.timeout = 10.0

        # Common Indian city coordinates (fallback for offline/demo)
        self._fallback_cities = {
            "mumbai": (19.0760, 72.8777, "Maharashtra"),
            "delhi": (28.7041, 77.1025, "Delhi"),
            "bangalore": (12.9716, 77.5946, "Karnataka"),
            "chennai": (13.0827, 80.2707, "Tamil Nadu"),
            "kolkata": (22.5726, 88.3639, "West Bengal"),
            "hyderabad": (17.3850, 78.4867, "Telangana"),
            "pune": (18.5204, 73.8567, "Maharashtra"),
            "ahmedabad": (23.0225, 72.5714, "Gujarat"),
            "jaipur": (26.9124, 75.7873, "Rajasthan"),
            "lucknow": (26.8467, 80.9462, "Uttar Pradesh"),
            "kochi": (9.9312, 76.2534, "Kerala"),
            "goa": (15.2993, 73.9892, "Goa"),
            "trivandrum": (8.5241, 76.9366, "Kerala"),
            "surat": (21.1702, 72.8311, "Gujarat"),
            "bhubaneswar": (22.5726, 88.3639, "Odisha"),
            "coimbatore": (11.0168, 76.9558, "Tamil Nadu"),
        }

    async def geocode(self, place_name: str, country: str = "India") -> Dict[str, Any]:
        """
        Geocode a place name to coordinates.

        Args:
            place_name: City or place name
            country: Country context (default: India)

        Returns:
            Dict with lat, lng, display_name, and metadata

        Raises:
            GeocodingError: If place cannot be found
        """
        # Check fallback cache first
        normalized = place_name.lower().strip()
        if normalized in self._fallback_cities:
            lat, lng, state = self._fallback_cities[normalized]
            return {
                "lat": lat,
                "lng": lng,
                "place_name": place_name.title(),
                "state": state,
                "country": country,
                "source": "fallback_cache"
            }

        # Try Nominatim API
        try:
            params = {
                "q": f"{place_name}, {country}",
                "format": "json",
                "limit": 1,
                "addressdetails": 1
            }

            headers = {
                "User-Agent": "WeatherGPT/1.0 (hackathon project)"
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    self.base_url,
                    params=params,
                    headers=headers
                )
                response.raise_for_status()
                results = response.json()

            if not results:
                raise GeocodingError(f"Location '{place_name}' not found")

            result = results[0]
            return {
                "lat": float(result["lat"]),
                "lng": float(result["lon"]),
                "place_name": result.get("display_name", place_name),
                "state": result.get("address", {}).get("state", ""),
                "country": result.get("address", {}).get("country", country),
                "source": "nominatim"
            }

        except httpx.TimeoutException:
            logger.warning(f"Geocoding timeout for '{place_name}', using fallback")
            return await self._fallback_geocode(place_name, country)
    async def reverse_geocode(self, lat: float, lng: float) -> Dict[str, Any]:
        """
        Reverse geocode coordinates (lat, lng) to a city/state in real-time.
        """
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                "lat": lat,
                "lon": lng,
                "format": "json",
                "addressdetails": 1,
                "zoom": 10
            }
            headers = {
                "User-Agent": "WeatherGPT/1.0 (hackathon live location detector)"
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, params=params, headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    addr = data.get("address", {})
                    city = (
                        addr.get("city")
                        or addr.get("town")
                        or addr.get("suburb")
                        or addr.get("village")
                        or addr.get("municipality")
                        or addr.get("county")
                        or addr.get("state_district")
                        or addr.get("state")
                        or "Delhi"
                    )
                    state = addr.get("state", "")
                    country = addr.get("country", "India")
                    return {
                        "lat": lat,
                        "lng": lng,
                        "city": city,
                        "state": state,
                        "country": country,
                        "display_name": data.get("display_name", f"{city}, {state}"),
                        "source": "nominatim_reverse"
                    }
        except Exception as e:
            logger.warning(f"Reverse geocode HTTP failed: {e}, using nearest fallback city")

        # Nearest city fallback
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

    def get_indian_states(self) -> Dict[str, str]:
        """Get Indian states and union territories."""
        return {
            "mh": "Maharashtra",
            "dl": "Delhi",
            "ka": "Karnataka",
            "tn": "Tamil Nadu",
            "wb": "West Bengal",
            "tg": "Telangana",
            "gj": "Gujarat",
            "rj": "Rajasthan",
            "up": "Uttar Pradesh",
            "kl": "Kerala",
            "or": "Odisha",
            "br": "Bihar",
            "mp": "Madhya Pradesh",
            "cg": "Chhattisgarh",
            "jk": "Jammu and Kashmir",
            "pb": "Punjab",
            "hr": "Haryana",
            "uk": "Uttarakhand",
            "hp": "Himachal Pradesh",
            "pb_an": "Puducherry",
            "ch": "Chandigarh",
            "dh": "Dadra and Nagar Haveli",
            "dd": "Daman and Diu",
            "ld": "Lakshadweep",
            "py": "Puducherry",
            "an": "Andaman and Nicobar Islands",
            "sk": "Sikkim",
            "mz": "Mizoram",
            "ml": "Meghalaya",
            "tr": "Tripura",
            "ar": "Arunachal Pradesh",
            "as": "Assam",
            "nl": "Nagaland",
        }


# Global instance
geocoding_service = GeocodingService()


if __name__ == "__main__":
    # Test the service
    import asyncio

    async def test():
        places = ["Mumbai", "Delhi", "Chennai", "Bengaluru", "Kolkata"]

        for place in places:
            try:
                result = await geocoding_service.geocode(place)
                print(f"✓ {place}: ({result['lat']}, {result['lng']}) — {result['state']}")
            except GeocodingError as e:
                print(f"✗ {place}: {e}")

    asyncio.run(test())
