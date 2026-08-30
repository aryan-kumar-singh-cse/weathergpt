# Alert Dissemination Architecture

## Overview

WeatherGPT's extreme weather alert system provides comprehensive alert management with:

1. **Server-Side Severity Classification**: All severity logic moved from frontend to backend
2. **Proactive Monitoring**: Continuous threshold monitoring with automatic alert generation
3. **Multi-Channel Dissemination**: SMS, Push, Email, WhatsApp, Voice/IVR delivery
4. **Subscription Management**: User-configurable alert preferences and delivery channels

---

## Architecture Components

### 1. Alert Service (`backend/services/alert_service.py`)

**Core Responsibilities**:
- Server-side severity classification based on configurable thresholds
- Structured alert creation and lifecycle management
- Multi-channel alert dissemination (simulated and real)
- Subscription management

**Severity Levels**:
- `normal`: No significant weather concerns
- `watch`: Conditions favorable for hazardous weather
- `warning`: Hazardous weather is occurring or imminent
- `severe`: Severe weather is occurring
- `extreme`: Extreme, life-threatening weather

**Alert Types**:
- `heatwave`: High temperature alerts
- `heavy_rain`: Precipitation alerts
- `high_wind`: Wind speed alerts
- `frost`: Low temperature and freezing alerts
- `storm`: Severe weather events

**Configurable Thresholds**:
```python
# Wind speed (km/h)
wind_watch: 40.0
wind_warning: 62.0
wind_severe: 90.0

# Temperature (°C)
heat_warning: 40.0
heat_extreme: 45.0
cold_warning: 5.0
cold_extreme: 0.0

# Rainfall (mm)
rain_moderate_mm: 50.0
rain_heavy_mm: 100.0
rain_extreme_mm: 200.0

# Rainfall probability (%)
rain_probability_threshold: 70.0
rain_probability_severe: 80.0
```

### 2. Alert Watcher (`backend/services/alert_watcher.py`)

**Proactive Monitoring System**:
- Continuously polls monitored locations (default: every 5 minutes)
- Automatically generates alerts when thresholds are breached
- Tracks active breaches and detects when conditions clear
- Notifies all matching subscribers

**Default Monitored Cities**:
- Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata, Pune, Ahmedabad

**Features**:
- Location-based monitoring with proximity filtering
- Breach detection and tracking
- Automatic subscriber notification
- Configurable polling intervals

### 3. Alert API Endpoints (`backend/api/routes/alerts.py`)

#### Core Endpoints

##### `GET /api/v1/alerts/active`
Get active weather alerts with server-side severity classification.

**Parameters**:
- `lat`, `lng`: Coordinates
- `city`: City name (auto-geocoded)
- `state`: State name
- `alert_type`: Filter by type
- `severity`: Filter by severity

**Response**:
```json
{
  "alerts": [
    {
      "id": "alert_20260829112000_heatwave",
      "alert_type": "heatwave",
      "severity": "extreme",
      "message": "EXTREME HEAT WARNING: Temperature 46°C exceeds critical threshold",
      "location": {"lat": 19.076, "lng": 72.8777, "city": "Mumbai"},
      "timestamp": "2026-08-29T11:20:00Z",
      "expires_at": "2026-08-29T17:20:00Z",
      "source": "severity_classification"
    }
  ],
  "count": 1,
  "overall_severity": "extreme",
  "thresholds_used": { /* threshold config */ },
  "timestamp": "2026-08-29T11:20:00Z"
}
```

##### `POST /api/v1/alerts/subscribe`
Create alert subscription with multi-channel delivery.

**Request Body**:
```json
{
  "user_id": "user_123",
  "lat": 19.076,
  "lng": 72.8777,
  "city": "Mumbai",
  "alert_types": ["heatwave", "heavy_rain", "high_wind"],
  "severity_levels": ["warning", "severe", "extreme"],
  "delivery_channels": ["push", "sms"],
  "notification_frequency": "immediate"
}
```

