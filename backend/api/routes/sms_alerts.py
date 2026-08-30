"""
WeatherGPT SMS Alert Routes
API endpoints for SMS notifications and alert subscriptions
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from backend.services.sms_service import sms_service
from backend.services.conversation_service import conversation_service
from backend.models.db_config import get_db_dependency

import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sms", tags=["SMS Alerts"])


class SMSTestRequest(BaseModel):
    """Request model for testing SMS."""
    phone_number: str
    message: Optional[str] = "Test message from WeatherGPT"


class AlertSubscription(BaseModel):
    """Request model for alert subscription."""
    phone_number: str
    location: str
    severity_levels: List[str] = ["warning", "severe"]  # Only send for these severities
    alert_types: List[str] = ["rain", "storm", "temperature", "wind"]


class WeatherAlertRequest(BaseModel):
    """Request model for sending weather alert."""
    phone_number: str
    location: str
    severity: str  # normal/caution/warning/severe
    alert_type: str  # rain/temperature/wind/storm
    summary: str


class BulkAlertRequest(BaseModel):
    """Request model for bulk alerts."""
    phone_numbers: List[str]
    message: str
    location: Optional[str] = None


@router.get("/")
async def get_sms_info():
    """
    Get SMS service information.

    Returns:
        SMS service capabilities and configuration
    """
    return {
        "service": "WeatherGPT SMS Alert Service",
        "description": "Send weather alerts and notifications via SMS",
        "provider": sms_service.provider,
        "enabled": sms_service.enabled,
        "features": [
            "Real-time weather alerts",
            "Severity-based filtering",
            "Bulk notifications",
            "Subscription management",
            "Multi-provider support (Twilio, AWS SNS, Webhook)"
        ],
        "severity_levels": ["normal", "caution", "warning", "severe"],
        "alert_types": ["rain", "temperature", "wind", "storm"],
        "phone_format": "E.164 format (+91XXXXXXXXXX for India)",
        "max_message_length": 160
    }


@router.post("/test")
async def test_sms(request: SMSTestRequest):
    """
    Test SMS service by sending a test message.

    Args:
        request: Phone number and optional test message

    Returns:
        Send result with status and message ID

    Example:
        {
            "phone_number": "+919876543210",
            "message": "Test message from WeatherGPT"
        }
    """
    try:
        result = await sms_service.send_sms(
            phone_number=request.phone_number,
            message=request.message,
            metadata={"type": "test", "timestamp": datetime.utcnow().isoformat()}
        )

        return {
            "status": "success",
            "result": result,
            "message": "Test SMS sent successfully" if result["status"] in ["sent", "mock_sent"] else "SMS service disabled"
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Test SMS error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send test SMS: {str(e)}")


@router.post("/alert")
async def send_weather_alert(
    request: WeatherAlertRequest,
    session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    db: Session = Depends(get_db_dependency)
):
    """
    Send weather alert via SMS.

    Args:
        request: Alert details (phone number, location, severity, type, summary)
        session_id: User session ID (optional)
        db: Database session

    Returns:
        Send result with status

    Example:
        {
            "phone_number": "+919876543210",
            "location": "Mumbai",
            "severity": "warning",
            "alert_type": "rain",
            "summary": "Heavy rainfall expected in the next 6 hours"
        }
    """
    try:
        # Validate severity
        if request.severity not in ["normal", "caution", "warning", "severe"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid severity. Must be: normal, caution, warning, or severe"
            )

        # Validate alert type
        if request.alert_type not in ["rain", "temperature", "wind", "storm"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid alert type. Must be: rain, temperature, wind, or storm"
            )

        # Send alert
        result = await sms_service.send_weather_alert(
            phone_number=request.phone_number,
            location=request.location,
            severity=request.severity,
            alert_type=request.alert_type,
            summary=request.summary
        )

        # Save to database
        if session_id and result.get("status") in ["sent", "mock_sent"]:
            try:
                conversation_service.save_weather_alert(
                    session_id=session_id,
                    location=request.location,
                    lat=0.0,  # Would be filled from geocoding
                    lng=0.0,
                    severity=request.severity,
                    alert_type=request.alert_type,
                    message=request.summary,
                    db=db,
                    phone_number=request.phone_number
                )
                logger.info(f"Weather alert saved to database for session: {session_id}")
            except Exception as e:
                logger.warning(f"Failed to save alert to database: {e}")

        return {
            "status": "success",
            "alert": result,
            "message": f"Weather alert sent to {request.phone_number}"
        }

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Weather alert error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send weather alert: {str(e)}")


@router.post("/bulk")
async def send_bulk_alerts(request: BulkAlertRequest):
    """
    Send SMS alerts to multiple recipients.

    Args:
        request: List of phone numbers and message

    Returns:
        Bulk send results with success/failure counts

    Example:
        {
            "phone_numbers": ["+919876543210", "+919876543211"],
            "message": "Weather alert: Heavy rain expected",
            "location": "Mumbai"
        }
    """
    try:
        if not request.phone_numbers:
            raise HTTPException(status_code=400, detail="Phone numbers list cannot be empty")

        if len(request.phone_numbers) > 100:
            raise HTTPException(
                status_code=400,
                detail="Maximum 100 recipients per bulk send"
            )

        metadata = {
            "location": request.location,
            "timestamp": datetime.utcnow().isoformat()
        }

        result = await sms_service.send_bulk_alerts(
            phone_numbers=request.phone_numbers,
            message=request.message,
            metadata=metadata
        )

        return {
            "status": "completed",
            "summary": {
                "total": result["total"],
                "sent": result["sent"],
                "failed": result["failed"]
            },
            "details": result["results"]
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Bulk SMS error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to send bulk alerts: {str(e)}")


@router.get("/config")
async def get_sms_config():
    """
    Get SMS service configuration and status.

    Returns:
        Configuration details and provider status
    """
    import os

    config = {
        "enabled": sms_service.enabled,
        "provider": sms_service.provider,
        "status": "ready" if sms_service.enabled else "disabled"
    }

    # Provider-specific configuration status
    if sms_service.provider == "twilio":
        config["twilio"] = {
            "configured": bool(sms_service.twilio_account_sid and sms_service.twilio_auth_token),
            "phone_number": sms_service.twilio_phone_number if sms_service.twilio_phone_number else "not_set"
        }
    elif sms_service.provider == "aws_sns":
        config["aws_sns"] = {
            "configured": bool(sms_service.aws_access_key and sms_service.aws_secret_key),
            "region": sms_service.aws_region
        }
    elif sms_service.provider == "webhook":
        config["webhook"] = {
            "configured": bool(os.getenv("SMS_WEBHOOK_URL")),
            "url": os.getenv("SMS_WEBHOOK_URL") if os.getenv("SMS_WEBHOOK_URL") else "not_set"
        }

    return config


@router.get("/history")
async def get_alert_history(
    session_id: str = Header(..., alias="X-Session-ID"),
    limit: int = 50,
    db: Session = Depends(get_db_dependency)
):
    """
    Get SMS alert history for a user session.

    Args:
        session_id: User session ID (from X-Session-ID header)
        limit: Maximum number of alerts to return
        db: Database session

    Returns:
        List of past alerts sent
    """
    try:
        from backend.models.database import WeatherAlert

        alerts = (
            db.query(WeatherAlert)
            .filter_by(user_session_id=session_id)
            .order_by(WeatherAlert.created_at.desc())
            .limit(limit)
            .all()
        )

        return {
            "session_id": session_id,
            "total_alerts": len(alerts),
            "alerts": [
                {
                    "id": alert.id,
                    "location": alert.location,
                    "severity": alert.severity,
                    "alert_type": alert.alert_type,
                    "message": alert.message,
                    "phone_number": alert.phone_number,
                    "sent_via_sms": alert.sent_via_sms,
                    "created_at": alert.created_at.isoformat()
                }
                for alert in alerts
            ]
        }

    except Exception as e:
        logger.error(f"Failed to fetch alert history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch alert history: {str(e)}")
