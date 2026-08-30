# WeatherGPT Authentication & Rate Limiting

## Overview

WeatherGPT implements a **lightweight, email-based authentication system** designed for:
- **Personalization**: Tailor weather responses based on user occupation
- **Fair-use tracking**: Rate limiting to prevent abuse
- **Transparency**: No passwords, no verification - just identity for better service

⚠️ **Important**: This authentication system is designed for personalization and fair-use rate limiting. It uses lightweight email-based login suitable for demo and development environments. User-provided API keys are encrypted at rest using Fernet symmetric encryption. For production deployments handling sensitive data, implement the production upgrade path documented below.

## How It Works

### 1. User Login Flow

```typescript
// Frontend: Check localStorage for remembered credentials
const storedEmail = localStorage.getItem('weathergpt_email')
const storedOccupation = localStorage.getItem('weathergpt_occupation')

if (storedEmail && storedOccupation) {
  // User is "logged in"
  setIsAuthenticated(true)
} else {
  // Show login card
  showLoginCard()
}
```

### 2. Login Endpoint

**POST** `/api/v1/login`

```json
{
  "email": "farmer@example.com",
  "occupation": "Rice farmer in Punjab"
}
```

**Response:**
```json
{
  "email": "farmer@example.com",
  "occupation": "Rice farmer in Punjab",
  "message": "Welcome to WeatherGPT!",
  "is_new_user": true
}
```

**Backend Behavior:**
- **Upsert operation**: Creates new user OR updates existing user's occupation
- **No password required**: Email is the only identifier
- **No email verification**: Immediate access
- Stores: email (PK), occupation, created_at, last_login

### 3. Authenticated Requests

All `/api/v1/ask` requests now require email:

```json
{
  "query": "Will it rain tomorrow?",
  "email": "farmer@example.com",  // Required
  "language": "en",
  "role": "farmer"
}
```

**Backend Flow:**
1. Verify user exists (401 if not found)
2. Check rate limit (429 if exceeded)
3. Log API usage for rate limiting
4. Lookup occupation from database (server-side only)
5. Inject occupation into LLM system prompt for personalization
6. Return personalized weather response

### 4. Rate Limiting

**Rolling 24-hour window**: 50 questions per email (configurable via `MAX_QUESTIONS_PER_DAY`)

```python
# Check rate limit
window_start = datetime.utcnow() - timedelta(hours=24)
request_count = db.query(UsageLog).filter(
    UsageLog.email == email,
    UsageLog.endpoint == "/api/v1/ask",
    UsageLog.timestamp >= window_start
).count()

if request_count >= MAX_QUESTIONS_PER_DAY:
    raise HTTPException(status_code=429, detail="You've reached your limit of 50 questions in the last 24 hours. Please try again later.")
```

**Rate Limit Response (429):**
```json
{
  "detail": "Daily question limit reached. You've asked 50 questions in the last 24 hours. Please try again later."
}
```

### 5. Occupation-Based Personalization

The user's occupation is injected into the LLM system prompt:

```python
if occupation:
    role_prompt += f"\n\nUser context: The person asking is a {occupation}. Tailor your response to be relevant to their work and concerns."
```

**Example:**
- **Occupation**: "Pilot flying domestic routes"
- **Query**: "Weather in Delhi?"
- **Personalized Response**: Includes visibility, wind shear, turbulence indicators

## Database Schema

### `auth_users` Table

```sql
CREATE TABLE auth_users (
    email VARCHAR(255) PRIMARY KEY,
    occupation VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auth_users_email ON auth_users(email);
```

### `usage_logs` Table

```sql
CREATE TABLE usage_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    endpoint VARCHAR(100) NOT NULL,
    FOREIGN KEY (email) REFERENCES auth_users(email)
);

CREATE INDEX idx_usage_logs_email ON usage_logs(email);
CREATE INDEX idx_usage_logs_timestamp ON usage_logs(timestamp);
```

## Frontend Integration

### Login Component

```tsx
import LoginCard from '@/components/LoginCard'

// Show login if not authenticated
if (!isAuthenticated) {
  return <LoginCard onLoginSuccess={handleLoginSuccess} />
}
```

### Chat Interface Updates

```tsx
<ChatInterface
  email={userEmail}           // Pass email for authenticated requests
  onAuthError={handleAuthError} // Handle 401 errors
  // ... other props
/>
```

### Error Handling

**401 Unauthorized:**
- Clear localStorage
- Show login screen
- Display: "Please login again"

**429 Rate Limit:**
- Display rate limit message IN-CHAT (not as generic error)
- Show: "You've reached your daily question limit. Please try again in 24 hours."

## Configuration

### Environment Variables

```bash
# .env
MAX_QUESTIONS_PER_DAY=50  # Rate limit per user
```

### Adjusting Rate Limits

**For hackathon demo**: Set high limit (e.g., 500)
```bash
MAX_QUESTIONS_PER_DAY=500
```

**For production**: Set reasonable limit (e.g., 50)
```bash
MAX_QUESTIONS_PER_DAY=50
```

## Production Upgrade Path

