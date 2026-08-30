"""
WeatherGPT - Quick Start Server
Run this file to start the API
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn

# Create app
app = FastAPI(
    title="WeatherGPT API",
    description="AI-powered conversational weather forecasting platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to WeatherGPT API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/api/v1/status")
async def status():
    return {
        "service": "WeatherGPT",
        "status": "operational",
        "endpoints": {
            "/api/v1/weather/current": "Get current weather",
            "/api/v1/weather/forecast/daily": "Get 7-day forecast",
            "/api/v1/chat": "Send weather query",
            "/api/v1/alerts": "Get active alerts"
        }
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