**Response**:
```json
{
  "subscription_id": "sub_20260829112000_user_123",
  "status": "active",
  "monitoring_enabled": true,
  "dissemination_note": "Channels are in SIMULATION mode"
}
```

##### `DELETE /api/v1/alerts/subscribe/{subscription_id}`
Unsubscribe from alerts.

##### `GET /api/v1/alerts/subscriptions/{user_id}`
Get all user subscriptions.

##### `POST /api/v1/alerts/webhook/delivery`
Webhook endpoint for delivery status callbacks (production integration point).

##### `GET /api/v1/alerts/monitoring/status`
Get proactive monitoring system status.

##### `POST /api/v1/alerts/monitoring/locations`
Add location to proactive monitoring.

##### `POST /api/v1/alerts/test-delivery`
Test alert delivery for a specific channel.

##### `GET /api/v1/alerts/thresholds`
Get current alert thresholds configuration.

---

## Multi-Channel Dissemination

### Current Status: SIMULATION MODE

All dissemination channels are currently **SIMULATED** (stub mode). Alerts are logged to console with delivery status marked as `"simulated"`.

**Simulated Channels**:
- ✅ Push notifications (requires FCM/OneSignal)
- ✅ SMS (requires Twilio/AWS SNS)
- ✅ Email (requires SendGrid/AWS SES)
- ✅ WhatsApp (requires WhatsApp Business API)
- ✅ Voice/IVR (requires Twilio Voice)

**Log Output Example**:
```
[ALERT SIMULATION] SMS to user_123: EXTREME - EXTREME HEAT WARNING: Temperature 46°C exceeds critical threshold
[ALERT SIMULATION] PUSH to user_123: EXTREME - EXTREME HEAT WARNING: Temperature 46°C exceeds critical threshold
```

### Production Integration Guide

#### 1. SMS Integration (Twilio)

**Setup**:
```python
# In alert_service.py
from twilio.rest import Client

async def _send_real_sms(alert, recipient):
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    message = client.messages.create(
        body=f"{alert.severity.upper()}: {alert.message}",
        from_=TWILIO_PHONE_NUMBER,
        to=recipient['phone_number']
    )
    
    return {
        "status": "sent",
        "message_sid": message.sid,
        "timestamp": datetime.utcnow().isoformat()
    }
```

**Configuration**:
```python
self.dissemination_config["sms"] = {
    "enabled": True,
    "stub": False,  # Enable real integration
    "provider": "twilio",
    "retry_attempts": 3,
    "timeout": 10.0
}
```

**Environment Variables**:
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Webhook Configuration**:
Configure Twilio to call `/api/v1/alerts/webhook/delivery` for delivery status updates.

#### 2. Push Notifications (Firebase Cloud Messaging)

**Setup**:
```python
from firebase_admin import messaging, initialize_app

# Initialize Firebase
initialize_app()

async def _send_real_push(alert, recipient):
    message = messaging.Message(
        notification=messaging.Notification(
            title=f"{alert.severity.upper()} Alert",
            body=alert.message
        ),
        token=recipient['device_token'],
        data={
            "alert_id": alert.id,
            "alert_type": alert.alert_type,
            "severity": alert.severity,
            "location": json.dumps(alert.location)
        }
    )
    
    response = messaging.send(message)
    
    return {
        "status": "sent",
        "message_id": response,
        "timestamp": datetime.utcnow().isoformat()
    }
```

**Required User Data**:
- Device FCM token (stored in `AlertSubscription.device_token`)

#### 3. Email Alerts (SendGrid)

