# 🌦️ WeatherGPT — Next-Generation Meteorological AI & Climate Intelligence Platform

> **Smart India Hackathon (SIH) 2026 Submission**  
> *Next-Gen AI-Powered Agro-Meteorological Intelligence, Multi-Hazard Early Warning System, ISRO Satellite Telemetry, and Last-Mile Vernacular Decision Support.*

---

## 🌟 Executive Summary & Problem Statement Alignment

Conventional weather applications provide raw meteorological numbers (e.g., *32°C, 78% humidity, 14 km/h wind*) that leave farmers, emergency responders, pilots, and everyday citizens to guess what actions they should take. In disaster-prone rural regions, complex interfaces and lack of native vernacular support create a dangerous last-mile communication gap.

**WeatherGPT** bridges this gap by transforming raw multi-source atmospheric data into **actionable, sector-specific, and vernacular decision intelligence**. Powered by an interactive 3D WebGL planetary engine, dual-tier LLMs (Groq LLaMA 3.3 70B & Google Gemini), ISRO INSAT-3DR satellite telemetry, and direct WhatsApp/SMS rural dispatches, WeatherGPT delivers life-saving and crop-saving insights to every citizen in their native dialect.

---

## 🚀 Key Innovations & Flagship Features

### 1. 🌍 Interactive 3D WebGL Planetary Climate Globe
- **Custom Three.js Sphere**: Real-time rotating Earth globe with atmospheric haze shaders, sun lighting vectors, and cloud textures.
- **Dynamic Weather Particles**: Visual rain precipitation, cloud density, and sunlight levels synchronizing in real-time with selected district coordinates.
- **Dockable & Minimizable UI**: Toggle between deep multi-metric analytics and an unobstructed planetary visualization.

### 2. ⚡ IITM / IMD DAMINI Lightning & Convective Instability Analyzer
- **Meteorological Convective Instability Index**: Analyzes thermal energy, dew-point moisture, and convective cloud codes.
- **Plain-Language Risk Categorization**:
  - 🟢 **SAFE**: Zero convective thunderstorm cells within 30 km radius. Safe for field work and construction.
  - 🟡 **CAUTION**: Convective cloud buildup in progress. Potential isolated discharges in 1–2 hours.
  - 🔴 **DANGER**: Active lightning and convective storm cell. Instant recommendation to suspend open-field operations.
- **Ground Sensor Telemetry**: Nearest strike distance (km), past 30-minute discharge counts, and storm movement vectors.
- **NDMA / IMD 30-30 Safety Directives**: Plain guidelines for rural field safety.

### 3. 🛰️ ISRO INSAT-3DR Geostationary Satellite & Synoptic Radar Visualizer
- **Spaceborne Satellite Streams**: Centered over the Indian Subcontinent ($74^\circ\text{E}$ orbital position).
- **Multi-Channel Synoptic Layers**:
  - **Cloud Satellite Cover**: High-resolution Infrared cloud-top structure and thermal height scale.
  - **Precipitation Radar**: Live radar reflectivity showing active rain and storm cells.
  - **Wind Circulation**: Dynamic streamline vectors showing monsoon currents and pressure gradients.
- **Plain-Language Satellite Telemetry Summary**: Explains what spaceborne sensors see over the target district in plain terms.

### 4. 🌾 Krishi Vigyan Kendra (KVK) Smart Crop Phenology & GDD Engine
- **Growing Degree Days (GDD) Accumulator**: Tracks thermal unit accumulation based on Days After Sowing (DAS).
- **Major Indian Crops Supported**: *Paddy (Rice), Cotton, Wheat, Mustard, Sugarcane, Soybean*.
- **Phenological Growth Stages**: Vegetative, Tillering, Panicle Initiation, Flowering, Dough, and Physiological Maturity.
- **Weather-Triggered Pest & Disease Warning**: Calculates fungal spore germination risk (e.g., *Blast, False Smut, Pink Bollworm, Yellow Rust*) and recommends precise bio-pesticide and chemical remedies.

