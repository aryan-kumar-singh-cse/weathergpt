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

        # Common Indian & Global city coordinates (fallback for fast resolution/offline)
        self._fallback_cities = {
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
            "goa": (15.2993, 73.9892, "Goa"),
            "panaji": (15.4909, 73.8278, "Goa"),
            "coimbatore": (11.0168, 76.9558, "Tamil Nadu"),
            "madurai": (9.9252, 78.1198, "Tamil Nadu"),
            "salem": (11.6643, 78.1460, "Tamil Nadu"),
            "mysore": (12.2958, 76.6394, "Karnataka"),
            "mysuru": (12.2958, 76.6394, "Karnataka"),
            "mangalore": (12.9141, 74.8560, "Karnataka"),
            # Global Metros
            "london": (51.5074, -0.1278, "United Kingdom"),
            "paris": (48.8566, 2.3522, "France"),
            "new york": (40.7128, -74.0060, "United States"),
            "tokyo": (35.6762, 139.6503, "Japan"),
            "dubai": (25.2048, 55.2708, "United Arab Emirates"),
            "singapore": (1.3521, 103.8198, "Singapore"),
            "sydney": (-33.8688, 151.2093, "Australia"),
            "toronto": (43.6532, -79.3832, "Canada"),
        }

    async def geocode(self, place_name: str, country: str = "India") -> Dict[str, Any]:
        """
        Geocode a place name to coordinates.
        """
        clean_name = place_name.strip()
        normalized = clean_name.lower()

        # Check fallback cache first
        if normalized in self._fallback_cities:
            lat, lng, state = self._fallback_cities[normalized]
            return {
                "lat": lat,
                "lng": lng,
                "place_name": clean_name.title(),
                "state": state,
                "country": country if country else "India",
                "source": "fallback_cache"
            }

        # Try Nominatim API (with country context first, then global)
        queries = [
            f"{clean_name}, {country}" if country else clean_name,
            clean_name
        ]

        headers = {
            "User-Agent": "WeatherGPT/1.0 (hackathon geocoder)"
        }

        for q in dict.fromkeys(queries):
            try:
                params = {
                    "q": q,
                    "format": "json",
                    "limit": 1,
                    "addressdetails": 1
                }

                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.get(
                        self.base_url,
                        params=params,
                        headers=headers
                    )
                    if response.status_code == 200:
                        results = response.json()
                        if results:
                            res = results[0]
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

        # Fallback to fuzzy nearest or default Delhi
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
