"""
WeatherGPT Alert Routes
Real-time weather alert and warning management with severity classification,
proactive monitoring, and multi-channel dissemination
"""

from fastapi import APIRouter, HTTPException, Query, Body
from typing import Optional, List
from datetime import datetime
import logging

from backend.services import weather_service, geocoding_service, GeocodingError
from backend.services.alert_service import alert_service
from backend.services.alert_watcher import alert_watcher

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/active")
async def get_active_alerts(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    alert_type: Optional[str] = None,
    severity: Optional[str] = None,
    state: Optional[str] = None
):
    """
    Get active weather alerts with server-side severity classification.

    **NEW**: This endpoint now uses server-side severity classification
    and integrates with the proactive alert monitoring system.

    Args:
        lat: Latitude coordinate
        lng: Longitude coordinate
        city: City name
        alert_type: Filter by type (heatwave, heavy_rain, high_wind, frost, storm)
        severity: Filter by severity (normal, watch, warning, severe, extreme)
        state: Filter by state (for regional queries)

    Returns:
        Active alerts from severity classification and monitoring system
    """
    try:
        # For state-level query, use state center
        if state and not city and lat is None:
            state_centers = {
                "maharashtra": (19.7515, 75.7139),
                "delhi": (28.7041, 77.1025),
                "karnataka": (15.3173, 75.7139),
                "tamil nadu": (11.1271, 78.6569),
                "west bengal": (22.9868, 87.8550),
                "telangana": (18.1124, 79.0193),
                "gujarat": (22.2587, 71.1924),
                "rajasthan": (27.0238, 74.2179),
            }
            if state.lower() in state_centers:
                lat, lng = state_centers[state.lower()]

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
                detail="Either provide coordinates (lat, lng) or city/state"
            )

        # Fetch weather data and classify severity (SERVER-SIDE)
        weather_data = await weather_service.fetch_weather(lat, lng)
        severity_info = alert_service.classify_severity(weather_data)

        # Create structured alerts
        alerts = []
        for alert_data in severity_info["alerts"]:
            alert = alert_service.create_alert_from_classification(
                alert_data,
                location={"lat": lat, "lng": lng, "city": city}
            )
            alerts.append(alert.to_dict())

        # Apply filters
        if alert_type:
            alerts = [a for a in alerts if a["alert_type"] == alert_type]
        if severity:
            alerts = [a for a in alerts if a["severity"] == severity]

        return {
            "alerts": alerts,
            "count": len(alerts),
            "overall_severity": severity_info["severity"],
            "location": {"lat": lat, "lng": lng, "city": city},
            "thresholds": severity_info.get("thresholds_used"),
            "timestamp": datetime.utcnow().isoformat(),
            "source": "server_side_classification"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching alerts: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch alerts")


@router.post("/subscribe")
async def create_alert_subscription(
    user_id: str = Body(...),
    lat: Optional[float] = Body(None),
    lng: Optional[float] = Body(None),
    city: Optional[str] = Body(None),
    alert_types: List[str] = Body(["heatwave", "heavy_rain", "high_wind", "frost", "storm"]),
    severity_levels: List[str] = Body(["watch", "warning", "severe", "extreme"]),
    delivery_channels: List[str] = Body(["push"]),
    notification_frequency: str = Body("immediate")
):
    """
    Create a new alert subscription.

    **Multi-Channel Dissemination Architecture**:
    This endpoint configures alert delivery through multiple channels:
    - `push`: Push notifications (simulated - requires FCM/OneSignal integration)
    - `sms`: SMS alerts (simulated - requires Twilio/AWS SNS integration)
    - `email`: Email alerts (simulated - requires SendGrid/AWS SES integration)
    - `whatsapp`: WhatsApp messages (simulated - requires WhatsApp Business API)
    - `voice`: Voice/IVR calls (simulated - requires Twilio Voice integration)

    **CURRENT STATUS**: All channels are SIMULATED (stub mode).
    Real integration requires:
    1. Provider API credentials (Twilio, FCM, etc.)
    2. User contact information (phone, email, device token)
    3. Update `alert_service.dissemination_config` with real=True
    4. Implement `_send_real_alert()` in alert_service.py

    Args:
        user_id: User identifier
        lat: Latitude (optional if city provided)
        lng: Longitude (optional if city provided)
        city: City name
        alert_types: Types of alerts to receive
        severity_levels: Minimum severity levels
        delivery_channels: Preferred delivery channels
        notification_frequency: How often to receive alerts

    Returns:
        Subscription details
    """
    try:
        # Geocode city if provided
        if city and (lat is None or lng is None):
            try:
                location = await geocoding_service.geocode(city)
                lat, lng = location["lat"], location["lng"]
            except GeocodingError:
                raise HTTPException(status_code=404, detail=f"City '{city}' not found")

        if lat is None or lng is None:
            raise HTTPException(
                status_code=400,
                detail="Either provide coordinates (lat, lng) or city"
            )

        # Create subscription
        subscription = await alert_service.subscribe_user(
            user_id=user_id,
            location={"lat": lat, "lng": lng, "city": city},
            alert_types=alert_types,
            severity_levels=severity_levels,
            delivery_channels=delivery_channels,
            notification_frequency=notification_frequency
        )

        # Add location to monitoring if not already monitored
        location_key = f"user_{user_id}_{city or f'{lat}_{lng}'}"
        if location_key not in alert_watcher.monitored_locations:
            alert_watcher.add_location(
                location_key=location_key,
                lat=lat,
                lng=lng,
                name=city or f"Location ({lat}, {lng})"
            )

        return {
            "subscription_id": subscription.subscription_id,
            "user_id": subscription.user_id,
            "status": "active",
            "location": subscription.location,
            "alert_types": subscription.alert_types,
            "severity_levels": subscription.severity_levels,
            "delivery_channels": subscription.delivery_channels,
            "notification_frequency": subscription.notification_frequency,
            "created_at": subscription.created_at,
            "monitoring_enabled": True,
            "dissemination_note": "Channels are in SIMULATION mode. See API docs for production integration."
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating subscription: {e}")
        raise HTTPException(status_code=500, detail="Failed to create subscription")


@router.delete("/subscribe/{subscription_id}")
async def unsubscribe_from_alerts(
    subscription_id: str,
    user_id: str = Query(...)
):
    """
    Unsubscribe from alert notifications.

    Args:
        subscription_id: Subscription identifier
        user_id: User identifier for verification

    Returns:
        Unsubscription confirmation
    """
    try:
        success = await alert_service.unsubscribe_user(subscription_id)

        if not success:
            raise HTTPException(
                status_code=404,
                detail=f"Subscription {subscription_id} not found"
            )

        return {
            "subscription_id": subscription_id,
            "status": "cancelled",
            "message": "Successfully unsubscribed from alerts",
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unsubscribing: {e}")
        raise HTTPException(status_code=500, detail="Failed to unsubscribe")


@router.get("/subscriptions/{user_id}")
async def get_user_subscriptions(user_id: str):
    """
    Get all subscriptions for a user.

    Args:
        user_id: User identifier

    Returns:
        List of active subscriptions
    """
    try:
        user_subscriptions = [
            {
                "subscription_id": sub.subscription_id,
                "location": sub.location,
                "alert_types": sub.alert_types,
                "severity_levels": sub.severity_levels,
                "delivery_channels": sub.delivery_channels,
                "notification_frequency": sub.notification_frequency,
                "is_active": sub.is_active,
                "created_at": sub.created_at,
                "last_notified": sub.last_notified
            }
            for sub in alert_service.subscriptions.values()
            if sub.user_id == user_id and sub.is_active
        ]

        return {
            "user_id": user_id,
            "subscriptions": user_subscriptions,
            "count": len(user_subscriptions),
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error fetching subscriptions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch subscriptions")


@router.post("/webhook/delivery")
async def webhook_alert_delivery(
    alert_id: str = Body(...),
    channel: str = Body(...),
    recipient: dict = Body(...)
):
    """
    Webhook endpoint for alert delivery simulation.

    This endpoint simulates the webhook callback from a real alert
    delivery service (SMS gateway, push notification service, etc.).

    **Integration Architecture**:
    In production, this would be called by:
    - Twilio (SMS delivery status)
    - FCM (push notification delivery)
    - SendGrid (email delivery events)
    - WhatsApp Business API (message status)

    Args:
        alert_id: Alert identifier
        channel: Delivery channel
        recipient: Recipient information

    Returns:
        Delivery acknowledgment
    """
    try:
        logger.info(
            f"[WEBHOOK] Alert delivery callback: {alert_id} via {channel} "
            f"to {recipient.get('user_id', 'unknown')}"
        )

        return {
            "webhook": "alert_delivery",
            "alert_id": alert_id,
            "channel": channel,
            "status": "acknowledged",
            "timestamp": datetime.utcnow().isoformat(),
            "note": "This is a simulation endpoint. Configure real webhooks with your provider."
        }

    except Exception as e:
        logger.error(f"Error processing webhook: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@router.get("/monitoring/status")
async def get_monitoring_status():
    """
    Get status of the proactive alert monitoring system.

    **Proactive Monitoring Architecture**:
    The alert watcher continuously monitors configured locations
    and automatically generates alerts when thresholds are breached.

    Features:
    - Configurable polling interval (default: 5 minutes)
    - Location-based monitoring
    - Automatic alert generation
    - Subscriber notification
    - Breach detection and tracking

    Returns:
        Current monitoring status
    """
    try:
        status = alert_watcher.get_status()

        return {
            "monitoring": status,
            "alert_service": {
                "active_alerts": len(alert_service.active_alerts),
                "active_subscriptions": len([
                    s for s in alert_service.subscriptions.values()
                    if s.is_active
                ]),
                "dissemination_channels": alert_service.dissemination_config
            },
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error fetching monitoring status: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch status")


@router.post("/monitoring/locations")
async def add_monitoring_location(
    location_key: str = Body(...),
    lat: float = Body(...),
    lng: float = Body(...),
    name: Optional[str] = Body(None)
):
    """
    Add a location to proactive monitoring.

    Args:
        location_key: Unique identifier for this location
        lat: Latitude
        lng: Longitude
        name: Human-readable location name

    Returns:
        Confirmation
    """
    try:
        alert_watcher.add_location(
            location_key=location_key,
            lat=lat,
            lng=lng,
            name=name
        )

        return {
            "location_key": location_key,
            "status": "monitoring_enabled",
            "location": {"lat": lat, "lng": lng, "name": name},
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error adding monitoring location: {e}")
        raise HTTPException(status_code=500, detail="Failed to add location")


@router.delete("/monitoring/locations/{location_key}")
async def remove_monitoring_location(location_key: str):
    """
    Remove a location from proactive monitoring.

    Args:
        location_key: Location identifier

    Returns:
        Confirmation
    """
    try:
        alert_watcher.remove_location(location_key)

        return {
            "location_key": location_key,
            "status": "monitoring_disabled",
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error removing monitoring location: {e}")
        raise HTTPException(status_code=500, detail="Failed to remove location")


@router.post("/test-delivery")
async def test_alert_delivery(
    user_id: str = Body(...),
    channel: str = Body(..., description="Channel to test: push, sms, email, whatsapp, voice")
):
    """
    Test alert delivery for a specific channel.

    Sends a test alert through the specified channel to verify
    integration and delivery configuration.

    Args:
        user_id: User identifier
        channel: Channel to test

    Returns:
        Test delivery result
    """
    try:
        from backend.services.alert_service import WeatherAlert

        # Create a test alert
        test_alert = WeatherAlert(
            id=f"test_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            alert_type="weather_alert",
            severity="watch",
            message="This is a test alert to verify delivery configuration",
            location={"lat": 0, "lng": 0, "name": "Test Location"},
            timestamp=datetime.utcnow().isoformat(),
            expires_at=(datetime.utcnow()).isoformat(),
            source="test_delivery"
        )

        # Attempt delivery
        recipient = {"user_id": user_id}
        delivery_status = await alert_service.disseminate_alert(
            test_alert,
            [channel],
            recipient
        )

        return {
            "user_id": user_id,
            "channel": channel,
            "test_alert": test_alert.to_dict(),
            "delivery_status": delivery_status,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error testing alert delivery: {e}")
        raise HTTPException(status_code=500, detail="Failed to test delivery")


@router.get("/thresholds")
async def get_alert_thresholds():
    """
    Get current alert thresholds.

    Returns the configurable thresholds used for severity classification.

    Returns:
        Current threshold configuration
    """
    try:
        from dataclasses import asdict

        return {
            "thresholds": asdict(alert_service.thresholds),
            "severity_levels": {
                "normal": "No significant weather concerns",
                "watch": "Conditions favorable for hazardous weather",
                "warning": "Hazardous weather is occurring or imminent",
                "severe": "Severe weather is occurring",
                "extreme": "Extreme, life-threatening weather"
            },
            "alert_types": {
                "heatwave": "High temperature alerts",
                "heavy_rain": "Precipitation alerts",
                "high_wind": "Wind speed alerts",
                "frost": "Low temperature and freezing alerts",
                "storm": "Severe weather events"
            },
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"Error fetching thresholds: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch thresholds")


# Legacy compatibility endpoints

@router.get("/")
async def get_active_alerts_legacy(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    alert_type: Optional[str] = None,
    severity: Optional[str] = None,
    state: Optional[str] = None
):
    """
    Legacy endpoint - redirects to /alerts/active.
    Maintained for backward compatibility.
    """
    return await get_active_alerts(lat, lng, city, alert_type, severity, state)


@router.get("/by-location")
async def get_alerts_by_location(
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    city: Optional[str] = None,
    state: Optional[str] = None
):
    """
    Legacy endpoint - redirects to /alerts/active.
    Maintained for backward compatibility.
    """
    return await get_active_alerts(lat, lng, city, None, None, state)
