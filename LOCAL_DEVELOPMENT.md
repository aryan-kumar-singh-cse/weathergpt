# Local Development Guide

This guide covers running WeatherGPT locally without Docker for development purposes.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.9+ with pip
- API Keys configured in `.env` file

## Quick Setup

### 1. Clone and Configure

```bash
git clone https://github.com/krishrana1430/SIH.git
cd SIH

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env  # or use your preferred editor
```

### 2. Install Dependencies

**Backend:**
```bash
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend/web
npm install
cd ../..
```

## Running the Application

You'll need two terminal windows/tabs:

### Terminal 1: Backend Server

```bash
# From project root
python -m uvicorn backend.api.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at:
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Terminal 2: Frontend Development Server

```bash
cd frontend/web
npm run dev
```

The frontend will be available at:
- Frontend: http://localhost:3000

## Accessing the Application

1. **Open your browser** to http://localhost:3000
2. **Select a city** from the dropdown
3. **Choose your language** and role
4. **Start chatting** with WeatherGPT!

## Development Workflow

### Backend Development

The backend runs with auto-reload enabled:
- Edit any `.py` file in `backend/`
- Server automatically restarts
- Refresh your API calls to see changes

### Frontend Development

The frontend runs with hot module reload:
- Edit any file in `frontend/web/`
- Browser automatically updates
- No manual refresh needed

## Environment Variables

Key variables for local development (in `.env`):

```bash
# Backend API URL (for frontend)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# LLM Configuration
LLM_PRIMARY_API_KEY=your-groq-api-key
LLM_SECONDARY_API_KEY=your-gemini-api-key

# Database (SQLite by default)
DATABASE_URL=sqlite:///./weathergpt.db

# API Security
API_SECRET_KEY=your-secret-key-change-in-production
API_DEBUG=true
```

## Testing

### Backend Tests

```bash
# API tests
python test_api.py

# LLM service tests
python test_llm.py

# Full system check
python system_check.py
```

### Frontend Tests

```bash
cd frontend/web
npm test
```

## Troubleshooting

### Port Already in Use

**Backend (port 8000):**
```bash
# Find and kill the process
lsof -ti:8000 | xargs kill -9

# Or use a different port
python -m uvicorn backend.api.main:app --reload --port 8001
# Update NEXT_PUBLIC_API_URL in .env accordingly
```

**Frontend (port 3000):**
```bash
# Kill the process
lsof -ti:3000 | xargs kill -9

# Or Next.js will automatically use 3001 if 3000 is busy
```

### Module Not Found Errors

**Backend:**
```bash
# Ensure you're in the project root
pip install -r requirements.txt

# If still failing, try:
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

**Frontend:**
```bash
cd frontend/web
rm -rf node_modules package-lock.json
npm install
```

### API Connection Issues

1. **Check backend is running:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Check environment variable:**
   ```bash
   # In frontend/web/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```

3. **Check CORS settings** in `backend/api/main.py`:
   ```python
   origins = [
       "http://localhost:3000",
       "http://127.0.0.1:3000",
   ]
   ```

### Database Issues

```bash
# Reset database
rm weathergpt.db

# Restart backend (will recreate database)
python -m uvicorn backend.api.main:app --reload
```

### LLM API Errors

1. **Verify API keys** are correct in `.env`
2. **Check API key validity:**
   ```bash
   python test_llm.py
   ```
3. **Test fallback chain:**
   - Primary (Groq) → Secondary (Gemini) → Fallback (mock)

## Alternative: Using Docker

If you prefer Docker for development:

```bash
# Build and run all services
docker-compose up --build

# Or use the local development variant
docker-compose -f docker-compose.local.yml up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

See [SETUP.md](./SETUP.md) for complete Docker instructions.

## Development Tools

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Database Browser
```bash
# Install sqlite3 browser (optional)
sqlite3 weathergpt.db

# View tables
.tables

# View conversations
SELECT * FROM conversations LIMIT 10;

# Exit
.quit
```

### VS Code Extensions (Recommended)
- Python
- Pylance
- ESLint
- Prettier
- Tailwind CSS IntelliSense

## Stopping the Application

Press `Ctrl+C` in each terminal to stop the services.

## Need More Help?

- Check [SETUP.md](./SETUP.md) for comprehensive setup guide
- See [API Documentation](./docs/API.md) for API details
- Review [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) for all guides

---

Happy coding! 🚀
