"""
Unit tests for Alert Service
"""

import pytest
import asyncio
from datetime import datetime
from backend.services.alert_service import AlertService, AlertThreshold, WeatherAlert


@pytest.fixture
def alert_service():
    """Create a fresh alert service instance for testing."""
    return AlertService()


@pytest.fixture
def sample_weather_data():
    """Sample weather data for testing severity classification."""
    return {
        "location": {"lat": 19.076, "lng": 72.8777, "timezone": "Asia/Kolkata"},
        "current": {
            "temperature": 46.0,
            "apparent_temperature": 48.0,
            "humidity": 65,
            "precipitation": 0,
            "pressure": 1013,
            "wind_speed": 25,
            "wind_direction": 180,
            "weather_code": 0,
            "time": datetime.utcnow().isoformat()
        },
        "forecast": {
            "days": [
                {
                    "date": "2026-08-30",
                    "temperature_max": 45,
                    "temperature_min": 35,
                    "precipitation_sum": 0,
                    "precipitation_probability": 10,
                    "wind_speed_max": 30,
                    "weather_code": 0
                }
            ]
        },
        "data_source": "Open-Meteo",
        "timestamp": datetime.utcnow().isoformat()
    }


class TestSeverityClassification:
    """Test severity classification logic."""

    def test_extreme_heat_classification(self, alert_service, sample_weather_data):
        """Test extreme heat alert generation."""
        result = alert_service.classify_severity(sample_weather_data)

        assert result["severity"] == "extreme"
        assert result["alert_count"] > 0
        assert any("EXTREME HEAT" in alert["message"] for alert in result["alerts"])

    def test_high_wind_classification(self, alert_service, sample_weather_data):
        """Test high wind alert generation."""
        # Modify data for high wind
        sample_weather_data["current"]["temperature"] = 30.0
        sample_weather_data["current"]["wind_speed"] = 70.0

        result = alert_service.classify_severity(sample_weather_data)

        assert result["severity"] in ["warning", "severe"]
        assert any("wind" in alert["message"].lower() for alert in result["alerts"])

    def test_heavy_rain_classification(self, alert_service, sample_weather_data):
        """Test heavy rain alert generation."""
        # Modify data for heavy rain
        sample_weather_data["current"]["temperature"] = 30.0
        sample_weather_data["forecast"]["days"][0]["precipitation_sum"] = 150
        sample_weather_data["forecast"]["days"][0]["precipitation_probability"] = 85

        result = alert_service.classify_severity(sample_weather_data)

        assert result["severity"] in ["severe", "extreme"]
        assert any("rain" in alert["message"].lower() for alert in result["alerts"])

    def test_frost_classification(self, alert_service, sample_weather_data):
        """Test frost/freeze alert generation."""
        # Modify data for freezing conditions
        sample_weather_data["current"]["temperature"] = -2.0

        result = alert_service.classify_severity(sample_weather_data)

        assert result["severity"] in ["severe", "warning"]
        assert any("frost" in alert["message"].lower() or "freeze" in alert["message"].lower()
                   for alert in result["alerts"])

    def test_normal_conditions(self, alert_service, sample_weather_data):
        """Test normal weather conditions."""
        # Modify data for normal conditions
        sample_weather_data["current"]["temperature"] = 28.0
        sample_weather_data["current"]["wind_speed"] = 15.0

        result = alert_service.classify_severity(sample_weather_data)

        assert result["severity"] == "normal"
        assert result["alert_count"] == 0

    def test_custom_thresholds(self, alert_service, sample_weather_data):
        """Test classification with custom thresholds."""
        # Set custom thresholds
        alert_service.thresholds.heat_extreme = 50.0

        # Temperature below new threshold
        sample_weather_data["current"]["temperature"] = 48.0

        result = alert_service.classify_severity(sample_weather_data)

        assert result["severity"] != "extreme"