### 5. 🚨 NDMA Multi-Hazard Disaster Hub & Emergency SOS
- **Cloudburst & Rainfall Inundation Simulator**: Interactive slider ($10\text{ mm} \rightarrow 200\text{ mm}$) calculating flood inundation envelope, drain runoff, and low-lying vulnerability.
- **1-Tap Emergency Speed Dialers**: Direct phone triggers for:
  - `112`: National Emergency Response Support System (ERSS)
  - `1077`: District Disaster Control Room
  - `1070`: State Disaster Management Authority (SDMA)
  - `108`: Emergency Medical & Ambulance Service
- **Relief Camp Directory**: Active municipal shelter locations with bed capacity and emergency medical facilities.

### 6. 📲 Rural 2G/3G SMS & Automated IVR Voice Broadcast
- **Direct Real-Number WhatsApp Dispatch**: 1-click instant delivery of localized weather & agricultural bulletins directly to the farmer's WhatsApp number.
- **Native Device SMS Protocol**: Generates standard 160-character cellular SMS alerts compatible with basic feature phones.
- **Vernacular Audio Voice Call Simulation**: Text-To-Speech audio bulletin synthesizer reading out advisories in regional Indian dialects.

### 7. 📋 1-Click Agro-Meteorological Weather Bulletin Exporter
- **Official IMD/WeatherGPT Formatted Reports**: Generates downloadable, high-res PDF and printable bulletins.
- **Share to WhatsApp**: Instant share link formatted for farmer WhatsApp groups and agricultural cooperatives.

### 8. 📊 30-Year Climatological Benchmark & Monsoon Deviation
- **Long-Period Average (LPA) Comparison**: Compares live observation against IMD's 30-year climatological baseline (1991–2020).
- **Monsoon Anomaly Detector**: Identifies deficit vs. excess rainfall trends and heatwave anomalies.

### 9. 🌐 Full Vernacular Localization (7 Regional Indian Languages)
- Real-time localization across UI, live metrics, forecast panels, satellite interpretations, advisories, and AI chat responses:
  - 🇬🇧 **English**
  - 🇮🇳 **हिन्दी (Hindi)**
  - 🇮🇳 **मराठी (Marathi)**
  - 🇮🇳 **தமிழ் (Tamil)**
  - 🇮🇳 **తెలుగు (Telugu)**
  - 🇮🇳 **বাংলা (Bengali)**
  - 🇮🇳 **ગુજરાતી (Gujarati)**

### 10. 📍 Persistent Geolocation & Live Background Auto-Sync
- **Zero Location Drift**: Auto-detects GPS silently on first launch and caches the user's active district in `localStorage`. Reloading or refreshing never resets your location.
- **Live Background Auto-Sync**: Automatically synchronizes observation data every 2.5 minutes with a live countdown status indicator (`🟢 Auto-Sync • 12s ago [↻]`).

### 11. 🧠 Dual-Tier LLM Architecture with Multi-Turn Conversational Memory
- **Tier 1 (Primary)**: Groq Cloud — LLaMA 3.3 70B Versatile ($<500\text{ ms}$ ultra-low latency response).
- **Tier 2 (Fallback)**: Google Gemini 1.5/2.5 Flash (Seamless automatic failover).
- **Decoupled Conversational Context**: Chat drawer retains multi-turn memory without interfering with or overwriting the primary dashboard location.

---

## 🏗️ System Architecture

