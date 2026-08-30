"""
WeatherGPT - Main FastAPI Application
AI-powered conversational weather forecasting platform
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from typing import List, Optional
from datetime import datetime
import uvicorn
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import routes
from backend.api.routes import (
    ask,
    weather,
    alerts,
    forecasts,
    climate,
    voice,
    nwp,
    chat,
    locations,
    conversations,
    sms_alerts,
    login
)

# Initialize database
from backend.models.db_config import init_db

app = FastAPI(
    title="WeatherGPT API",
    description="AI-powered conversational weather forecasting platform with role-aware responses",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database and services on startup."""
    logger.info("Starting WeatherGPT API...")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

    # Initialize alert monitoring
    try:
        from backend.services.alert_watcher import alert_watcher, initialize_default_monitoring
        await initialize_default_monitoring()
        await alert_watcher.start()
        logger.info("Alert monitoring system started successfully")
    except Exception as e:
        logger.error(f"Failed to start alert monitoring: {e}")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down WeatherGPT API...")
    try:
        from backend.services.alert_watcher import alert_watcher
        await alert_watcher.stop()
        logger.info("Alert monitoring system stopped successfully")
    except Exception as e:
        logger.error(f"Error stopping alert monitoring: {e}")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(login.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(ask.router, prefix="/api/v1", tags=["Ask (Main Endpoint)"])
app.include_router(weather.router, prefix="/api/v1", tags=["Weather"])
app.include_router(alerts.router, prefix="/api/v1", tags=["Alerts"])
app.include_router(forecasts.router, prefix="/api/v1", tags=["Forecasts"])
app.include_router(climate.router, prefix="/api/v1", tags=["Climate"])
app.include_router(voice.router, prefix="/api/v1", tags=["Voice"])
app.include_router(nwp.router, prefix="/api/v1", tags=["NWP Models"])
app.include_router(chat.router, prefix="/api/v1", tags=["Chat/Conversational"])
app.include_router(locations.router, prefix="/api/v1", tags=["Locations"])
app.include_router(conversations.router, prefix="/api/v1", tags=["Conversations"])
app.include_router(sms_alerts.router, prefix="/api/v1", tags=["SMS Alerts"])


@app.get("/")
async def root():
    """Root endpoint - API information."""
    return {
        "message": "Welcome to WeatherGPT API",
        "version": "1.0.0",
        "status": "operational",
        "documentation": {
            "interactive": "/docs",
            "redoc": "/redoc"
        },
        "main_endpoint": "/api/v1/ask",
        "features": [
            "Natural language weather queries",
            "Role-aware responses (citizen/farmer/pilot/disaster-manager)",
            "Multilingual support (10 Indian languages)",
            "Live Open-Meteo data integration",
            "Three-tier LLM provider fallback",
            "Severity classification and alerts"
        ]
    }


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "WeatherGPT API"
    }


@app.get("/api/v1/status")
async def get_service_status():
    """Get overall service status and integration health."""
    from backend.services import llm_service, weather_service, geocoding_service

    return {
        "service": "WeatherGPT",
        "version": "1.0.0",
        "status": "operational",
        "integrations": {
            "llm": llm_service.get_tier_info(),
            "weather_data": {
                "provider": "Open-Meteo",
                "status": "connected"
            },
            "geocoding": {
                "provider": "Nominatim (OpenStreetMap)",
                "status": "connected",
                "fallback_cities": 16
            }
        },
        "capabilities": {
            "languages": 10,
            "roles": 4,
            "data_source": "Open-Meteo (live)",
            "grounding": "enabled",
            "fallback_chain": "3-tier"
        },
        "uptime": "operational",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.exception_handler(404)
async def not_found_handler(request, exc):
    """Custom 404 handler."""
    return JSONResponse(
        status_code=404,
        content={
            "error": "Endpoint not found",
            "message": "The requested endpoint does not exist",
            "documentation": "/docs",
            "main_endpoint": "/api/v1/ask"
        }
    )


@app.exception_handler(500)
async def internal_error_handler(request, exc):
    """Custom 500 handler."""
    logger.error(f"Internal server error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again."
        }
    )


if __name__ == "__main__":
    uvicorn.run(
        "backend.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