class TestAlertCreation:
    """Test alert creation and management."""

    def test_create_alert_from_classification(self, alert_service):
        """Test creating structured alert from classification."""
        alert_data = {
            "type": "heatwave",
            "severity": "extreme",
            "message": "EXTREME HEAT WARNING: Temperature exceeds 45°C"
        }

        location = {"lat": 19.076, "lng": 72.8777, "name": "Mumbai"}

        alert = alert_service.create_alert_from_classification(alert_data, location)

        assert alert.alert_type == "heatwave"
        assert alert.severity == "extreme"
        assert alert.location == location
        assert alert.id in alert_service.active_alerts

    def test_get_active_alerts(self, alert_service):
        """Test retrieving active alerts."""
        # Create test alerts
        alert_data1 = {
            "type": "heatwave",
            "severity": "extreme",
            "message": "Extreme heat"
        }
        alert_data2 = {
            "type": "high_wind",
            "severity": "warning",
            "message": "High winds"
        }

        location = {"lat": 19.076, "lng": 72.8777}

        alert_service.create_alert_from_classification(alert_data1, location)
        alert_service.create_alert_from_classification(alert_data2, location)

        # Get all alerts
        alerts = alert_service.get_active_alerts()
        assert len(alerts) == 2

        # Filter by type
        heat_alerts = alert_service.get_active_alerts(alert_type="heatwave")
        assert len(heat_alerts) == 1
        assert heat_alerts[0].alert_type == "heatwave"

        # Filter by severity
        extreme_alerts = alert_service.get_active_alerts(severity="extreme")
        assert len(extreme_alerts) == 1


class TestSubscriptions:
    """Test alert subscription management."""

    @pytest.mark.asyncio
    async def test_subscribe_user(self, alert_service):
        """Test creating a user subscription."""
        subscription = await alert_service.subscribe_user(
            user_id="test_user_1",
            location={"lat": 19.076, "lng": 72.8777, "city": "Mumbai"},
            alert_types=["heatwave", "heavy_rain"],
            severity_levels=["warning", "severe", "extreme"],
            delivery_channels=["push", "sms"],
            notification_frequency="immediate"
        )

        assert subscription.user_id == "test_user_1"
        assert subscription.is_active
        assert "heatwave" in subscription.alert_types
        assert subscription.subscription_id in alert_service.subscriptions

    @pytest.mark.asyncio
    async def test_unsubscribe_user(self, alert_service):
        """Test unsubscribing a user."""
        subscription = await alert_service.subscribe_user(
            user_id="test_user_2",
            location={"lat": 19.076, "lng": 72.8777},
            alert_types=["heatwave"],
            severity_levels=["extreme"],
            delivery_channels=["push"]
        )

        success = await alert_service.unsubscribe_user(subscription.subscription_id)

        assert success
        assert not alert_service.subscriptions[subscription.subscription_id].is_active


class TestAlertDissemination:
    """Test alert dissemination."""

    @pytest.mark.asyncio
    async def test_disseminate_alert_simulation(self, alert_service):
        """Test simulated alert dissemination."""
        alert_data = {
            "type": "heatwave",
            "severity": "extreme",
            "message": "Test alert"
        }
        location = {"lat": 19.076, "lng": 72.8777}
        alert = alert_service.create_alert_from_classification(alert_data, location)

        recipient = {"user_id": "test_user"}
        channels = ["push", "sms"]

        delivery_status = await alert_service.disseminate_alert(alert, channels, recipient)

        assert "push" in delivery_status
        assert "sms" in delivery_status
        assert delivery_status["push"]["status"] == "simulated"
        assert delivery_status["sms"]["status"] == "simulated"

    @pytest.mark.asyncio
    async def test_notify_subscribers(self, alert_service):
        """Test notifying subscribers of an alert."""
        # Create subscription
        await alert_service.subscribe_user(
            user_id="test_user_3",
            location={"lat": 19.076, "lng": 72.8777},
            alert_types=["heatwave"],
            severity_levels=["extreme"],
            delivery_channels=["push"]
        )

        # Create matching alert
        alert_data = {
            "type": "heatwave",
            "severity": "extreme",
            "message": "Test notification"
        }
        location = {"lat": 19.076, "lng": 72.8777}
        alert = alert_service.create_alert_from_classification(alert_data, location)

        # Notify subscribers
        await alert_service.notify_subscribers(alert)

        # Check that subscription was notified
        subscription = list(alert_service.subscriptions.values())[0]
        assert subscription.last_notified is not None


class TestThresholdConfiguration:
    """Test threshold configuration."""

    def test_default_thresholds(self, alert_service):
        """Test default threshold values."""
        thresholds = alert_service.thresholds

        assert thresholds.wind_warning == 62.0
        assert thresholds.heat_extreme == 45.0
        assert thresholds.cold_extreme == 0.0
        assert thresholds.rain_heavy_mm == 100.0

    def test_custom_threshold_configuration(self):
        """Test configuring custom thresholds."""
        custom_thresholds = AlertThreshold(
            wind_warning=50.0,
            heat_extreme=40.0
        )

        assert custom_thresholds.wind_warning == 50.0
        assert custom_thresholds.heat_extreme == 40.0
        # Default values should still be present
        assert custom_thresholds.cold_extreme == 0.0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
