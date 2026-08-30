"""
WeatherGPT Chat Routes
Conversational AI interface for weather queries
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

from backend.api.routes.ask import AskRequest, AskResponse
from backend.services import chat_service, llm_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat/Conversational"])


@router.get("/")
async def get_chat_info():
    """Get chat service information."""
    return {
        "service": "WeatherGPT Chat API",
        "version": "1.0.0",
        "description": "AI-powered conversational weather assistant",
        "features": [
            "Natural language query processing",
            "Multilingual support",
            "Context-aware responses",
            "Weather data integration",
            "Role-aware output",
            "Three-tier LLM fallback"
        ],
        "supported_languages": chat_service.get_supported_languages(),
        "language_names": chat_service.get_language_names(),
        "supported_roles": chat_service.get_roles(),
        "main_endpoint": "POST /api/v1/ask",
        "llm_tiers": llm_service.get_tier_info()
    }


@router.post("/query", response_model=AskResponse)
async def process_weather_query(
    query: str,
    location: Optional[dict] = None,
    language: Optional[str] = "en",
    role: Optional[str] = "citizen",
    user_id: Optional[str] = None
):
    """
    Process a natural language weather query.
    Delegates to the main /ask endpoint.

    Args:
        query: User's weather question
        location: Optional location context {city: "Mumbai", lat: 19.076, lng: 72.8777}
        language: Preferred language for response
        role: User role for role-aware output (citizen/farmer/pilot/disaster-manager)
        user_id: Optional user identifier

    Returns:
        Full AskResponse with weather data and grounded response
    """
    if not query or not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    if role not in ["citizen", "farmer", "pilot", "disaster-manager"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be one of: citizen, farmer, pilot, disaster-manager"
        )

    # Build request and delegate to ask endpoint
    from backend.api.routes.ask import ask_weather_question
    request = AskRequest(
        query=query,
        language=language,
        role=role,
        location_hint=location
    )

    return await ask_weather_question(request)


@router.post("/stream")
async def stream_chat_response(
    query: str,
    location: Optional[dict] = None,
    language: Optional[str] = "en",
    role: Optional[str] = "citizen",
    user_id: Optional[str] = None
):
    """
    Stream chat responses for real-time interaction.
    (Currently returns full response - streaming not yet implemented)

    Args:
        query: User's weather question
        location: Optional location context
        language: Preferred language
        role: User role
        user_id: Optional user identifier
    """
    from fastapi.responses import StreamingResponse
    import json

    async def generate():
        try:
            # Process query
            request = AskRequest(
                query=query,
                language=language,
                role=role,
                location_hint=location
            )
            from backend.api.routes.ask import ask_weather_question
            result = await ask_weather_question(request)

            # Yield response as streamed chunks
            yield json.dumps({"type": "start", "timestamp": datetime.utcnow().isoformat()})
            yield json.dumps({"type": "content", "data": result.response})
            yield json.dumps({"type": "complete", "response": result.model_dump()})
        except Exception as e:
            yield json.dumps({
                "type": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            })

    return StreamingResponse(
        generate(),
        media_type="application/x-ndjson",
        status_code=200
    )


@router.get("/supported-queries")
async def get_supported_queries():
    """Get list of example queries users can ask."""
    from backend.api.routes.ask import get_example_queries
    return await get_example_queries()


@router.get("/history")
async def get_chat_history(
    user_id: str,
    limit: int = 50,
    language: Optional[str] = None
):
    """
    Get chat history for a user.
    In production, this would query the database.
    """
    # Placeholder implementation
    return {
        "user_id": user_id,
        "count": 0,
        "messages": [],
        "language": language,
        "note": "Chat history not yet implemented - stateless for demo"
    }


@router.post("/voice")
async def process_voice_query(
    audio_data: bytes,
    language: Optional[str] = "hi",
    location: Optional[dict] = None
):
    """
    Process voice query (Speech-to-Text integration).

    Args:
        audio_data: Audio data in WAV or MP3 format
        language: Language of the audio
        location: Optional location context

    Returns:
        Mock response for demo (STT/TTS not yet implemented)
    """
    return {
        "status": "success",
        "message": "Voice query received (demo mode - STT/TTS not yet implemented)",
        "language": language,
        "location": location,
        "processing": {
            "stt_required": True,
            "tts_response": True,
            "estimated_time_ms": 5000
        }
    }


@router.get("/capabilities")
async def get_chat_capabilities():
    """Get chat service capabilities."""
    return {
        "capabilities": {
            "natural_language_understanding": True,
            "multilingual_support": True,
            "voice_interaction": False,  # Not yet implemented
            "real_time_data": True,
            "alert_awareness": True,
            "context_awareness": False,  # Stateless for demo
            "location_based": True,
            "agricultural_advice": True,
            "climate_analysis": True,
            "role_aware_output": True,
            "llm_fallback_chain": True
        },
        "supported_languages": [
            {"code": code, "name": name}
            for code, name in chat_service.get_language_names().items()
        ],
        "supported_roles": chat_service.get_roles(),
        "weather_parameters": [
            "temperature",
            "humidity",
            "wind_speed",
            "precipitation",
            "pressure",
            "visibility",
            "uv_index",
            "cloud_cover"
        ],
        "alert_types": [
            "cyclone",
            "flood",
            "heatwave",
            "heavy_rain",
            "storm",
            "fog",
            "drought",
            "high_wind",
            "frost"
        ],
        "llm_tiers": llm_service.get_tier_info()
    }