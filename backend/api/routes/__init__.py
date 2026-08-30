"""
WeatherGPT API Routes Package
"""

from backend.api.routes import (
    ask,
    weather,
    alerts,
    forecasts,
    climate,
    voice,
    nwp,
    chat,
    locations
)

__all__ = [
    "ask",
    "weather",
    "alerts",
    "forecasts",
    "climate",
    "voice",
    "nwp",
    "chat",
    "locations",
]