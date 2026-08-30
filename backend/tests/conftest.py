"""
Pytest Configuration
Settings for test discovery, markers, and async test support
"""

import pytest
import os
import sys
from datetime import datetime
from fastapi.testclient import TestClient

# Add backend directory to Python path for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


@pytest.fixture(scope="session")
def event_loop_policy():
    """Set event loop policy for async tests."""
    import asyncio
    return asyncio.DefaultEventLoopPolicy()


@pytest.fixture(scope="module")
def client():
    """FastAPI TestClient fixture for API endpoint testing."""
    from backend.api.main import app
    return TestClient(app)


@pytest.fixture
def sample_session_id():
    """Generate a sample session ID for testing."""
    return "test-session-12345"


@pytest.fixture
def valid_roles():
    """Return list of valid role types."""
    return ["citizen", "farmer", "disaster_manager", "pilot", "researcher"]


@pytest.fixture
def mock_weather_data():
    """Mock weather data factory for testing."""
    def _create_weather_data():
        return {
            "temperature": 27.5,
            "feels_like": 28.2,
            "humidity": 65,
            "wind_speed": 12.5,
            "wind_direction": 180,
            "precipitation": 0.0,
            "pressure": 1013.25,
            "cloud_cover": 40,
            "visibility": 10000,
            "uv_index": 6,
            "condition": "partly_cloudy",
            "description": "Partly cloudy",
            "timestamp": datetime.utcnow().isoformat()
        }
    return _create_weather_data


@pytest.fixture
def mock_intent_data():
    """Mock intent extraction data factory."""
    def _create_intent():
        return {
            "intent": "weather_query",
            "location": "Mumbai",
            "timeframe": "current",
            "parameters": {}
        }
    return _create_intent


@pytest.fixture
def mock_geocoding_data():
    """Mock geocoding data factory."""
    def _create_geocode():
        return {
            "latitude": 19.0760,
            "longitude": 72.8777,
            "city": "Mumbai",
            "state": "Maharashtra",
            "country": "India"
        }
    return _create_geocode


@pytest.fixture
def mock_forecast_data():
    """Mock forecast data factory."""
    def _create_forecast():
        return {
            "daily": [
                {
                    "date": "2026-08-29",
                    "temp_max": 32.0,
                    "temp_min": 24.0,
                    "precipitation_probability": 20,
                    "condition": "sunny"
                },
                {
                    "date": "2026-08-30",
                    "temp_max": 31.5,
                    "temp_min": 23.5,
                    "precipitation_probability": 30,
                    "condition": "partly_cloudy"
                }
            ],
            "hourly": []
        }
    return _create_forecast


@pytest.fixture
def mock_alert_data():
    """Mock weather alert data factory."""
    def _create_alert():
        return {
            "alert_id": "alert-123",
            "severity": "moderate",
            "type": "heat",
            "message": "High temperature expected",
            "start_time": datetime.utcnow().isoformat(),
            "end_time": None,
            "affected_area": "Mumbai"
        }
    return _create_alert
