"""
WeatherGPT Climate Routes
Climate normals, historical trends, and seasonal analysis
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime
import logging

from backend.services.climate_service import climate_service
from backend.services.geocoding_service import geocoding_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/climate", tags=["Climate"])


@router.get("/")
async def get_climate_info():
    """
    Get climate service information.
    """
    return {
        "service": "WeatherGPT Climate API",
        "description": "Historical weather data and climate trend analysis",
        "data_sources": ["Open-Meteo Historical Archive"],
        "available_endpoints": [
            "/climate/historical - Historical weather data",
            "/climate/trends - Temperature trends over years",
            "/climate/monsoon-comparison - Monsoon onset analysis",
            "/climate/extreme-events - Extreme weather events",
            "/climate/comparison - Current vs historical comparison"
        ]
    }


@router.get("/trends")
async def get_temperature_trends(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    years: int = Query(default=10, ge=1, le=20, description="Number of years to analyze")
):
    """
    Analyze temperature trends over specified years.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name (will be geocoded if lat/lng not provided)
        years: Number of years to analyze (1-20)

    Returns:
        Temperature trend analysis with yearly averages
    """
    try:
        # Geocode city if lat/lng not provided
        if lat is None or lng is None:
            if city:
                geocode_result = await geocoding_service.geocode(city)
                lat = geocode_result["lat"]
                lng = geocode_result["lng"]
            else:
                raise HTTPException(status_code=400, detail="Either lat/lng or city must be provided")

        trend_data = await climate_service.analyze_temperature_trend(
            lat=lat,
            lng=lng,
            years=years
        )

        return trend_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze temperature trends: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/historical")
async def get_historical_climate(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    start_date: str = Query(default=None, description="Start date YYYY-MM-DD"),
    end_date: str = Query(default=None, description="End date YYYY-MM-DD"),
    metrics: str = Query(default="temperature,precipitation", description="Comma-separated metrics")
):
    """
    Get historical weather data from Open-Meteo Archive API.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name (will be geocoded if lat/lng not provided)
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        metrics: Comma-separated list (temperature, precipitation, wind, humidity)

    Returns:
        Historical weather data with daily values
    """
    try:
        # Geocode city if lat/lng not provided
        if lat is None or lng is None:
            if city:
                geocode_result = await geocoding_service.geocode(city)
                lat = geocode_result["lat"]
                lng = geocode_result["lng"]
            else:
                raise HTTPException(status_code=400, detail="Either lat/lng or city must be provided")

        # Default to last year if dates not provided
        if not start_date or not end_date:
            from datetime import datetime, timedelta
            end = datetime.now()
            start = end - timedelta(days=365)
            start_date = start.strftime("%Y-%m-%d")
            end_date = end.strftime("%Y-%m-%d")

        # Parse metrics
        metrics_list = [m.strip() for m in metrics.split(",")]

        historical_data = await climate_service.fetch_historical_weather(
            lat=lat,
            lng=lng,
            start_date=start_date,
            end_date=end_date,
            metrics=metrics_list
        )

        return historical_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch historical climate data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/monsoon-comparison")
async def get_monsoon_comparison(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    year: int = Query(default=None, description="Year to analyze (default: current year)")
):
    """
    Compare monsoon onset to historical average.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name (will be geocoded if lat/lng not provided)
        year: Year to analyze (default: current year)

    Returns:
        Monsoon onset comparison with historical data
    """
    try:
        # Geocode city if lat/lng not provided
        if lat is None or lng is None:
            if city:
                geocode_result = await geocoding_service.geocode(city)
                lat = geocode_result["lat"]
                lng = geocode_result["lng"]
            else:
                raise HTTPException(status_code=400, detail="Either lat/lng or city must be provided")

        if year is None:
            year = datetime.now().year

        monsoon_data = await climate_service.compare_monsoon_onset(
            lat=lat,
            lng=lng,
            current_year=year
        )

        return monsoon_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch monsoon comparison: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/extreme-events")
async def get_extreme_events(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    year: int = Query(default=None, description="Year to analyze (default: current year)")
):
    """
    Analyze extreme weather events for a specific year.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name (will be geocoded if lat/lng not provided)
        year: Year to analyze (default: current year)

    Returns:
        Extreme weather event analysis
    """
    try:
        # Geocode city if lat/lng not provided
        if lat is None or lng is None:
            if city:
                geocode_result = await geocoding_service.geocode(city)
                lat = geocode_result["lat"]
                lng = geocode_result["lng"]
            else:
                raise HTTPException(status_code=400, detail="Either lat/lng or city must be provided")

        if year is None:
            year = datetime.now().year

        extreme_data = await climate_service.analyze_extreme_events(
            lat=lat,
            lng=lng,
            year=year
        )

        return extreme_data

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to analyze extreme events: {e}")
        raise HTTPException(status_code=500, detail=str(e))




@router.get("/comparison")
async def get_climate_comparison(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    metric: str = Query(default="temperature", description="Metric to compare (temperature or precipitation)")
):
    """
    Compare current month's weather to historical average.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name (will be geocoded if lat/lng not provided)
        metric: Metric to compare (temperature, precipitation)

    Returns:
        Current vs historical comparison data
    """
    try:
        # Geocode city if lat/lng not provided
        if lat is None or lng is None:
            if city:
                geocode_result = await geocoding_service.geocode(city)
                lat = geocode_result["lat"]
                lng = geocode_result["lng"]
            else:
                raise HTTPException(status_code=400, detail="Either lat/lng or city must be provided")

        comparison = await climate_service.compare_current_to_historical(
            lat=lat,
            lng=lng,
            metric=metric
        )

        return comparison

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to fetch climate comparison: {e}")
        raise HTTPException(status_code=500, detail=str(e))
