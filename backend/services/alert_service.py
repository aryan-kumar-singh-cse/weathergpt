"""
WeatherGPT Alert Service
Extreme weather alert management with severity classification,
proactive monitoring, and multi-channel dissemination
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import json

logger = logging.getLogger(__name__)


@dataclass
class AlertThreshold:
    """Configurable alert thresholds for weather conditions."""
    # Wind speed thresholds (km/h)
    wind_watch: float = 40.0
    wind_warning: float = 62.0
    wind_severe: float = 90.0

    # Temperature thresholds (°C)
    heat_warning: float = 40.0
    heat_extreme: float = 45.0
    cold_warning: float = 5.0
    cold_extreme: float = 0.0

    # Rainfall thresholds (mm)
    rain_moderate_mm: float = 50.0
    rain_heavy_mm: float = 100.0
    rain_extreme_mm: float = 200.0

    # Rainfall probability threshold (%)
    rain_probability_threshold: float = 70.0
    rain_probability_severe: float = 80.0

    # Humidity thresholds (%)
    humidity_high: float = 85.0
    humidity_low: float = 20.0


@dataclass
class WeatherAlert:
    """Structured weather alert."""
    id: str
    alert_type: str  # heatwave, heavy_rain, high_wind, frost, storm
    severity: str  # normal, watch, warning, severe, extreme
    message: str
    location: Dict[str, Any]
    timestamp: str
    expires_at: str
    source: str = "severity_classification"
    affected_areas: Optional[List[str]] = None
    weather_data: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return asdict(self)


@dataclass
class AlertSubscription:
    """User subscription to weather alerts."""
    subscription_id: str
    user_id: str
    location: Dict[str, Any]
    alert_types: List[str]
    severity_levels: List[str]
    delivery_channels: List[str]  # push, sms, email, whatsapp, voice
    notification_frequency: str  # immediate, hourly, daily
    is_active: bool = True
    created_at: Optional[str] = None
    last_notified: Optional[str] = None


class AlertService:
    """
    Comprehensive weather alert service with:
    - Server-side severity classification
    - Proactive threshold monitoring
    - Multi-channel alert dissemination
    - Subscription management
    """

    def __init__(self):
        self.thresholds = AlertThreshold()
        self.active_alerts: Dict[str, WeatherAlert] = {}
        self.subscriptions: Dict[str, AlertSubscription] = {}
        self.monitoring_task: Optional[asyncio.Task] = None
        self.is_monitoring = False

        # Alert dissemination configuration
        self.dissemination_config = {
            "sms": {"enabled": True, "stub": True},
            "push": {"enabled": True, "stub": True},
            "email": {"enabled": False, "stub": True},
            "whatsapp": {"enabled": False, "stub": True},
            "voice": {"enabled": False, "stub": True}
        }

    def classify_severity(self, weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Classify weather severity based on configurable thresholds.

        Severity levels:
        - normal: No significant weather concerns
        - watch: Conditions favorable for hazardous weather
        - warning: Hazardous weather is occurring or imminent
        - severe: Severe weather is occurring
        - extreme: Extreme, life-threatening weather

        Args:
            weather_data: Weather data from Open-Meteo

        Returns:
            Dict with severity level, alerts list, and metadata
        """
        current = weather_data.get("current", {})
        forecast = weather_data.get("forecast", {}).get("days", [])

        alerts = []
        severity_scores = []  # Track numeric severity for max calculation

        # Severity mapping
        severity_map = {"normal": 0, "watch": 1, "warning": 2, "severe": 3, "extreme": 4}
        reverse_map = {v: k for k, v in severity_map.items()}

        # Current temperature analysis
        temp = current.get("temperature", 0)

        if temp >= self.thresholds.heat_extreme:
            alerts.append({
                "type": "heatwave",
                "severity": "extreme",
                "message": f"EXTREME HEAT WARNING: Temperature {temp}°C exceeds critical threshold"
            })
            severity_scores.append(severity_map["extreme"])

        elif temp >= self.thresholds.heat_warning:
            alerts.append({
                "type": "heatwave",
                "severity": "warning",
                "message": f"High heat warning: Temperature {temp}°C - take precautions"
            })
            severity_scores.append(severity_map["warning"])

        elif temp <= self.thresholds.cold_extreme:
            alerts.append({
                "type": "frost",
                "severity": "severe",
                "message": f"FROST/FREEZE WARNING: Temperature {temp}°C at or below freezing"
            })
            severity_scores.append(severity_map["severe"])

        elif temp <= self.thresholds.cold_warning:
            alerts.append({
                "type": "frost",
                "severity": "watch",
                "message": f"Cold weather watch: Temperature {temp}°C approaching freezing"
            })
            severity_scores.append(severity_map["watch"])

        # Wind analysis
        wind_speed = current.get("wind_speed", 0)

        if wind_speed >= self.thresholds.wind_severe:
            alerts.append({
                "type": "high_wind",
                "severity": "severe",
                "message": f"SEVERE WIND WARNING: {wind_speed} km/h - dangerous conditions"
            })
            severity_scores.append(severity_map["severe"])

        elif wind_speed >= self.thresholds.wind_warning:
            alerts.append({
                "type": "high_wind",
                "severity": "warning",
                "message": f"High wind warning: {wind_speed} km/h - secure loose objects"
            })
            severity_scores.append(severity_map["warning"])

        elif wind_speed >= self.thresholds.wind_watch:
            alerts.append({
                "type": "high_wind",
                "severity": "watch",
                "message": f"Strong winds: {wind_speed} km/h - monitor conditions"
            })
            severity_scores.append(severity_map["watch"])

        # Forecast rainfall analysis (next 3 days)
        for i, day in enumerate(forecast[:3]):
            rain_prob = day.get("precipitation_probability", 0)
            rain_mm = day.get("precipitation_sum", 0)
            date = day.get("date", "unknown")

            if rain_prob >= self.thresholds.rain_probability_severe and rain_mm >= self.thresholds.rain_extreme_mm:
                alerts.append({
                    "type": "heavy_rain",
                    "severity": "extreme",
                    "message": f"EXTREME RAINFALL WARNING: {rain_mm}mm expected on {date} ({rain_prob}% probability)"
                })
                severity_scores.append(severity_map["extreme"])

            elif rain_prob >= self.thresholds.rain_probability_severe and rain_mm >= self.thresholds.rain_heavy_mm:
                alerts.append({
                    "type": "heavy_rain",
                    "severity": "severe",
                    "message": f"Heavy rain warning: {rain_mm}mm expected on {date} ({rain_prob}% probability)"
                })
                severity_scores.append(severity_map["severe"])

            elif rain_prob >= self.thresholds.rain_probability_threshold and rain_mm >= self.thresholds.rain_moderate_mm:
                alerts.append({
                    "type": "heavy_rain",
                    "severity": "watch",
                    "message": f"Moderate rain expected: {rain_mm}mm on {date} ({rain_prob}% probability)"
                })
                severity_scores.append(severity_map["watch"])

        # Humidity analysis
        humidity = current.get("humidity", 50)

        if humidity >= self.thresholds.humidity_high and temp >= 30:
            alerts.append({
                "type": "weather_alert",
                "severity": "watch",
                "message": f"High humidity warning: {humidity}% with {temp}°C - heat index elevated"
            })
            severity_scores.append(severity_map["watch"])

        # Determine overall severity
        overall_severity = reverse_map[max(severity_scores)] if severity_scores else "normal"

        return {
            "severity": overall_severity,
            "alerts": alerts,
            "alert_count": len(alerts),
            "thresholds_used": asdict(self.thresholds),
            "timestamp": datetime.utcnow().isoformat()
        }

    def create_alert_from_classification(
        self,
        alert_data: Dict[str, Any],
        location: Dict[str, Any]
    ) -> WeatherAlert:
        """Create a structured WeatherAlert from classification result."""
        timestamp = datetime.utcnow()
        expires_at = timestamp + timedelta(hours=6)  # Alerts expire after 6 hours

        alert = WeatherAlert(
            id=f"alert_{timestamp.strftime('%Y%m%d%H%M%S')}_{alert_data['type']}",
            alert_type=alert_data["type"],
            severity=alert_data["severity"],
            message=alert_data["message"],
            location=location,
            timestamp=timestamp.isoformat(),
            expires_at=expires_at.isoformat(),
            source="severity_classification"
        )

        # Store in active alerts
        self.active_alerts[alert.id] = alert

        return alert

    def get_active_alerts(
        self,
        location: Optional[Dict[str, Any]] = None,
        alert_type: Optional[str] = None,
        severity: Optional[str] = None
    ) -> List[WeatherAlert]:
        """
        Get active alerts with optional filters.

        Args:
            location: Filter by location (lat/lng proximity)
            alert_type: Filter by alert type
            severity: Filter by severity level

        Returns:
            List of matching active alerts
        """
        alerts = list(self.active_alerts.values())

        # Remove expired alerts
        now = datetime.utcnow()
        alerts = [
            alert for alert in alerts
            if datetime.fromisoformat(alert.expires_at) > now
        ]

        # Apply filters
        if alert_type:
            alerts = [a for a in alerts if a.alert_type == alert_type]

        if severity:
            alerts = [a for a in alerts if a.severity == severity]

        # Location proximity filtering (simplified - 1 degree ~111km)
        if location and "lat" in location and "lng" in location:
            proximity_threshold = 1.0  # degrees
            alerts = [
                a for a in alerts
                if abs(a.location.get("lat", 0) - location["lat"]) < proximity_threshold
                and abs(a.location.get("lng", 0) - location["lng"]) < proximity_threshold
            ]

        return alerts

    async def disseminate_alert(
        self,
        alert: WeatherAlert,
        channels: List[str],
        recipient: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Disseminate alert through specified channels.

        SIMULATION MODE: Actual SMS/IVR/Push require telecom integration.
        This implementation logs to console and returns delivery status.

        For production integration:
        - SMS: Integrate Twilio, AWS SNS, or telecom provider API
        - Push: Integrate FCM (Firebase Cloud Messaging) or OneSignal
        - Voice/IVR: Integrate Twilio Voice or telecom IVR system
        - WhatsApp: Integrate WhatsApp Business API
        - Email: Integrate SendGrid, AWS SES, or SMTP

        Args:
            alert: WeatherAlert to disseminate
            channels: List of delivery channels
            recipient: Recipient contact information

        Returns:
            Delivery status per channel
        """
        delivery_status = {}

        for channel in channels:
            config = self.dissemination_config.get(channel, {})

            if not config.get("enabled", False):
                delivery_status[channel] = {
                    "status": "disabled",
                    "message": f"{channel} channel not enabled"
                }
                continue

            if config.get("stub", True):
                # SIMULATION MODE
                logger.info(
                    f"[ALERT SIMULATION] {channel.upper()} to {recipient.get('user_id', 'unknown')}: "
                    f"{alert.severity.upper()} - {alert.message}"
                )

                delivery_status[channel] = {
                    "status": "simulated",
                    "message": f"Alert would be sent via {channel}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "note": "This is a simulation. Real integration requires telecom provider setup."
                }
            else:
                # REAL INTEGRATION (placeholder for actual implementation)
                delivery_status[channel] = await self._send_real_alert(alert, channel, recipient)

        return delivery_status

    async def _send_real_alert(
        self,
        alert: WeatherAlert,
        channel: str,
        recipient: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Placeholder for real alert delivery integration.

        Production implementation would include:
        - API authentication with provider
        - Message formatting per channel
        - Retry logic with exponential backoff
        - Delivery confirmation tracking
        - Error handling and dead-letter queue
        """
        # TODO: Implement actual provider integrations
        logger.warning(f"Real {channel} integration not yet implemented")

        return {
            "status": "not_implemented",
            "message": f"Real {channel} integration pending"
        }

    async def subscribe_user(
        self,
        user_id: str,
        location: Dict[str, Any],
        alert_types: List[str],
        severity_levels: List[str],
        delivery_channels: List[str],
        notification_frequency: str = "immediate"
    ) -> AlertSubscription:
        """
        Subscribe user to weather alerts.

        Args:
            user_id: User identifier
            location: Location to monitor
            alert_types: Types of alerts to receive
            severity_levels: Minimum severity levels
            delivery_channels: Preferred delivery channels
            notification_frequency: How often to receive alerts

        Returns:
            AlertSubscription object
        """
        subscription_id = f"sub_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{user_id}"

        subscription = AlertSubscription(
            subscription_id=subscription_id,
            user_id=user_id,
            location=location,
            alert_types=alert_types,
            severity_levels=severity_levels,
            delivery_channels=delivery_channels,
            notification_frequency=notification_frequency,
            is_active=True,
            created_at=datetime.utcnow().isoformat()
        )

        self.subscriptions[subscription_id] = subscription

        logger.info(f"User {user_id} subscribed to alerts: {subscription_id}")

        return subscription

    async def unsubscribe_user(self, subscription_id: str) -> bool:
        """Unsubscribe from alerts."""
        if subscription_id in self.subscriptions:
            self.subscriptions[subscription_id].is_active = False
            logger.info(f"Subscription {subscription_id} deactivated")
            return True
        return False

    async def notify_subscribers(self, alert: WeatherAlert):
        """
        Notify all subscribers matching the alert criteria.

        This method would be called by the proactive monitoring task
        when new alerts are generated.
        """
        for subscription in self.subscriptions.values():
            if not subscription.is_active:
                continue

            # Check if alert matches subscription criteria
            if alert.alert_type not in subscription.alert_types:
                continue

            if alert.severity not in subscription.severity_levels:
                continue

            # Check location proximity (simplified)
            if "lat" in subscription.location and "lat" in alert.location:
                distance = abs(subscription.location["lat"] - alert.location["lat"]) + \
                          abs(subscription.location["lng"] - alert.location["lng"])
                if distance > 1.0:  # ~111km threshold
                    continue

            # Check notification frequency (simplified)
            if subscription.notification_frequency != "immediate":
                # TODO: Implement batching for hourly/daily
                continue

            # Disseminate alert
            recipient = {
                "user_id": subscription.user_id,
                "subscription_id": subscription.subscription_id
            }

            delivery_status = await self.disseminate_alert(
                alert,
                subscription.delivery_channels,
                recipient
            )

            logger.info(f"Notified subscriber {subscription.user_id}: {delivery_status}")

            # Update last notified timestamp
            subscription.last_notified = datetime.utcnow().isoformat()


# Global instance
alert_service = AlertService()
