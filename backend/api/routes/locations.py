"""
WeatherGPT Location Routes
Geocoding, location search, and location-based services
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/locations", tags=["Locations"])


@router.get("/")
async def get_locations_info():
    """
    Get location service information.

    Returns:
        Location service capabilities and supported areas
    """
    return {
        "service": "WeatherGPT Location API",
        "description": "Geocoding and location services for weather queries",
        "features": [
            "Reverse geocoding",
            "City search",
            "District-level precision",
            "Multi-language names"
        ],
        "coverage": "India-wide with global support",
        "data_sources": ["IMD", "OpenStreetMap", "Google Maps"]
    }


@router.get("/search")
async def search_locations(
    query: str = Query(..., min_length=2),
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    limit: int = Query(default=10, ge=1, le=50)
):
    """
    Search for locations by name.

    Args:
        query: Location name to search
        state: Filter by state
        district: Filter by district
        limit: Maximum results

    Returns:
        List of matching locations
    """
    # Mock search - in production would query database
    sample_locations = [
        {
            "name": "Mumbai",
            "name_local": "मुंबई",
            "lat": 19.0760,
            "lng": 72.8777,
            "district": "Mumbai",
            "state": "Maharashtra",
            "type": "city"
        },
        {
            "name": "Delhi",
            "name_local": "दिल्ली",
            "lat": 28.7041,
            "lng": 77.1025,
            "district": "Central Delhi",
            "state": "Delhi",
            "type": "city"
        },
        {
            "name": "Bengaluru",
            "name_local": "ಬೆಂಗಳೂರು",
            "lat": 12.9716,
            "lng": 77.5946,
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "type": "city"
        }
    ]

    # Filter by state if provided
    if state:
        sample_locations = [loc for loc in sample_locations if loc.get("state") == state]

    # Filter by district if provided
    if district:
        sample_locations = [loc for loc in sample_locations if loc.get("district") == district]

    return {
        "query": query,
        "results": sample_locations[:limit],
        "count": len(sample_locations),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/geocode")
async def geocode_location(
    city: str,
    state: Optional[str] = Query(None),
    country: str = Query(default="India")
):
    """
    Geocode a city name to coordinates.

    Args:
        city: City name
        state: State name (optional)
        country: Country name

    Returns:
        Coordinates and metadata
    """
    # Mock geocoding - in production would use Google Maps/Nominatim
    city_coords = {
        "Mumbai": (19.0760, 72.8777),
        "Delhi": (28.7041, 77.1025),
        "Bengaluru": (12.9716, 77.5946),
        "Chennai": (13.0827, 80.2707),
        "Kolkata": (22.5726, 88.3639),
        "Hyderabad": (17.3850, 78.4867),
        "Pune": (18.5204, 73.8567),
        "Ahmedabad": (23.0225, 72.5714),
        "Jaipur": (26.9124, 75.7873),
        "Lucknow": (26.8467, 80.9462)
    }

    if city in city_coords:
        lat, lng = city_coords[city]
    else:
        # Fallback to approximate coordinates
        lat, lng = 20.5937, 78.9629  # India center

    return {
        "location": city,
        "state": state,
        "country": country,
        "coordinates": {
            "lat": lat,
            "lng": lng,
            "accuracy": "city_center"
        },
        "timezone": "Asia/Kolkata",
        "elevation_m": 520,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/reverse")
async def reverse_geocode(
    lat: float = Query(...),
    lng: float = Query(...)
):
    """
    Reverse geocode coordinates to location name.

    Args:
        lat: Latitude
        lng: Longitude

    Returns:
        Location name and metadata
    """
    # Mock reverse geocoding
    # In production, use Google Maps Geocoding API or Nominatim

    # Simple mock mapping
    mock_locations = {
        (19.0760, 72.8777): {"city": "Mumbai", "state": "Maharashtra", "district": "Mumbai"},
        (28.7041, 77.1025): {"city": "Delhi", "state": "Delhi", "district": "Central Delhi"},
        (12.9716, 77.5946): {"city": "Bengaluru", "state": "Karnataka", "district": "Bengaluru Urban"},
    }

    # Find closest match (simplified - in production use Haversine formula)
    closest = None
    for coords, location in mock_locations.items():
        if abs(coords[0] - lat) < 0.5 and abs(coords[1] - lng) < 0.5:
            closest = location
            break

    if not closest:
        closest = {"city": "Unknown", "state": "Unknown", "district": "Unknown"}

    return {
        "location": {
            "city": closest["city"],
            "state": closest["state"],
            "district": closest["district"],
            "coordinates": {
                "lat": lat,
                "lng": lng
            }
        },
        "timezone": "Asia/Kolkata",
        "country": "India",
        "timestamp": datetime.now().isoformat()
    }


@router.get("/popular")
async def get_popular_locations(
    state: Optional[str] = Query(None),
    limit: int = Query(default=20, ge=1, le=100)
):
    """
    Get popular locations.

    Args:
        state: Filter by state
        limit: Maximum results

    Returns:
        List of popular locations
    """
    popular_locations = [
        {
            "name": "Mumbai",
            "name_local": "मुंबई",
            "lat": 19.0760,
            "lng": 72.8777,
            "district": "Mumbai",
            "state": "Maharashtra",
            "type": "city",
            "popularity": 95
        },
        {
            "name": "Delhi",
            "name_local": "दिल्ली",
            "lat": 28.7041,
            "lng": 77.1025,
            "district": "Central Delhi",
            "state": "Delhi",
            "type": "city",
            "popularity": 95
        },
        {
            "name": "Bengaluru",
            "name_local": "ಬೆಂಗಳೂರು",
            "lat": 12.9716,
            "lng": 77.5946,
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "type": "city",
            "popularity": 90
        },
        {
            "name": "Hyderabad",
            "name_local": "హైదరాబాద్",
            "lat": 17.3850,
            "lng": 78.4867,
            "district": "Kamareddy",
            "state": "Telangana",
            "type": "city",
            "popularity": 85
        },
        {
            "name": "Ahmedabad",
            "name_local": "અમદાવાદ",
            "lat": 23.0225,
            "lng": 72.5714,
            "district": "Ahmedabad",
            "state": "Gujarat",
            "type": "city",
            "popularity": 80
        },
        {
            "name": "Chennai",
            "name_local": "சென்னை",
            "lat": 13.0827,
            "lng": 80.2707,
            "district": "Chennai",
            "state": "Tamil Nadu",
            "type": "city",
            "popularity": 85
        },
        {
            "name": "Kolkata",
            "name_local": "কলকাতা",
            "lat": 22.5726,
            "lng": 88.3639,
            "district": "Kolkata",
            "state": "West Bengal",
            "type": "city",
            "popularity": 85
        }
    ]

    if state:
        popular_locations = [loc for loc in popular_locations if loc.get("state") == state]

    return {
        "locations": popular_locations[:limit],
        "count": len(popular_locations),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/all")
async def get_all_locations(
    state: Optional[str] = Query(None),
    district: Optional[str] = Query(None),
    limit: int = Query(default=100, ge=1, le=1000)
):
    """
    Get all locations (paginated).

    Args:
        state: Filter by state
        district: Filter by district
        limit: Maximum results

    Returns:
        All locations matching filters
    """
    # Mock all locations - would query database in production
    all_locations = [
        {
            "name": "Mumbai",
            "name_local": "मुंबई",
            "lat": 19.0760,
            "lng": 72.8777,
            "district": "Mumbai",
            "state": "Maharashtra",
            "type": "city",
            "elevation_m": 14
        },
        {
            "name": "Delhi",
            "name_local": "दिल्ली",
            "lat": 28.7041,
            "lng": 77.1025,
            "district": "Central Delhi",
            "state": "Delhi",
            "type": "city",
            "elevation_m": 216
        },
        {
            "name": "Bengaluru",
            "name_local": "ಬೆಂಗಳೂರು",
            "lat": 12.9716,
            "lng": 77.5946,
            "district": "Bengaluru Urban",
            "state": "Karnataka",
            "type": "city",
            "elevation_m": 920
        },
        {
            "name": "Hyderabad",
            "name_local": "హైదరాబాద్",
            "lat": 17.3850,
            "lng": 78.4867,
            "district": "Kamareddy",
            "state": "Telangana",
            "type": "city",
            "elevation_m": 542
        },
        {
            "name": "Ahmedabad",
            "name_local": "અમદાવાદ",
            "lat": 23.0225,
            "lng": 72.5714,
            "district": "Ahmedabad",
            "state": "Gujarat",
            "type": "city",
            "elevation_m": 53
        },
        {
            "name": "Chennai",
            "name_local": "சென்னை",
            "lat": 13.0827,
            "lng": 80.2707,
            "district": "Chennai",
            "state": "Tamil Nadu",
            "type": "city",
            "elevation_m": 6
        },
        {
            "name": "Kolkata",
            "name_local": "কলকাতা",
            "lat": 22.5726,
            "lng": 88.3639,
            "district": "Kolkata",
            "state": "West Bengal",
            "type": "city",
            "elevation_m": 9
        },
        {
            "name": "Surat",
            "name_local": "સુરત",
            "lat": 21.1702,
            "lng": 72.8311,
            "district": "Surat",
            "state": "Gujarat",
            "type": "city",
            "elevation_m": 10
        },
        {
            "name": "Pune",
            "name_local": "पुणे",
            "lat": 18.5204,
            "lng": 73.8567,
            "district": "Pune",
            "state": "Maharashtra",
            "type": "city",
            "elevation_m": 560
        },
        {
            "name": "Jaipur",
            "name_local": "जयपुर",
            "lat": 26.9124,
            "lng": 75.7873,
            "district": "Jaipur",
            "state": "Rajasthan",
            "type": "city",
            "elevation_m": 431
        }
    ]

    if state:
        all_locations = [loc for loc in all_locations if loc.get("state") == state]

    if district:
        all_locations = [loc for loc in all_locations if loc.get("district") == district]

    return {
        "locations": all_locations[:limit],
        "count": len(all_locations),
        "timestamp": datetime.now().isoformat()
    }


@router.get("/districts")
async def get_districts(
    state: str = Query(...),
    limit: int = Query(default=50, ge=1, le=200)
):
    """
    Get districts in a state.

    Args:
        state: State name
        limit: Maximum districts

    Returns:
        List of districts
    """
    state_districts = {
        "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur"],
        "Delhi": ["Central Delhi", "South Delhi", "North Delhi", "East Delhi", "West Delhi"],
        "Karnataka": ["Bengaluru Urban", "Mysuru", "Belagavi", "Mangaluru", "Hubballi"],
        "Telangana": ["Kamareddy", "Ranga Reddy", "Medchal", "Warangal", "Nalgonda"],
        "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
        "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
        "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
        "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner"]
    }

    return {
        "state": state,
        "districts": state_districts.get(state, []),
        "count": len(state_districts.get(state, [])),
        "timestamp": datetime.now().isoformat()
    }
