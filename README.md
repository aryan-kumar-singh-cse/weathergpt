# WeatherGPT 🌤️

AI-powered weather forecasting assistant with multilingual support and role-based responses for Smart India Hackathon 2026.

> **Latest Update (v1.1.0)**: New black-white-yellow UI theme, auto-login with API key management, improved LLM response handling, and cleaner interface.

## 🌟 Features

### User-Provided API Keys
- **Bring Your Own Keys**: Users provide their own free Groq/Gemini API keys during registration
- **Secure Storage**: API keys encrypted in database using Fernet encryption
- **Auto-Login**: Returning users automatically logged in with stored credentials
- **Two-Tier LLM**: Primary (Groq) → Secondary (Gemini) fallback for reliability

### Multi-Language Support
- **10 Indian Languages**: English, Hindi (हिन्दी), Tamil (தமிழ்), Telugu (తెలుగు), Bengali (বাংলা), Marathi (मराठी), Kannada (ಕನ್ನಡ), Gujarati (ગુજરાતી), Malayalam (മലയാളം), Punjabi (ਪੰਜਾਬੀ)
- Real-time language switching with native script support
- Natural language processing in user's preferred language
- Full pipeline language preservation (input → processing → output)

### Role-Based Responses
- **Citizen**: Everyday weather information for daily planning
- **Farmer**: Agricultural insights, crop-relevant forecasts
- **Pilot**: Aviation weather data, visibility, wind conditions
- **Emergency Services**: Critical weather alerts and risk assessment

### Professional UI Design
- **Black-White-Yellow Theme**: Clean, modern, accessible color scheme
- **Dark Mode Support**: Seamless light/dark theme switching
- **Optimized Dropdowns**: Clear backgrounds for location and language selectors
- **Minimal Interface**: Focused on core functionality without clutter

### Lightweight Authentication & Personalization
- **Email-based login**: Simple authentication with encrypted API key storage
- **Occupation-aware responses**: AI tailors answers based on your work (e.g., "Rice farmer in Punjab")
- **Fair-use rate limiting**: 50 questions per user per 24 hours (configurable)
- **SQLite for demo**: Easy upgrade path to PostgreSQL for production
- 📖 **[Complete Authentication Documentation](./AUTHENTICATION.md)**

### Weather Alerts System
- **Server-side severity classification** with configurable thresholds
- **Proactive monitoring** of weather conditions with automatic alert generation
- **5 severity levels**: Normal, Watch, Warning, Severe, Extreme
- **Alert types**: Heatwave, Heavy Rain, High Wind, Frost/Freeze, Storm
- **Real-time breach detection** and alert storage in database

### Real-Time Weather Data
- Current conditions and forecasts
- 7-day weather predictions
- Hourly updates
- Multiple Indian cities supported

## 🚀 Quick Start with Docker

