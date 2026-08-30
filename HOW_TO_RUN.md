# How to Run WeatherGPT - Quick Start Guide

**For SIH 2026 Hackathon Judges & Users**

---

## Prerequisites (5 minutes to install)

1. **Docker Desktop** (Required)
   - Download: https://www.docker.com/products/docker-desktop
   - Install and start Docker Desktop
   - Make sure it's running (check system tray icon)

2. **API Keys** (Free, 2 minutes to get)
   - **Groq API Key** (Required): https://console.groq.com
     - Sign up → Get API Key
   - **Gemini API Key** (Optional): https://aistudio.google.com/app/apikey
     - Sign up → Create API Key

---

## Quick Start (3 Steps - Takes 5 minutes)

### Step 1: Download the Project

```bash
# Clone the repository
git clone <repository-url>
cd weather-gpt

# OR if you have the zip file:
unzip weather-gpt.zip
cd weather-gpt
```

### Step 2: Configure API Keys

```bash
# Copy the environment template
cp .env.docker .env

# Edit the file and add your API keys
# Windows: notepad .env
# Mac/Linux: nano .env
# Or use any text editor you prefer
```

**Edit these lines in `.env`:**
```env
LLM_PRIMARY_API_KEY=your-groq-api-key-here
LLM_SECONDARY_API_KEY=your-gemini-api-key-here
```

Save and close the file.

### Step 3: Start the Application

```bash
# Build and start (first time takes 5 minutes)
docker-compose up -d

# Check if running
docker-compose ps
```

**That's it!** 🎉

---

## Access the Application

Open your browser and go to:

- **Main App:** http://localhost:3000
- **API Docs:** http://localhost:8000/docs

---

## Test It Works

### Quick Test 1: Open the UI
1. Go to http://localhost:3000
2. Click "Select Location" → Choose "Mumbai"
3. Weather data should appear

### Quick Test 2: Ask a Question
1. Type in chat: "Will it rain tomorrow?"
2. Click Send or press Enter
3. You should get an AI response with weather info

### Quick Test 3: Try Different Languages
1. Click language selector (🌐 icon)
2. Select "हिन्दी (Hindi)"
3. Ask: "मुंबई में मौसम कैसा है?"
4. Get response in Hindi

---

## Common Issues & Solutions

### Issue 1: "Cannot connect to Docker daemon"
**Solution:** Make sure Docker Desktop is running
- Windows: Check system tray for Docker icon
- Mac: Check menu bar for Docker icon
- Should show "Docker Desktop is running"

### Issue 2: "Port 8000 already in use"
**Solution:** Stop other services on that port
```bash
# Windows (PowerShell)
netstat -ano | findstr :8000
taskkill /PID <process-id> /F

# Mac/Linux
lsof -ti:8000 | xargs kill -9

# Or change the port in docker-compose.yml
```

### Issue 3: "Build failed" or errors during docker-compose
**Solution:** Try rebuilding from scratch
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Issue 4: Frontend shows "API connection error"
**Solution:** Check backend is running
```bash
# Should return healthy
curl http://localhost:8000/health

# Restart if needed
docker-compose restart backend
```

### Issue 5: "Invalid API key" or LLM not responding
**Solution:** Check your API keys
```bash
# View current environment (keys will be masked)
docker-compose config

# Update .env file with correct keys
nano .env

# Restart to pick up changes
docker-compose restart
```

---

## Useful Commands

### Start the app
```bash
docker-compose up -d
```

### Stop the app
```bash
docker-compose down
```

### View logs (see what's happening)
```bash
# All logs
docker-compose logs -f

# Just backend
docker-compose logs -f backend

# Just frontend
docker-compose logs -f frontend
```

### Restart the app
```bash
docker-compose restart
```

### Check status
```bash
docker-compose ps
```

### Stop and remove everything (fresh start)
```bash
docker-compose down -v
```

---

## Running Without Docker (Alternative Method)

If you can't use Docker, you can run it directly:

### Backend

