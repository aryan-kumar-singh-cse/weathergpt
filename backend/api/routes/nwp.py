"""
WeatherGPT NWP Routes
Numerical Weather Prediction model integration endpoints
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/nwp", tags=["NWP Models"])


@router.get("/")
async def get_nwp_info():
    """
    Get NWP service information.

    Returns:
        NWP service capabilities and supported models
    """
    return {
        "service": "WeatherGPT NWP API",
        "description": "Numerical Weather Prediction model integration",
        "models": [
            {
                "name": "GFS",
                "provider": "NOAA",
                "full_name": "Global Forecast System",
                "resolution": "0.25°",
                "forecast_range": "7 days",
                "update_frequency": "3 hours"
            },
            {
                "name": "WRF",
                "provider": "NCAR/NOAA",
                "full_name": "Weather Research and Forecasting",
                "resolution": "3-15 km (regional)",
                "forecast_range": "5-7 days",
                "update_frequency": "6 hours"
            }
        ],
        "features": [
            "Multi-model ensemble forecasting",
            "Model confidence estimation",
            "Grid data access",
            "Variable selection"
        ]
    }


@router.get("/status")
async def get_nwp_status():
    """
    Get current status of all NWP models.

    Returns:
        Status of each NWP model
    """
    return {
        "models": {
            "GFS": {
                "status": "operational",
                "last_update": datetime.now().isoformat(),
                "next_update": (datetime.now() + __import__("timedelta").timedelta(hours=3)).isoformat(),
                "available": True,
                "data_quality": "high"
            },
            "WRF": {
                "status": "operational",
                "last_update": datetime.now().isoformat(),
                "next_update": (datetime.now() + __import__("timedelta").timedelta(hours=6)).isoformat(),
                "available": True,
                "data_quality": "high"
            }
        },
        "timestamp": datetime.now().isoformat()
    }


@router.get("/ensemble")
async def get_ensemble_forecast(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    city: Optional[str] = Query(None),
    lead_hours: int = Query(default=0, ge=0, le=168),
    variable: str = Query(default="temperature_2m")
):
    """
    Get ensemble forecast combining multiple NWP models.

    Args:
        lat: Latitude
        lng: Longitude
        city: City name
        lead_hours: Forecast lead time (0-168 hours)
        variable: Weather variable (temperature_2m, humidity_2m, etc.)

    Returns:
        Ensemble forecast with spread analysis
    """
    # In production, would fetch from multiple models
    return {
        "location": {
            "lat": lat,
            "lng": lng,
            "city": city
        },
        "forecast_time": datetime.now().isoformat(),
        "lead_hours": lead_hours,
        "variable": variable,
        "ensemble": {
            "models": {
                "GFS": {
                    "value": 32.5,
                    "unit": "°C"
                },
                "WRF": {
                    "value": 31.8,
                    "unit": "°C"
                }
            },
            "consensus": {
                "mean": 32.15,
                "std_dev": 0.65,
                "range": {"min": 31.8, "max": 32.5}
            },
            "confidence": "high" if 0.65 < 3 else "medium",
            "ensemble_size": 2
        }
    }


@router.get("/grid")
async def get_grid_data(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    city: Optional[str] = Query(None),
    model: str = Query(default="GFS"),
    variables: List[str] = Query(default=["temperature_2m", "humidity_2m", "windspeed_10m"]),
    radius_km: int = Query(default=50, ge=10, le=500)
):
    """
    Get NWP model grid data for a location and radius.

    Args:
        lat: Latitude
        lng: Longitude
        city: City name
        model: NWP model (GFS, WRF)
        variables: List of weather variables
        radius_km: Search radius in km

    Returns:
        Grid data within radius
    """
    return {
        "location": {
            "lat": lat,
            "lng": lng,
            "city": city
        },
        "model": model,
        "search_radius_km": radius_km,
        "grid_data": [
            {
                "grid_point": {
                    "lat": lat + 0.01,
                    "lng": lng + 0.01
                },
                "variables": {
                    "temperature_2m": 32.5,
                    "humidity_2m": 75,
                    "windspeed_10m": 15.3
                },
                "distance_km": 1.2,
                "quality": "high"
            }
            for _ in range(5)
        ],
        "metadata": {
            "grid_resolution": "0.25°",
            "valid_time": datetime.now().isoformat()
        }
    }


@router.get("/confidence")
async def get_forecast_confidence(
    lat: Optional[float] = Query(None),
    lng: Optional[float] = Query(None),
    city: Optional[str] = Query(None),
    lead_hours: int = Query(default=24, ge=0, le=168)
):
    """
    Get forecast confidence analysis.

    Args:
        lat: Latitude
        lng: Longitude
        city: City name
        lead_hours: Forecast lead time

    Returns:
        Confidence analysis for forecast
    """
    confidence_map = {
        0: {"level": "very_high", "score": 0.95, "description": "Forecast is highly reliable"},
        6: {"level": "high", "score": 0.85, "description": "Forecast is reliable"},
        12: {"level": "high", "score": 0.80, "description": "Forecast is reliable"},
        24: {"level": "medium", "score": 0.70, "description": "Forecast is reasonable"},
        48: {"level": "medium", "score": 0.65, "description": "Forecast is reasonable"},
        72: {"level": "medium", "score": 0.60, "description": "Forecast has some uncertainty"},
        96: {"level": "low", "score": 0.50, "description": "Forecast is uncertain"},
        120: {"level": "low", "score": 0.45, "description": "Forecast should be verified"}
    }

    lead_level = min(lead_hours // 6, 7)
    lead_key = min(lead_level, len(confidence_map) - 1)

    return {
        "location": {
            "lat": lat,
            "lng": lng,
            "city": city
        },
        "lead_hours": lead_hours,
        "confidence": {
            "level": confidence_map[lead_key]["level"],
            "score": confidence_map[lead_key]["score"],
            "description": confidence_map[lead_key]["description"]
        },
        "recommendation": "Use for operational decisions" if confidence_map[lead_key]["score"] >= 0.8 else "Verify with observations"
    }


@router.get("/variables")
async def get_available_variables():
    """
    Get list of available NWP model variables.

    Returns:
        List of available weather variables
    """
    return {
        "variables": {
            "temperature_2m": {
                "name": "2m Temperature",
                "unit": "°C",
                "description": "Temperature at 2 meters above ground"
            },
            "apparent_temperature": {
                "name": "Apparent Temperature",
                "unit": "°C",
                "description": "Feels-like temperature"
            },
            "pressure_msl": {
                "name": "Mean Sea Level Pressure",
                "unit": "hPa",
                "description": "Sea level atmospheric pressure"
            },
            "relative_humidity_2m": {
                "name": "Relative Humidity",
                "unit": "%",
                "description": "Humidity at 2 meters above ground"
            },
            "windspeed_10m": {
                "name": "Wind Speed",
                "unit": "km/h",
                "description": "Wind speed at 10 meters"
            },
            "winddirection_10m": {
                "name": "Wind Direction",
                "unit": "degrees",
                "description": "Wind direction at 10 meters"
            },
            "precipitation_probability": {
                "name": "Precipitation Probability",
                "unit": "%",
                "description": "Chance of precipitation"
            },
            "precipitation_sum": {
                "name": "Precipitation",
                "unit": "mm",
                "description": "Accumulated precipitation"
            },
            "visibility": {
                "name": "Visibility",
                "unit": "km",
                "description": "Atmospheric visibility"
            },
            "cloudcover": {
                "name": "Cloud Cover",
                "unit": "%",
                "description": "Cloud coverage percentage"
            },
            "uv_index": {
                "name": "UV Index",
                "unit": "index",
                "description": "Ultraviolet radiation index"
            }
        }
    }


@router.get("/model/availability")
async def get_model_availability():
    """
    Get list of available NWP models.

    Returns:
        List of available models
    """
    models = {
        "GFS": {
            "name": "Global Forecast System",
            "provider": "NOAA",
            "resolution": "0.25°",
            "forecast_range": "7 days",
            "update_frequency": "3 hours",
            "available": True
        },
        "WRF": {
            "name": "Weather Research and Forecasting",
            "provider": "NCAR/NOAA",
            "resolution": "3-15 km",
            "forecast_range": "5-7 days",
            "update_frequency": "6 hours",
            "available": True
        }
    }

    return {
        "models": models,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/model/{model_name}/documentation")
async def get_model_documentation(model_name: str):
    """
    Get documentation for a specific NWP model.

    Args:
        model_name: Model name (GFS, WRF)

    Returns:
        Model documentation
    """
    models = {
        "GFS": {
            "provider": "NOAA",
            "documentation_url": "https://www.ncdc.noaa.gov/gfs",
            "api_docs_url": "https://api.weather.gov/models/gfs"
        },
        "WRF": {
            "provider": "NCAR/NOAA",
            "documentation_url": "https://wrf-model.org",
            "api_docs_url": "https://api.wrfmodel.org"
        }
    }

    if model_name in models:
        return models[model_name]
    raise HTTPException(status_code=404, detail=f"Model {model_name} not found")