```
                               ┌──────────────────────────────────────────────────────────┐
                               │                    WEATHERGPT FRONTEND                   │
                               │           (Next.js 14 App Router, React, Tailwind)       │
                               └────────────────────────────┬─────────────────────────────┘
                                                            │
                     ┌──────────────────────────────────────┼──────────────────────────────────────┐
                     │                                      │                                      │
                     ▼                                      ▼                                      ▼
        ┌─────────────────────────┐            ┌─────────────────────────┐            ┌─────────────────────────┐
        │   3D Planetary Engine   │            │   Interactive Modals    │            │  Decoupled AI Chat Bar  │
        │  (Three.js WebGL Globe) │            │  - DAMINI Lightning     │            │  - Multi-Turn Memory    │
        │  - Dynamic Shaders      │            │  - KVK Crop Phenology   │            │  - Role-Based Persona   │
        │  - Atmosphere Vectors   │            │  - ISRO Satellite Feed  │            │  - Vernacular Output    │
        │  - Particle Weather     │            │  - NDMA Disaster Hub    │            │  - Voice Audio Input    │
        │                         │            │  - Rural SMS/WhatsApp   │            │                         │
        └─────────────────────────┘            └─────────────────────────┘            └────────────┬────────────┘
                                                                                                   │
                                                                                                   ▼
                                                                                      ┌─────────────────────────┐
                                                                                      │      FastAPI Server     │
                                                                                      │     (Python 3.11)       │
                                                                                      └────────────┬────────────┘
                                                                                                   │
                                                  ┌────────────────────────────────────────────────┼─────────────────────────────────┐
                                                  ▼                                                ▼                                 ▼
                                     ┌─────────────────────────┐                      ┌─────────────────────────┐       ┌─────────────────────────┐
                                     │    Open-Meteo & IMD     │                      │      Groq Cloud LLM     │       │    Google Gemini LLM    │
                                     │  Meteorological Ingest  │                      │    (LLaMA 3.3 70B)      │       │     (Flash Fallback)    │
                                     │  - Current Conditions   │                      │  - Primary Synthesizer  │       │  - Auto Failover Engine │
                                     │  - 7 & 15 Day Forecast  │                      │  - <500ms Token Stream  │       │  - Zero Downtime Link   │
                                     │  - Convective Indices   │                      └─────────────────────────┘       └─────────────────────────┘
                                     └─────────────────────────┘
```

---

## 💻 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | Next.js 14 (App Router, TypeScript, React 18) |
| **Styling & Theme** | Tailwind CSS, Lucide Icons, Custom Yellow-Black Frosted Glass Aesthetic |
| **3D Graphics** | Three.js, WebGL Shaders, Particle Engines |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, Pydantic |
| **Primary LLM** | Groq Cloud (LLaMA 3.3 70B Versatile) |
| **Secondary LLM** | Google Gemini (Gemini 1.5 Flash / Gemini 2.5) |
| **Weather Ingest** | Open-Meteo High-Resolution WMO Telemetry, Reverse Geocoding API |
| **Satellite Imagery** | ISRO INSAT-3DR Geostationary Sector Feeds, Synoptic Radar Stream |
| **Containerization** | Docker, Docker Compose (Multi-stage alpine/slim builds) |

---

## 📦 Quick Start & Installation

### Option 1: Docker Compose (Recommended)

1. **Clone Repository:**
   ```bash
   git clone https://github.com/aryan-kumar-singh-cse/weathergpt.git
   cd weathergpt
   ```

2. **Configure Environment Variables (`.env`):**
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=8000
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Build & Start Containers:**
   ```bash
   docker compose up --build -d
   ```

4. **Access Web Application:**
   - **Frontend UI**: [http://localhost:3000](http://localhost:3000)
   - **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Option 2: Local Development Setup

#### Backend Setup (Python)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r ../requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### Frontend Setup (Next.js)
```bash
cd frontend/web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📡 API Endpoints Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat` | `POST` | Multi-turn conversational meteorological LLM reasoning (Groq $\rightarrow$ Gemini fallback) |
| `/api/geocode` | `GET` | Fuzzy reverse & forward geocoding for Indian districts, tehsils, and global locations |
| `/api/weather/current` | `GET` | High-precision WMO current weather observations |
| `/api/weather/forecast` | `GET` | 7-day and 15-day extended agro-meteorological outlook |
| `/api/user/preferences` | `GET` / `PATCH` | Role persona (`Farmer`, `Pilot`, `Disaster Response`, `Citizen`) and language preferences |
| `/health` | `GET` | Container health check and service latency diagnostics |

---

## 👥 Contributors & Credits
- **Project**: WeatherGPT (SIH 2026 Submission)
- **Repository**: [https://github.com/aryan-kumar-singh-cse/weathergpt](https://github.com/aryan-kumar-singh-cse/weathergpt)
- **Branch**: `dev`
