"""
WeatherGPT Alert Watcher
Proactive weather monitoring with automatic alert generation
"""

import asyncio
import logging
from typing import Dict, Any, List, Set
from datetime import datetime, timedelta

from backend.services.alert_service import alert_service
from backend.services.weather_service import weather_service

logger = logging.getLogger(__name__)


class AlertWatcher:
    """
    Proactive alert monitoring service.

    Continuously monitors weather conditions for configured locations
    and automatically generates alerts when thresholds are breached.

    Features:
    - Configurable polling interval
    - Location-based monitoring
    - Automatic alert generation
    - Subscriber notification
    - Breach detection and tracking
    """

    def __init__(self, poll_interval_seconds: int = 300):
        """
        Initialize alert watcher.

        Args:
            poll_interval_seconds: How often to check weather (default: 5 minutes)
        """
        self.poll_interval = poll_interval_seconds
        self.monitored_locations: Dict[str, Dict[str, Any]] = {}
        self.last_check: Dict[str, datetime] = {}
        self.active_breaches: Dict[str, Set[str]] = {}  # location_key -> set of alert types
        self.is_running = False
        self.watcher_task: asyncio.Task = None

    def add_location(
        self,
        location_key: str,
        lat: float,
        lng: float,
        name: str = None
    ):
        """
        Add a location to monitor.

        Args:
            location_key: Unique identifier for this location
            lat: Latitude
            lng: Longitude
            name: Human-readable location name
        """
        self.monitored_locations[location_key] = {
            "lat": lat,
            "lng": lng,
            "name": name or location_key,
            "added_at": datetime.utcnow().isoformat()
        }

        logger.info(f"Added monitoring for location: {name or location_key} ({lat}, {lng})")

    def remove_location(self, location_key: str):
        """Remove a location from monitoring."""
        if location_key in self.monitored_locations:
            del self.monitored_locations[location_key]
            if location_key in self.last_check:
                del self.last_check[location_key]
            if location_key in self.active_breaches:
                del self.active_breaches[location_key]

            logger.info(f"Removed monitoring for location: {location_key}")

    async def check_location(self, location_key: str, location: Dict[str, Any]):
        """
        Check weather conditions for a single location.

        Args:
            location_key: Location identifier
            location: Location data with lat/lng
        """
        try:
            lat = location["lat"]
            lng = location["lng"]
            name = location.get("name", location_key)

            # Fetch current weather
            weather_data = await weather_service.fetch_weather(lat, lng)

            # Classify severity
            severity_info = alert_service.classify_severity(weather_data)

            # Track current breaches
            current_breaches = set()

            # Process alerts
            for alert_data in severity_info["alerts"]:
                alert_type = alert_data["type"]
                current_breaches.add(alert_type)

                # Check if this is a new breach
                location_breaches = self.active_breaches.get(location_key, set())

                if alert_type not in location_breaches:
                    # NEW BREACH - generate and disseminate alert
                    logger.warning(
                        f"[THRESHOLD BREACH] {name}: {alert_data['severity'].upper()} "
                        f"{alert_type} - {alert_data['message']}"
                    )

                    # Create structured alert
                    alert = alert_service.create_alert_from_classification(
                        alert_data,
                        location={
                            "lat": lat,
                            "lng": lng,
                            "name": name
                        }
                    )

                    # Notify subscribers
                    await alert_service.notify_subscribers(alert)

            # Update active breaches
            self.active_breaches[location_key] = current_breaches

            # Log cleared breaches
            previous_breaches = self.active_breaches.get(location_key, set())
            cleared_breaches = previous_breaches - current_breaches

            if cleared_breaches:
                logger.info(
                    f"[BREACH CLEARED] {name}: {', '.join(cleared_breaches)}"
                )

            # Update last check time
            self.last_check[location_key] = datetime.utcnow()

        except Exception as e:
            logger.error(f"Error checking location {location_key}: {e}")

    async def monitoring_loop(self):
        """
        Main monitoring loop.

        Continuously polls all monitored locations at the configured interval.
        """
        logger.info(f"Alert watcher started (polling every {self.poll_interval}s)")

        while self.is_running:
            try:
                # Check all monitored locations
                if self.monitored_locations:
                    tasks = [
                        self.check_location(key, loc)
                        for key, loc in self.monitored_locations.items()
                    ]

                    await asyncio.gather(*tasks, return_exceptions=True)

                    logger.debug(
                        f"Checked {len(self.monitored_locations)} locations, "
                        f"{sum(len(b) for b in self.active_breaches.values())} active breaches"
                    )
                else:
                    logger.debug("No locations to monitor")

                # Wait for next poll interval
                await asyncio.sleep(self.poll_interval)

            except Exception as e:
                logger.error(f"Error in monitoring loop: {e}")
                await asyncio.sleep(10)  # Brief pause before retry

        logger.info("Alert watcher stopped")

    async def start(self):
        """Start the alert watcher."""
        if self.is_running:
            logger.warning("Alert watcher already running")
            return

        self.is_running = True
        self.watcher_task = asyncio.create_task(self.monitoring_loop())

        logger.info("Alert watcher started")

    async def stop(self):
        """Stop the alert watcher."""
        if not self.is_running:
            return

        self.is_running = False

        if self.watcher_task:
            self.watcher_task.cancel()
            try:
                await self.watcher_task
            except asyncio.CancelledError:
                pass

        logger.info("Alert watcher stopped")

    def get_status(self) -> Dict[str, Any]:
        """Get current watcher status."""
        return {
            "is_running": self.is_running,
            "poll_interval_seconds": self.poll_interval,
            "monitored_locations": len(self.monitored_locations),
            "active_breaches": sum(len(b) for b in self.active_breaches.values()),
            "locations": [
                {
                    "key": key,
                    "name": loc.get("name"),
                    "lat": loc["lat"],
                    "lng": loc["lng"],
                    "last_checked": self.last_check.get(key, "never"),
                    "active_alerts": len(self.active_breaches.get(key, set()))
                }
                for key, loc in self.monitored_locations.items()
            ],
            "timestamp": datetime.utcnow().isoformat()
        }


# Global instance
alert_watcher = AlertWatcher(poll_interval_seconds=300)  # 5 minutes


async def initialize_default_monitoring():
    """
    Initialize monitoring for major Indian cities.

    This should be called on application startup.
    """
    default_cities = {
        "mumbai": {"lat": 19.0760, "lng": 72.8777, "name": "Mumbai"},
        "delhi": {"lat": 28.7041, "lng": 77.1025, "name": "Delhi"},
        "bangalore": {"lat": 12.9716, "lng": 77.5946, "name": "Bangalore"},
        "hyderabad": {"lat": 17.3850, "lng": 78.4867, "name": "Hyderabad"},
        "chennai": {"lat": 13.0827, "lng": 80.2707, "name": "Chennai"},
        "kolkata": {"lat": 22.5726, "lng": 88.3639, "name": "Kolkata"},
        "pune": {"lat": 18.5204, "lng": 73.8567, "name": "Pune"},
        "ahmedabad": {"lat": 23.0225, "lng": 72.5714, "name": "Ahmedabad"}
    }

    for key, location in default_cities.items():
        alert_watcher.add_location(
            location_key=key,
            lat=location["lat"],
            lng=location["lng"],
            name=location["name"]
        )

    logger.info(f"Initialized monitoring for {len(default_cities)} major cities")