### Prerequisites
- Docker & Docker Compose installed
- Users provide their own free API keys at first login:
  - [Groq API Key](https://console.groq.com) (Primary LLM - fast)
  - [Gemini API Key](https://aistudio.google.com/app/apikey) (Secondary LLM - fallback)
- Keys are encrypted and stored per user in the database

### Setup

1. **Clone the repository:**
```bash
git clone https://github.com/krishrana1430/SIH.git
cd SIH
```

2. **Configure environment:**
```bash
cp .env.example .env
# Optional: Edit .env to add admin-level API keys (users will provide their own at login)
```

3. **Start services:**
```bash
docker-compose up -d
```

4. **Access the application:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

5. **First-time user setup:**
- Users provide their own free Groq and Gemini API keys at first login
- Keys are encrypted and stored securely in the database, tied to their email
- No API keys = no additional costs for deployment

## 🏗️ Architecture

```
WeatherGPT
├── Backend (Python FastAPI)
│   ├── LLM Chain (2-Tier Fallback: Groq → Gemini)
│   │   ├── Tier 1: Groq (Primary - fast, free tier)
│   │   └── Tier 2: Gemini (Fallback - reliable, free tier)
│   ├── Weather Service (Open-Meteo API)
│   └── Alert Monitoring Service
├── Frontend (Next.js + React)
│   ├── Chat Interface
│   └── Weather Dashboard
└── Database (SQLite)
    └── User Data & Encrypted API Keys
```

### LLM Two-Tier Fallback Strategy

WeatherGPT implements a resilient two-tier LLM provider chain with **user-provided API keys**:

- **Tier 1 (Primary)**: Groq API - Fast inference with generous free tier
- **Tier 2 (Secondary)**: Google Gemini - Reliable fallback with free tier

**Key Features:**
- Users provide their own free API keys at first login
- Keys are encrypted and stored per user email in the database
- Automatic fallback from Groq → Gemini on rate limits or failures
- Zero API costs for deployment (users bring their own keys)
- Both providers offer generous free tiers suitable for demos and hackathons

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.11)
- **LLM**: Groq (primary), Google Gemini (fallback) - user-provided keys
- **Weather Data**: Open-Meteo API
- **Database**: SQLite with encrypted key storage
- **Voice**: Groq Whisper (STT), Browser TTS

### Frontend
- **Framework**: Next.js 14
- **UI**: React, TailwindCSS
- **Components**: Shadcn/ui
- **Charts**: Recharts

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **Deployment**: Ready for Kubernetes (config in `infra/k8s/`)

## 📚 Documentation

- [Setup Guide](./SETUP.md) - Detailed setup instructions
- [How to Run](./HOW_TO_RUN.md) - Quick start guide
- [Authentication System](./AUTHENTICATION.md) - Login and user key management
- **[Alert Dissemination Architecture](./ALERT_DISSEMINATION_ARCHITECTURE.md) - Extreme weather alert system** ⚡ NEW
- [API Documentation](./docs/API.md) - Complete API reference
- [Multilingual Testing](./docs/MULTILINGUAL_TESTING.md) - Language support testing guide
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines
- [Documentation Index](./DOCUMENTATION_INDEX.md) - All docs

## 🌐 Example Queries in Different Languages

```
English: "Will it rain in Mumbai tomorrow?"
Hindi: "दिल्ली में कल बारिश होगी क्या?"
Tamil: "சென்னையில் இன்று மழை பெய்யுமா?"
Telugu: "హైదరాబాద్‌లో వాతావరణం ఎలా ఉంది?"
Bengali: "কলকাতায় আজ আবহাওয়া কেমন?"
Marathi: "पुण्यात आज पाऊस पडेल का?"
```

The system understands natural weather queries in all supported languages and responds in the same language.

## 🔧 Development

### Local Development (without Docker)

See [LOCAL_DEVELOPMENT.md](./LOCAL_DEVELOPMENT.md) for detailed instructions.

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r ../requirements.txt
python -m uvicorn backend.api.main:app --reload
```

**Frontend:**
```bash
cd frontend/web
npm install
npm run dev
```

### Environment Variables

Key environment variables (see `.env.example` for full list):

```bash
# LLM Configuration (optional admin-level keys - users provide their own)
LLM_PRIMARY_API_KEY=your-groq-key  # Optional: for system-level operations
LLM_SECONDARY_API_KEY=your-gemini-key  # Optional: for system-level operations

# API Configuration
API_SECRET_KEY=your-secret-key
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

**Note**: Users provide their own API keys at first login, which are encrypted and stored in the database.

## 🔑 User API Key Management

### How It Works

WeatherGPT uses a **user-provides-own-keys** model for zero-cost deployment:

1. **First Login:**
   - User enters their email and occupation
   - System prompts for free Groq and Gemini API keys
   - Keys are encrypted and stored in the database

2. **Automatic Fallback:**
   - Primary: User's Groq API key (fast)
   - Fallback: User's Gemini API key (if Groq fails/rate-limited)

3. **Security:**
   - Keys are encrypted at rest using API_SECRET_KEY
   - Keys are tied to user email (isolated per user)
   - No centralized API costs

### Getting Free API Keys

Both providers offer generous free tiers:

**Groq (Primary):**
- Visit: https://console.groq.com
- Free tier: Fast inference, suitable for demos
- Models: GPT-OSS-20B and others

**Gemini (Fallback):**
- Visit: https://aistudio.google.com/app/apikey
- Free tier: Generous rate limits
- Model: Gemini 2.0 Flash

### Testing the Fallback Chain

```bash
# Test with user's keys via the chat endpoint
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "city": "Delhi", "email": "user@example.com"}'
```

## 🧪 Testing

Comprehensive automated test suite covering API contracts, LLM fallback, severity classification, and end-to-end integration.

### Quick Start

```bash
# Run all tests
pytest backend/tests/ -v

# Run with coverage report
pytest backend/tests/ -v --cov=backend --cov-report=html

# Using test runner script
python run_tests.py              # All tests
python run_tests.py fast         # Fast unit tests only
python run_tests.py coverage     # With coverage report
```

### Test Coverage

- ✅ **API Contract Tests**: `/api/ask` endpoint validation with valid/invalid inputs
- ✅ **LLM Fallback Tests**: Three-tier provider chain resilience (primary → secondary → fallback)
- ✅ **Severity Classification**: Weather threshold boundary testing
- ✅ **Integration Tests**: End-to-end query flow with database persistence
- ✅ **Session Management**: User sessions, conversation history, preferences

📖 **[Complete Testing Documentation](./TESTING.md)** - Detailed guide on running tests, fixtures, mocking strategy, and CI integration

## 📱 Features in Detail

### Intelligent Weather Queries
- Natural language understanding
- Context-aware responses
- Historical data analysis
- Weather trend predictions

### Multi-City Support
- Major Indian cities pre-configured
- Custom location search
- Geolocation support

### Accessibility
- Screen reader compatible
- Keyboard navigation
- High contrast mode
- Voice interface

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

This project is developed for Smart India Hackathon 2026.

## 👥 Team

SIH 2026 Team - WeatherGPT

## 🙏 Acknowledgments

- **Open-Meteo**: Free weather API
- **Groq**: Fast LLM inference
- **Google Gemini**: AI capabilities
- **Smart India Hackathon**: Opportunity and platform

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check [Documentation Index](./DOCUMENTATION_INDEX.md)

---

Built with ❤️ for Smart India Hackathon 2026
