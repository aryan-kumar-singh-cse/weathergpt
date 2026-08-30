"""
Unit tests for Alert Watcher
"""

import pytest
import asyncio
from datetime import datetime
from backend.services.alert_watcher import AlertWatcher


@pytest.fixture
def alert_watcher():
    """Create a fresh alert watcher instance for testing."""
    return AlertWatcher(poll_interval_seconds=1)  # Short interval for testing


class TestLocationManagement:
    """Test location management in alert watcher."""

    def test_add_location(self, alert_watcher):
        """Test adding a location to monitoring."""
        alert_watcher.add_location(
            location_key="test_mumbai",
            lat=19.076,
            lng=72.8777,
            name="Mumbai"
        )

        assert "test_mumbai" in alert_watcher.monitored_locations
        assert alert_watcher.monitored_locations["test_mumbai"]["name"] == "Mumbai"

    def test_remove_location(self, alert_watcher):
        """Test removing a location from monitoring."""
        alert_watcher.add_location(
            location_key="test_delhi",
            lat=28.7041,
            lng=77.1025,
            name="Delhi"
        )

        alert_watcher.remove_location("test_delhi")

        assert "test_delhi" not in alert_watcher.monitored_locations

    def test_add_multiple_locations(self, alert_watcher):
        """Test adding multiple locations."""
        locations = {
            "mumbai": {"lat": 19.076, "lng": 72.8777, "name": "Mumbai"},
            "delhi": {"lat": 28.7041, "lng": 77.1025, "name": "Delhi"},
            "bangalore": {"lat": 12.9716, "lng": 77.5946, "name": "Bangalore"}
        }

        for key, loc in locations.items():
            alert_watcher.add_location(key, loc["lat"], loc["lng"], loc["name"])

        assert len(alert_watcher.monitored_locations) == 3


class TestMonitoringStatus:
    """Test monitoring status and state management."""

    def test_initial_status(self, alert_watcher):
        """Test initial watcher status."""
        status = alert_watcher.get_status()

        assert status["is_running"] is False
        assert status["monitored_locations"] == 0
        assert status["active_breaches"] == 0

    def test_status_with_locations(self, alert_watcher):
        """Test status with monitored locations."""
        alert_watcher.add_location("test_loc", 19.076, 72.8777, "Test")

        status = alert_watcher.get_status()

        assert status["monitored_locations"] == 1
        assert len(status["locations"]) == 1
        assert status["locations"][0]["name"] == "Test"

    @pytest.mark.asyncio
    async def test_start_stop_watcher(self, alert_watcher):
        """Test starting and stopping the watcher."""
        # Start watcher
        await alert_watcher.start()
        assert alert_watcher.is_running is True

        # Give it a moment to run
        await asyncio.sleep(0.5)

        # Stop watcher
        await alert_watcher.stop()
        assert alert_watcher.is_running is False


class TestBreachDetection:
    """Test breach detection and tracking."""

    @pytest.mark.asyncio
    async def test_check_location_normal_conditions(self, alert_watcher):
        """Test checking a location with normal conditions."""
        alert_watcher.add_location(
            location_key="test_normal",
            lat=12.9716,  # Bangalore - typically moderate weather
            lng=77.5946,
            name="Test Normal"
        )

        location = alert_watcher.monitored_locations["test_normal"]

        # Check location
        await alert_watcher.check_location("test_normal", location)

        # Should have been checked
        assert "test_normal" in alert_watcher.last_check

    @pytest.mark.asyncio
    async def test_breach_tracking(self, alert_watcher):
        """Test that breaches are tracked correctly."""
        from backend.services.alert_service import alert_service

        alert_watcher.add_location(
            location_key="test_breach",
            lat=19.076,
            lng=72.8777,
            name="Test Breach"
        )

        # Simulate initial check (might or might not have breaches)
        location = alert_watcher.monitored_locations["test_breach"]
        await alert_watcher.check_location("test_breach", location)

        # Check that breach tracking is initialized
        assert "test_breach" in alert_watcher.active_breaches


class TestMonitoringLoop:
    """Test the continuous monitoring loop."""

    @pytest.mark.asyncio
    async def test_monitoring_loop_execution(self, alert_watcher):
        """Test that the monitoring loop executes."""
        alert_watcher.add_location(
            location_key="test_loop",
            lat=19.076,
            lng=72.8777,
            name="Test Loop"
        )

        # Start watcher
        await alert_watcher.start()

        # Let it run for a few seconds
        await asyncio.sleep(2.5)

        # Stop watcher
        await alert_watcher.stop()

        # Check that location was checked
        assert "test_loop" in alert_watcher.last_check

    @pytest.mark.asyncio
    async def test_empty_monitoring_loop(self, alert_watcher):
        """Test monitoring loop with no locations."""
        # Start watcher with no locations
        await alert_watcher.start()

        # Let it run briefly
        await asyncio.sleep(1.5)

        # Stop watcher
        await alert_watcher.stop()

        # Should have run without errors
        assert alert_watcher.is_running is False


class TestErrorHandling:
    """Test error handling in alert watcher."""

    @pytest.mark.asyncio
    async def test_invalid_coordinates_handling(self, alert_watcher):
        """Test handling of invalid coordinates."""
        alert_watcher.add_location(
            location_key="test_invalid",
            lat=999.0,  # Invalid latitude
            lng=999.0,  # Invalid longitude
            name="Invalid Location"
        )

        location = alert_watcher.monitored_locations["test_invalid"]

        # Should handle error gracefully
        try:
            await alert_watcher.check_location("test_invalid", location)
            # If it doesn't raise, that's fine - it should log the error
        except Exception as e:
            pytest.fail(f"Should handle invalid coordinates gracefully, got: {e}")


@pytest.mark.asyncio
async def test_initialize_default_monitoring():
    """Test initialization of default city monitoring."""
    from backend.services.alert_watcher import initialize_default_monitoring, alert_watcher

    # Clear any existing locations
    alert_watcher.monitored_locations.clear()

    # Initialize default monitoring
    await initialize_default_monitoring()

    # Check that major cities were added
    assert len(alert_watcher.monitored_locations) >= 8
    assert "mumbai" in alert_watcher.monitored_locations
    assert "delhi" in alert_watcher.monitored_locations
    assert "bangalore" in alert_watcher.monitored_locations


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
