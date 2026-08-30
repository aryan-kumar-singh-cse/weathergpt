"""
WeatherGPT Forecast Routes
Hourly and daily weather forecast endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timedelta
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/forecasts", tags=["Forecasts"])


@router.get("/")
async def get_forecasts(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    forecast_type: str = "daily"
):
    """
    Get weather forecasts.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name
        forecast_type: 'daily' or 'hourly'
    """
    return {
        "location": {
            "lat": lat,
            "lng": lng,
            "city": city
        },
        "forecast_type": forecast_type,
        "message": "Forecasts retrieved successfully"
    }


@router.get("/daily")
async def get_daily_forecast(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    days: int = Query(default=7, ge=1, le=14)
):
    """
    Get daily weather forecast.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name
        days: Number of days to forecast (1-14)
    """
    return {
        "location": {
            "lat": lat,
            "lng": lng,
            "city": city
        },
        "forecast": {
            "daily": [
                {
                    "date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"),
                    "day_of_week": (datetime.now() + timedelta(days=i)).strftime("%A"),
                    "temperature_2m": {
                        "max": 35.0,
                        "min": 26.0,
                        "avg": 30.5
                    },
                    "apparent_temperature": {
                        "max": 42.0,
                        "min": 30.0
                    },
                    "precipitation_probability": 20,
                    "precipitation_sum": 0.0,
                    "weather_code": 0,
                    "weather_description": "Clear sky",
                    "wind_speed_10m": 10.0,
                    "humidity_2m": 65,
                    "uv_index": 7.0,
                    "sunrise": (datetime.now() + timedelta(days=i)).hour,
                    "sunset": (datetime.now() + timedelta(days=i)).hour
                }
                for i in range(days)
            ]
        },
        "model": "GFS 0.25°",
        "valid_time": datetime.now().isoformat(),
        "generated_at": datetime.now().isoformat()
    }


@router.get("/hourly")
async def get_hourly_forecast(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    hours: int = Query(default=24, ge=1, le=168)
):
    """
    Get hourly weather forecast.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name
        hours: Number of hours to forecast (1-168 = 7 days)
    """
    return {
        "location": {
            "lat": lat,
            "lng": lng,
            "city": city
        },
        "forecast": {
            "hourly": [
                {
                    "timestamp": (datetime.now() + timedelta(hours=i)).isoformat(),
                    "temperature_2m": 32.0 + (5 if i < 12 else -5),
                    "apparent_temperature": 38.0,
                    "precipitation_probability": 10,
                    "precipitation_sum": 0.0,
                    "weather_code": 0,
                    "weather_description": "Clear sky",
                    "wind_speed_10m": 12.0,
                    "winddirection_10m": 270,
                    "humidity_2m": 70,
                    "uv_index": max(0, 8 - i / 4),
                    "cloud_cover": 20
                }
                for i in range(hours)
            ]
        },
        "model": "GFS 0.25°",
        "valid_time": datetime.now().isoformat(),
        "generated_at": datetime.now().isoformat()
    }


@router.get("/extended")
async def get_extended_forecast(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    days: int = Query(default=14, ge=1, le=30)
):
    """
    Get extended 10-15 day forecast.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name
        days: Number of days (1-30)
    """
    return {
        "location": {
            "lat": lat,
            "lng": lng,
            "city": city
        },
        "forecast": {
            "extended": [
                {
                    "date": (datetime.now() + timedelta(days=i)).strftime("%Y-%m-%d"),
                    "temperature_2m": {
                        "max": 35.0,
                        "min": 26.0
                    },
                    "precipitation_probability": 25,
                    "weather_code": 0,
                    "weather_description": "Partly cloudy"
                }
                for i in range(days)
            ]
        },
        "model": "GFS 0.25°",
        "confidence": "medium",
        "note": "Extended forecasts beyond 7 days have reduced accuracy"
    }


@router.get("/trend")
async def get_forecast_trend(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    metric: str = "temperature"
):
    """
    Get forecast trend analysis.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name
        metric: 'temperature', 'humidity', 'precipitation'
    """
    return {
        "location": {
            "lat": lat,
            "lng": lng,
            "city": city
        },
        "metric": metric,
        "trend": {
            "direction": "increasing",
            "change_percent": 2.5,
            "description": "Temperature expected to increase over forecast period"
        }
    }