**Setup**:
```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

async def _send_real_email(alert, recipient):
    message = Mail(
        from_email='alerts@weathergpt.com',
        to_emails=recipient['email'],
        subject=f"{alert.severity.upper()} Weather Alert: {alert.alert_type}",
        html_content=f"""
        <h2>{alert.severity.upper()} Weather Alert</h2>
        <p><strong>{alert.message}</strong></p>
        <p>Location: {alert.location.get('name', 'Unknown')}</p>
        <p>Time: {alert.timestamp}</p>
        <p>Valid until: {alert.expires_at}</p>
        """
    )
    
    sg = SendGridAPIClient(SENDGRID_API_KEY)
    response = sg.send(message)
    
    return {
        "status": "sent",
        "status_code": response.status_code,
        "timestamp": datetime.utcnow().isoformat()
    }
```

#### 4. WhatsApp Business API

**Setup**:
```python
async def _send_real_whatsapp(alert, recipient):
    # WhatsApp Business API integration
    headers = {
        "Authorization": f"Bearer {WHATSAPP_API_TOKEN}",
        "Content-Type": "application/json"
    }
    
    data = {
        "messaging_product": "whatsapp",
        "to": recipient['phone_number'],
        "type": "template",
        "template": {
            "name": "weather_alert",
            "language": {"code": "en"},
            "components": [
                {
                    "type": "body",
                    "parameters": [
                        {"type": "text", "text": alert.severity.upper()},
                        {"type": "text", "text": alert.message}
                    ]
                }
            ]
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://graph.facebook.com/v17.0/{WHATSAPP_PHONE_ID}/messages",
            headers=headers,
            json=data
        )
    
    return {
        "status": "sent",
        "message_id": response.json().get("messages", [{}])[0].get("id"),
        "timestamp": datetime.utcnow().isoformat()
    }
```

#### 5. Voice/IVR Alerts (Twilio Voice)

**Setup**:
```python
async def _send_real_voice(alert, recipient):
    client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    
    # Text-to-speech message
    twiml = f"""
    <Response>
        <Say voice="alice">
            This is an urgent weather alert from WeatherGPT.
            {alert.severity.upper()} {alert.alert_type} alert.
            {alert.message}
            This alert is valid until {alert.expires_at}.
        </Say>
    </Response>
    """
    
    call = client.calls.create(
        twiml=twiml,
        to=recipient['phone_number'],
        from_=TWILIO_VOICE_NUMBER
    )
    
    return {
        "status": "initiated",
        "call_sid": call.sid,
        "timestamp": datetime.utcnow().isoformat()
    }
```

---

## Database Schema

### WeatherAlert Table
```sql
CREATE TABLE weather_alerts (
    id INTEGER PRIMARY KEY,
    alert_id VARCHAR(255) UNIQUE NOT NULL,
    user_session_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    location VARCHAR(255) NOT NULL,
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    
    severity VARCHAR(20) NOT NULL,  -- normal/watch/warning/severe/extreme
    alert_type VARCHAR(50) NOT NULL,  -- heatwave/heavy_rain/high_wind/frost/storm
    message TEXT NOT NULL,
    source VARCHAR(50) DEFAULT 'severity_classification',
    
    -- Multi-channel delivery status
    sent_via_sms INTEGER DEFAULT 0,
    sent_via_push INTEGER DEFAULT 0,
    sent_via_email INTEGER DEFAULT 0,
    sent_via_whatsapp INTEGER DEFAULT 0,
    sent_via_voice INTEGER DEFAULT 0,
    
    phone_number VARCHAR(20),
    weather_data JSON,
    affected_areas JSON
);
```

### AlertSubscription Table
```sql
CREATE TABLE alert_subscriptions (
    id INTEGER PRIMARY KEY,
    subscription_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    location_name VARCHAR(255),
    lat FLOAT NOT NULL,
    lng FLOAT NOT NULL,
    
    alert_types JSON NOT NULL,
    severity_levels JSON NOT NULL,
    delivery_channels JSON NOT NULL,
    notification_frequency VARCHAR(20) DEFAULT 'immediate',
    
    is_active INTEGER DEFAULT 1,
    last_notified TIMESTAMP,
    
    -- Contact information for delivery
    phone_number VARCHAR(20),
    email VARCHAR(255),
    device_token VARCHAR(255)
);
```

---

## Reliability & Error Handling

