# Changelog

All notable changes to WeatherGPT will be documented in this file.

## [1.1.0] - 2026-08-29

### Added
- Auto-login functionality with API key retrieval
- User API keys stored encrypted in database and passed to LLM services
- Black-white-yellow professional color scheme across entire UI
- Explicit background colors for location and language selectors
- Increased LLM max_tokens from 500 to 1500 for complete responses

### Changed
- Role parameter now defaults to "citizen" instead of using occupation directly
- Updated LoginCard, ChatInterface, and main page with new color theme
- Removed non-functional UI elements (hamburger menu, search bar, mic button)
- Improved visibility of dropdown selectors with proper backgrounds

### Fixed
- Fixed role validation error in chat endpoint
- Fixed API key transmission from frontend to backend
- Fixed auto-login flow to retrieve and store API keys properly
- Fixed incomplete LLM responses for detailed forecasts
- Fixed invisible dropdown backgrounds causing readability issues

### Technical Details
- Backend: API keys prioritized from request body over database
- Frontend: API keys retrieved from localStorage and sent with requests
- LLM Service: Supports user-provided Groq and Gemini API keys
- Chat Service: Increased token limit for comprehensive weather responses

## [1.0.0] - 2026-08-27

### Initial Release
- Multi-language support (10 Indian languages)
- Role-based weather responses
- Voice input/output capabilities
- Real-time weather data from Open-Meteo
- Alert monitoring system
- Docker deployment support
- Lightweight email-based authentication
