"""
WeatherGPT SMS Alert Service
Send weather alerts and notifications via SMS
Supports multiple providers: Twilio, AWS SNS, custom webhooks
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)


class SMSService:
    """SMS service for sending weather alerts."""

    def __init__(self):
        self.provider = os.getenv("SMS_PROVIDER", "twilio")  # twilio, aws_sns, webhook
        self.enabled = os.getenv("SMS_ENABLED", "false").lower() == "true"

        # Twilio configuration
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")

        # AWS SNS configuration
        self.aws_region = os.getenv("AWS_REGION", "ap-south-1")
        self.aws_access_key = os.getenv("AWS_ACCESS_KEY_ID")
        self.aws_secret_key = os.getenv("AWS_SECRET_ACCESS_KEY")

        logger.info(f"SMS service initialized: provider={self.provider}, enabled={self.enabled}")

    async def send_sms(
        self,
        phone_number: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send SMS to a phone number.

        Args:
            phone_number: Recipient phone number (E.164 format: +91XXXXXXXXXX)
            message: SMS message text (max 160 chars recommended)
            metadata: Additional metadata (location, severity, etc.)

        Returns:
            Result with status and message ID
        """
        if not self.enabled:
            logger.warning("SMS service is disabled. Skipping send.")
            return {
                "status": "disabled",
                "message": "SMS service is not enabled",
                "phone_number": phone_number
            }

        # Validate phone number
        if not self._validate_phone_number(phone_number):
            raise ValueError(f"Invalid phone number format: {phone_number}")

        # Truncate message if too long
        if len(message) > 160:
            message = message[:157] + "..."
            logger.warning(f"Message truncated to 160 characters")

        try:
            if self.provider == "twilio":
                return await self._send_via_twilio(phone_number, message, metadata)
            elif self.provider == "aws_sns":
                return await self._send_via_aws_sns(phone_number, message, metadata)
            elif self.provider == "webhook":
                return await self._send_via_webhook(phone_number, message, metadata)
            else:
                # Mock mode for testing
                return self._send_mock(phone_number, message, metadata)

        except Exception as e:
            logger.error(f"Failed to send SMS: {e}")
            raise

    async def _send_via_twilio(
        self,
        phone_number: str,
        message: str,
        metadata: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Send SMS via Twilio."""
        try:
            from twilio.rest import Client

            if not all([self.twilio_account_sid, self.twilio_auth_token, self.twilio_phone_number]):
                raise ValueError("Twilio credentials not configured")

            client = Client(self.twilio_account_sid, self.twilio_auth_token)

            message_obj = client.messages.create(
                body=message,
                from_=self.twilio_phone_number,
                to=phone_number
            )

            logger.info(f"SMS sent via Twilio: {message_obj.sid}")

            return {
                "status": "sent",
                "provider": "twilio",
                "message_id": message_obj.sid,
                "phone_number": phone_number,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"Twilio SMS error: {e}")
            raise

    async def _send_via_aws_sns(
        self,
        phone_number: str,
        message: str,
        metadata: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Send SMS via AWS SNS."""
        try:
            import boto3

            if not all([self.aws_access_key, self.aws_secret_key]):
                raise ValueError("AWS credentials not configured")

            sns = boto3.client(
                'sns',
                region_name=self.aws_region,
                aws_access_key_id=self.aws_access_key,
                aws_secret_access_key=self.aws_secret_key
            )

            response = sns.publish(
                PhoneNumber=phone_number,
                Message=message,
                MessageAttributes={
                    'AWS.SNS.SMS.SMSType': {
                        'DataType': 'String',
                        'StringValue': 'Transactional'
                    }
                }
            )

            logger.info(f"SMS sent via AWS SNS: {response['MessageId']}")

            return {
                "status": "sent",
                "provider": "aws_sns",
                "message_id": response['MessageId'],
                "phone_number": phone_number,
                "timestamp": datetime.utcnow().isoformat()
            }

        except Exception as e:
            logger.error(f"AWS SNS error: {e}")
            raise

    async def _send_via_webhook(
        self,
        phone_number: str,
        message: str,
        metadata: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Send SMS via custom webhook."""
        try:
            import httpx

            webhook_url = os.getenv("SMS_WEBHOOK_URL")
            if not webhook_url:
                raise ValueError("SMS webhook URL not configured")

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    webhook_url,
                    json={
                        "phone_number": phone_number,
                        "message": message,
                        "metadata": metadata,
                        "timestamp": datetime.utcnow().isoformat()
                    },
                    timeout=10.0
                )

                response.raise_for_status()

                logger.info(f"SMS sent via webhook: {webhook_url}")

                return {
                    "status": "sent",
                    "provider": "webhook",
                    "message_id": response.json().get("message_id", "webhook-sent"),
                    "phone_number": phone_number,
                    "timestamp": datetime.utcnow().isoformat()
                }

        except Exception as e:
            logger.error(f"Webhook SMS error: {e}")
            raise

    def _send_mock(
        self,
        phone_number: str,
        message: str,
        metadata: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Mock SMS sending for testing."""
        logger.info(f"[MOCK SMS] To: {phone_number}, Message: {message[:50]}...")

        return {
            "status": "mock_sent",
            "provider": "mock",
            "message_id": f"mock-{datetime.utcnow().timestamp()}",
            "phone_number": phone_number,
            "message": message,
            "timestamp": datetime.utcnow().isoformat()
        }

    def _validate_phone_number(self, phone_number: str) -> bool:
        """
        Validate phone number format (E.164).

        Examples:
            +919876543210 (India)
            +14155552671 (US)
        """
        if not phone_number:
            return False

        # Basic validation: starts with +, followed by 10-15 digits
        if not phone_number.startswith("+"):
            return False

        digits_only = phone_number[1:]
        if not digits_only.isdigit():
            return False

        if len(digits_only) < 10 or len(digits_only) > 15:
            return False

        return True

    async def send_weather_alert(
        self,
        phone_number: str,
        location: str,
        severity: str,
        alert_type: str,
        summary: str
    ) -> Dict[str, Any]:
        """
        Send weather alert SMS with formatted message.

        Args:
            phone_number: Recipient phone number
            location: Location name
            severity: normal/caution/warning/severe
            alert_type: rain/temperature/wind/storm
            summary: Brief alert summary

        Returns:
            SMS send result
        """
        # Format alert message based on severity
        severity_emoji = {
            "normal": "ℹ️",
            "caution": "⚠️",
            "warning": "🚨",
            "severe": "🔴"
        }

        emoji = severity_emoji.get(severity, "ℹ️")

        message = f"{emoji} WeatherGPT Alert\n{location}: {summary[:120]}"

        metadata = {
            "location": location,
            "severity": severity,
            "alert_type": alert_type,
            "timestamp": datetime.utcnow().isoformat()
        }

        return await self.send_sms(phone_number, message, metadata)

    async def send_bulk_alerts(
        self,
        phone_numbers: List[str],
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send SMS alerts to multiple recipients.

        Args:
            phone_numbers: List of recipient phone numbers
            message: SMS message text
            metadata: Additional metadata

        Returns:
            Bulk send results with success/failure counts
        """
        results = {
            "total": len(phone_numbers),
            "sent": 0,
            "failed": 0,
            "results": []
        }

        for phone_number in phone_numbers:
            try:
                result = await self.send_sms(phone_number, message, metadata)
                results["sent"] += 1
                results["results"].append({
                    "phone_number": phone_number,
                    "status": "success",
                    "message_id": result.get("message_id")
                })
            except Exception as e:
                results["failed"] += 1
                results["results"].append({
                    "phone_number": phone_number,
                    "status": "failed",
                    "error": str(e)
                })
                logger.error(f"Failed to send SMS to {phone_number}: {e}")

        return results


# Global instance
sms_service = SMSService()