### Retry Strategy
```python
# Exponential backoff with jitter
retry_delays = [1, 2, 4, 8, 16]  # seconds
max_retries = 3

for attempt in range(max_retries):
    try:
        result = await send_alert(alert, channel, recipient)
        return result
    except Exception as e:
        if attempt < max_retries - 1:
            delay = retry_delays[attempt] + random.uniform(0, 1)
            await asyncio.sleep(delay)
        else:
            # Move to dead-letter queue
            await dead_letter_queue.add(alert, channel, recipient, error=str(e))
```

### Circuit Breaker Pattern
```python
# Prevent cascade failures
if channel_failure_rate[channel] > 0.5:
    # Open circuit - fail fast
    return {"status": "circuit_open", "channel": channel}
```

### Timeout Budgets
```python
# Per-channel timeout configuration
timeout_config = {
    "sms": 10.0,      # seconds
    "push": 5.0,
    "email": 15.0,
    "whatsapp": 10.0,
    "voice": 30.0
}
```

### Idempotency
All alert deliveries are idempotent - duplicate sends to the same recipient within a time window are deduplicated:

```python
# Deduplication window: 5 minutes
if alert_id in recent_sends.get(recipient_id, set()):
    return {"status": "duplicate", "message": "Alert already sent"}
```

---

## Testing

### Unit Tests
```bash
pytest backend/tests/test_alert_service.py
pytest backend/tests/test_alert_watcher.py
```

### Integration Tests
```bash
# Test alert generation
curl -X GET "http://localhost:8000/api/v1/alerts/active?city=Mumbai"

# Test subscription
curl -X POST "http://localhost:8000/api/v1/alerts/subscribe" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "city": "Mumbai",
    "alert_types": ["heatwave"],
    "severity_levels": ["extreme"],
    "delivery_channels": ["push", "sms"]
  }'

# Test delivery simulation
curl -X POST "http://localhost:8000/api/v1/alerts/test-delivery" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user", "channel": "sms"}'
```

### Monitoring Status
```bash
# Check monitoring system
curl -X GET "http://localhost:8000/api/v1/alerts/monitoring/status"
```

---

## Performance Considerations

### Scalability
- Alert watcher polls independently of API requests
- Subscription matching is O(n) - consider indexing for >10k subscriptions
- Parallel alert dissemination across channels

### Optimization Opportunities
1. **Batch Notifications**: Group alerts by user for combined delivery
2. **Geo-Spatial Indexing**: Use PostGIS for location proximity queries
3. **Message Queue**: Decouple alert generation from delivery (RabbitMQ/Redis)
4. **Rate Limiting**: Prevent alert fatigue with frequency caps
5. **Priority Queue**: Deliver extreme alerts first

---

## Security & Privacy

### Data Protection
- Phone numbers and emails encrypted at rest
- Device tokens stored securely
- Alert history retention: 90 days

### Opt-Out Compliance
- Users can unsubscribe anytime via API or link in messages
- Opt-out honored within 24 hours

### Rate Limiting
- Max 10 alerts per user per hour
- Max 100 alerts per location per day

---

## Future Enhancements

1. **Machine Learning**: Predict alert fatigue and optimize delivery timing
2. **Geofencing**: Mobile app background monitoring with location-aware alerts
3. **Rich Media**: Include radar images and forecast maps in alerts
4. **Two-Way Communication**: Allow users to report conditions via SMS reply
5. **Localization**: Multi-language alert messages
6. **A/B Testing**: Optimize alert messaging for user engagement

---

## References

- Open-Meteo Weather API: https://open-meteo.com/
- Twilio SMS/Voice: https://www.twilio.com/docs
- Firebase Cloud Messaging: https://firebase.google.com/docs/cloud-messaging
- SendGrid Email: https://docs.sendgrid.com/
- WhatsApp Business API: https://developers.facebook.com/docs/whatsapp

---

**Last Updated**: 2026-08-29  
**Version**: 1.0.0