```bash
# Install Python 3.11+
python --version  # Should be 3.11 or higher

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows (Command Prompt):
venv\Scripts\activate
# Windows (PowerShell):
venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env and add API keys (use any text editor)

# Start backend
python start_server.py
```

Backend will run on http://localhost:8000

### Frontend (in a new terminal)

```bash
cd frontend/web

# Install Node.js 20+ first
node --version  # Should be 20 or higher

# Install dependencies
npm install

# Create environment file
# Windows (PowerShell):
Set-Content .env.local "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1"
# Mac/Linux:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
# Or create manually with any text editor

# Start frontend
npm run dev
```

Frontend will run on http://localhost:3000

---

## System Requirements

**Minimum:**
- 4GB RAM
- 2 CPU cores
- 5GB disk space
- Windows 10/11, macOS 10.15+, or Linux

**Recommended:**
- 8GB RAM
- 4 CPU cores
- 10GB disk space

---

## Features to Try

### 1. Weather Queries
- "What's the weather in Delhi?"
- "Will it rain in Mumbai tomorrow?"
- "Show me 7-day forecast for Bangalore"

### 2. Role-Specific Responses
- Select "Farmer" role → Ask: "Should I irrigate today?"
- Select "Pilot" role → Ask: "Flight weather briefing"
- Select "Disaster Manager" → Ask: "Any severe weather alerts?"

### 3. Voice Features (if microphone available)
- Click microphone icon
- Speak your question
- Get voice response (click speaker icon)

### 4. Multiple Languages
- Try Hindi: "मुंबई में मौसम कैसा है?"
- Try Tamil: "சென்னையில் வானிலை எப்படி இருக்கிறது?"
- Works with 10 Indian languages!

---

## Data Storage

All data is stored in `./data/weathergpt.db` (SQLite database)
- Conversation history
- User preferences
- Alert history

**To reset data:**
```bash
docker-compose down
rm -rf data/weathergpt.db
docker-compose up -d
```

---

## Stopping the Application

```bash
# Stop (data is preserved)
docker-compose down

# Stop and remove data
docker-compose down -v
```

---

## Getting Help

### Check if services are healthy
```bash
# Backend health
curl http://localhost:8000/health

# Frontend (should return HTML)
curl http://localhost:3000
```

### View detailed logs
```bash
# Last 100 lines
docker-compose logs --tail=100

# Follow logs in real-time
docker-compose logs -f
```

### Check resource usage
```bash
docker stats
```

---

## For Hackathon Judges

### Quick Demo Flow (2 minutes)

1. **Start app:** `docker-compose up -d`
2. **Open browser:** http://localhost:3000
3. **Select location:** Mumbai
4. **Ask question:** "Will it rain tomorrow?"
5. **Try Hindi:** Switch language, ask in Hindi
6. **Show role awareness:** Change to Farmer, ask same question
7. **Check API docs:** http://localhost:8000/docs

### Evaluation Points to Highlight

1. **LLM Integration:** Groq + Gemini fallback
2. **Weather Data:** Live Open-Meteo API
3. **Conversation History:** Check database persistence
4. **Multilingual:** 10 Indian languages
5. **Role-Aware:** Different responses per role
6. **Alert System:** Server-side severity classification

---

## Troubleshooting Checklist

- [ ] Docker Desktop is running
- [ ] API keys added to `.env` file
- [ ] Ports 3000 and 8000 are free
- [ ] Internet connection active (for APIs)
- [ ] At least 2GB RAM available
- [ ] Logs show no errors: `docker-compose logs`

---

## Support

- **Documentation:** Check `README.md` and `SETUP.md`
- **API Docs:** http://localhost:8000/docs (when running)
- **Test Script:** `python system_check.py`

---

## Quick Reference

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Restart
docker-compose restart

# Status
docker-compose ps

# Fresh start
docker-compose down -v && docker-compose up -d --build
```

---

**You're ready to run WeatherGPT!** 🚀

Open http://localhost:3000 and start asking weather questions!
