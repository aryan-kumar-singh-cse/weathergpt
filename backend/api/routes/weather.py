"""
WeatherGPT Weather Routes
Real-time weather data API with Open-Meteo integration
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from datetime import datetime
import logging

from backend.services import weather_service, geocoding_service, GeocodingError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/weather", tags=["Weather"])


@router.get("/current")
async def get_current_weather(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    state: Optional[str] = None
):
    """
    Get current weather conditions.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name (e.g., Mumbai)
        state: State (optional, used with city)

    Returns:
        Current weather data from Open-Meteo
    """
    try:
        # If city provided, geocode it
        if city:
            try:
                location = await geocoding_service.geocode(city)
                lat, lng = location["lat"], location["lng"]
            except GeocodingError as e:
                raise HTTPException(status_code=404, detail=f"City '{city}' not found")

        # Validate coordinates
        if lat is None or lng is None:
            raise HTTPException(
                status_code=400,
                detail="Either provide coordinates (lat, lng) or city name"
            )

        # Fetch weather data
        weather_data = await weather_service.fetch_weather(lat, lng)

        return {
            "location": {
                "lat": lat,
                "lng": lng,
                "city": city,
                "state": state
            },
            "current": weather_data["current"],
            "units": {
                "temperature": "celsius",
                "pressure": "hPa",
                "wind_speed": "km/h",
                "precipitation": "mm"
            },
            "data_source": weather_data["data_source"],
            "timestamp": weather_data["timestamp"]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching current weather: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch weather data")


@router.get("/forecast/daily")
async def get_daily_forecast(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    days: int = Query(default=7, ge=1, le=7)
):
    """
    Get daily weather forecast.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name
        days: Number of days to forecast (1-7)

    Returns:
        7-day forecast from Open-Meteo
    """
    try:
        # If city provided, geocode it
        if city:
            try:
                location = await geocoding_service.geocode(city)
                lat, lng = location["lat"], location["lng"]
            except GeocodingError:
                raise HTTPException(status_code=404, detail=f"City '{city}' not found")

        if lat is None or lng is None:
            raise HTTPException(
                status_code=400,
                detail="Either provide coordinates (lat, lng) or city name"
            )

        # Fetch weather data
        weather_data = await weather_service.fetch_weather(lat, lng)
        forecast_days = weather_data["forecast"]["days"][:days]

        # Add weather descriptions
        for day in forecast_days:
            day["weather_description"] = weather_service.get_weather_description(
                day.get("weather_code", 0)
            )

        return {
            "location": {
                "lat": lat,
                "lng": lng,
                "city": city
            },
            "forecast": {
                "daily": forecast_days
            },
            "data_source": weather_data["data_source"],
            "valid_time": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching daily forecast: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch forecast")


@router.get("/forecast/outlook30")
async def get_30_day_outlook(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None
):
    """
    Get 30-day extended weather and climate outlook with disclaimer.
    """
    try:
        if city:
            try:
                location = await geocoding_service.geocode(city)
                lat, lng = location["lat"], location["lng"]
            except GeocodingError:
                raise HTTPException(status_code=404, detail=f"City '{city}' not found")

        if lat is None or lng is None:
            raise HTTPException(
                status_code=400,
                detail="Either provide coordinates (lat, lng) or city name"
            )

        outlook = await weather_service.fetch_30_day_outlook(lat, lng)
        return outlook
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching 30-day outlook: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch 30-day outlook")


@router.get("/alerts")
async def get_weather_alerts(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None
):
    """
    Get active weather alerts for a location.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name

    Returns:
        Severity classification and alerts
    """
    try:
        # If city provided, geocode it
        if city:
            try:
                location = await geocoding_service.geocode(city)
                lat, lng = location["lat"], location["lng"]
            except GeocodingError:
                raise HTTPException(status_code=404, detail=f"City '{city}' not found")

        if lat is None or lng is None:
            raise HTTPException(
                status_code=400,
                detail="Either provide coordinates (lat, lng) or city name"
            )

        # Fetch weather data and classify severity
        weather_data = await weather_service.fetch_weather(lat, lng)
        severity = weather_service.classify_severity(weather_data)

        return {
            "location": {
                "lat": lat,
                "lng": lng,
                "city": city
            },
            "severity": severity["severity"],
            "alerts": [
                {
                    "type": "weather_alert",
                    "severity": severity["severity"],
                    "message": alert,
                    "timestamp": datetime.utcnow().isoformat()
                }
                for alert in severity["alerts"]
            ],
            "alert_count": severity["alert_count"],
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch alerts")


@router.get("/geocode")
async def geocode_location(
    city: str,
    state: Optional[str] = None,
    country: str = Query(default="India")
):
    """
    Geocode a city name to coordinates.

    Args:
        city: City name
        state: State name (optional)
        country: Country code (default: India)

    Returns:
        Coordinates and metadata
    """
    try:
        location = await geocoding_service.geocode(city, country)
        return {
            "location": city,
            "state": location.get("state", state),
            "country": location.get("country", country),
            "coordinates": {
                "lat": location["lat"],
                "lng": location["lng"],
                "accuracy": "city_center"
            },
            "source": location.get("source", "nominatim")
        }
    except GeocodingError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        raise HTTPException(status_code=500, detail="Geocoding failed")