### From SQLite to PostgreSQL

**Current (Hackathon):**
```python
DATABASE_URL=sqlite:///./weathergpt.db
```

**Production:**
```python
DATABASE_URL=postgresql://user:password@host:5432/weathergpt
```

The same SQLAlchemy models work with both. No code changes needed - just update `DATABASE_URL`.

### Adding Real Authentication (Future)

If you later need real security:

1. **Add password field**: `password_hash VARCHAR(255)`
2. **Add email verification**: `is_verified BOOLEAN`, `verification_token`
3. **Add JWT tokens**: For stateless authentication
4. **Add session management**: Redis-backed sessions
5. **Add OAuth providers**: Google, GitHub, etc.

But for personalization and fair-use, the current system is intentionally simple.

## Security Considerations

### Current System Capabilities

✅ **Identity for personalization** - Tailor responses based on user occupation  
✅ **Fair-use rate limiting** - Prevent API quota exhaustion (50 questions/24h)  
✅ **Encrypted API key storage** - Fernet symmetric encryption with API_SECRET_KEY  
✅ **Abuse prevention** - Email-based throttling creates friction for attackers  
✅ **User experience optimization** - Occupation-aware responses without signup friction

### Design Philosophy

This authentication design prioritizes **rapid onboarding and demonstration value**. For hackathon and demo environments where ease of access is paramount, this lightweight approach reduces friction while still providing personalization and usage tracking. 

**What's included:**
- Email-based identity (no password required)
- Encrypted storage for user-provided API keys
- Rolling 24-hour rate limiting
- Occupation-based response personalization

**Production Enhancement Path:**

For production deployments requiring enhanced security, the architecture supports straightforward upgrades:

1. **Password-based authentication** - Add bcrypt password hashing
2. **Email verification workflows** - Implement token-based verification
3. **JWT session tokens** - Stateless authentication with refresh tokens
4. **OAuth provider integration** - Google, GitHub, Microsoft SSO
5. **Two-factor authentication** - TOTP-based 2FA

These enhancements can be added incrementally without rewriting the core system.

### Rate Limiting as Primary Protection

The main abuse vector is **API quota exhaustion** (LLM calls cost money). Rate limiting solves this:
- 50 questions per email per 24h
- Email-based tracking (can be disposable, but creates friction)
- Rolling window (not calendar day)

An attacker would need 20 different emails to get 1000 questions/day - enough friction for a demo.

## Testing

### Manual Testing

**1. Test Login:**
```bash
curl -X POST http://localhost:8000/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "occupation": "Software Developer"}'
```

**2. Test Authenticated Request:**
```bash
curl -X POST http://localhost:8000/api/v1/ask \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Weather in Mumbai?",
    "email": "test@example.com",
    "language": "en",
    "role": "citizen"
  }'
```

**3. Test Rate Limiting:**
```bash
# Run this 51 times to hit rate limit
for i in {1..51}; do
  curl -X POST http://localhost:8000/api/v1/ask \
    -H "Content-Type: application/json" \
    -d '{
      "query": "Weather in Mumbai?",
      "email": "test@example.com",
      "language": "en",
      "role": "citizen"
    }'
  echo "Request $i completed"
done
```

### Automated Tests

```python
# backend/tests/test_auth.py
import pytest
from backend.services.auth_service import auth_service

def test_login_creates_user(db):
    user = auth_service.login_or_create_user(
        email="test@example.com",
        occupation="Farmer",
        db=db
    )
    assert user.email == "test@example.com"
    assert user.occupation == "Farmer"

def test_rate_limit_enforcement(db):
    email = "ratelimit@example.com"
    auth_service.login_or_create_user(email, "Tester", db)
    
    # Log 50 requests
    for _ in range(50):
        auth_service.log_usage(email, "/api/v1/ask", db)
    
    # 51st should be blocked
    is_allowed, count, remaining = auth_service.check_rate_limit(
        email, "/api/v1/ask", db
    )
    assert not is_allowed
    assert count == 50
    assert remaining == 0
```

## API Documentation

Full API docs available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Look for the "Authentication" tag to see login endpoints.

## Troubleshooting

**Problem**: 401 Unauthorized on `/api/v1/ask`  
**Solution**: User must login first via `/api/v1/login`

**Problem**: 429 Rate Limit on first request  
**Solution**: Check database - old usage logs might exist. Clear: `DELETE FROM usage_logs WHERE email='...'`

**Problem**: Occupation not personalizing responses  
**Solution**: Verify occupation is being injected into system prompt. Check logs for "User context:" in LLM messages.

**Problem**: Frontend keeps showing login  
**Solution**: Check browser localStorage for `weathergpt_email`. Clear and re-login.

## Summary

This authentication system is designed for **hackathon success**:
- ✅ Fast to implement (no password complexity)
- ✅ Good UX (no verification wait)
- ✅ Enables personalization (occupation-aware responses)
- ✅ Prevents abuse (rate limiting)
- ✅ Production-ready path (PostgreSQL upgrade)

Perfect for a demo, with a clear upgrade path for production deployment.
