"""
WeatherGPT Ask Endpoint
Main conversational entrypoint - implements the three-layer query pipeline
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime
import logging
from sqlalchemy.orm import Session

from backend.services import (
    chat_service,
    geocoding_service,
    weather_service,
    llm_service,
    GeocodingError
)
from backend.services.climate_service import climate_service
from backend.services.conversation_service import conversation_service
from backend.services.auth_service import auth_service
from backend.models.db_config import get_db_dependency

logger = logging.getLogger(__name__)

router = APIRouter()


async def _fetch_historical_data(
    lat: float,
    lng: float,
    query: str,
    intent: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Fetch historical climate data based on query intent.

    Args:
        lat: Latitude
        lng: Longitude
        query: User's original query
        intent: Extracted intent information

    Returns:
        Dict with historical weather data formatted for response generation
    """
    query_lower = query.lower()

    # Detect specific historical query types
    if any(kw in query_lower for kw in ["monsoon", "rainfall onset", "rain start"]):
        # Monsoon onset comparison
        monsoon_data = await climate_service.compare_monsoon_onset(lat, lng)
        return {
            "data_type": "monsoon_comparison",
            "location": monsoon_data["location"],
            "current": monsoon_data["current_year"],
            "historical": monsoon_data["historical_average"],
            "comparison": monsoon_data["comparison"],
            "data_source": monsoon_data["data_source"]
        }

    elif any(kw in query_lower for kw in ["trend", "warming", "cooling", "change over", "past", "years"]):
        # Temperature trend analysis
        years = 10  # default
        if "5 year" in query_lower:
            years = 5
        elif "20 year" in query_lower:
            years = 20

        trend_data = await climate_service.analyze_temperature_trend(lat, lng, years=years)
        return {
            "data_type": "temperature_trend",
            "location": trend_data["location"],
            "period": trend_data["period"],
            "yearly_averages": trend_data["yearly_averages"],
            "trend": trend_data["trend"],
            "data_source": trend_data["data_source"]
        }

    elif any(kw in query_lower for kw in ["compare", "vs", "versus", "normal", "average", "typical"]):
        # Current vs historical comparison
        metric = "precipitation" if any(kw in query_lower for kw in ["rain", "rainfall", "precipitation"]) else "temperature"
        comparison_data = await climate_service.compare_current_to_historical(lat, lng, metric=metric)
        return {
            "data_type": "current_vs_historical",
            "location": comparison_data["location"],
            "metric": comparison_data["metric"],
            "month": comparison_data["month"],
            "current_average": comparison_data["current_average"],
            "historical_average": comparison_data["historical_average"],
            "difference": comparison_data["difference"],
            "comparison": comparison_data["comparison"],
            "data_source": comparison_data["data_source"]
        }

    elif any(kw in query_lower for kw in ["extreme", "hottest", "coldest", "record", "maximum", "minimum"]):
        # Extreme events analysis
        year = None
        if "last year" in query_lower:
            year = datetime.now().year - 1
        elif "this year" in query_lower:
            year = datetime.now().year

        extreme_data = await climate_service.analyze_extreme_events(lat, lng, year=year)
        return {
            "data_type": "extreme_events",
            "location": extreme_data["location"],
            "year": extreme_data["year"],
            "temperature_extremes": extreme_data["temperature_extremes"],
            "precipitation_extremes": extreme_data["precipitation_extremes"],
            "data_source": extreme_data["data_source"]
        }

    else:
        # Default: current vs historical comparison
        comparison_data = await climate_service.compare_current_to_historical(lat, lng, metric="temperature")
        return {
            "data_type": "current_vs_historical",
            "location": comparison_data["location"],
            "metric": comparison_data["metric"],
            "month": comparison_data["month"],
            "current_average": comparison_data["current_average"],
            "historical_average": comparison_data["historical_average"],
            "difference": comparison_data["difference"],
            "comparison": comparison_data["comparison"],
            "data_source": comparison_data["data_source"]
        }


class AskRequest(BaseModel):
    """Request model for /api/ask endpoint."""
    query: str
    email: str  # Required for authentication and rate limiting
    language: str = "en"
    role: str = "citizen"
    location: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    location_hint: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None  # Optional session ID in body
    history: Optional[List[Dict[str, Any]]] = None


class AskResponse(BaseModel):
    """Response model for /api/ask endpoint."""
    query: str
    intent: Dict[str, Any]
    weather: Dict[str, Any]
    severity: Dict[str, Any]
    response: str
    language: str
    role: str
    grounding_source: str
    llm_tier_used: Optional[str]
    timestamp: str


@router.post("/ask", response_model=AskResponse)
async def ask_weather_question(
    request: AskRequest,
    session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    db: Session = Depends(get_db_dependency)
):
    """
    Process a natural language weather query with shared team LLM keys and role awareness.
    """
    start_time = datetime.utcnow()
    effective_session_id = session_id or request.session_id or f"anon-{datetime.utcnow().timestamp()}"

    if not request.query or not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    if not request.email or not request.email.strip():
        raise HTTPException(status_code=401, detail="Email is required. Please login first.")

    # Check if user exists or auto-create seamlessly
    user = auth_service.get_user(request.email, db)
    if not user:
        user = auth_service.login_or_create_user(
            email=request.email,
            occupation=request.role.title(),
            location=request.location or "Delhi",
            preferred_language=request.language or "en",
            db=db
        )

    # Check rate limit (1000/day for default web users, standard limit for others)
    max_questions = 1000 if request.email.endswith("@weathergpt.local") else settings.MAX_QUESTIONS_PER_DAY
    is_allowed, requests_made, requests_remaining = auth_service.check_rate_limit(
        email=request.email,
        endpoint="/api/v1/ask",
        db=db,
        max_requests=max_questions
    )

    if not is_allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Daily question limit reached. You've asked {requests_made} questions in the last 24 hours. Please try again later."
        )

    # Log this API usage for rate limiting
    auth_service.log_usage(
        email=request.email,
        endpoint="/api/v1/ask",
        db=db
    )

    if request.role not in ["citizen", "farmer", "pilot", "disaster-manager"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid role. Must be one of: citizen, farmer, pilot, disaster-manager"
        )

    if request.language not in chat_service.get_supported_languages():
        logger.warning(f"Unsupported language '{request.language}', falling back to English")
        request.language = "en"

    try:
        # Step 1: Extract intent + entities (LLM call #1) with multi-turn memory
        logger.info(f"Processing query: '{request.query}' (role={request.role}, lang={request.language})")
        intent = await chat_service.extract_intent(
            request.query,
            request.language,
            history=request.history
        )

        # Step 2a: Geocode the place
        explicit_place = intent.get("place")
        generic_words = ["india", "here", "current", "today", "now", "nationwide", "this place"]

        if request.lat is not None and request.lng is not None:
            lat = float(request.lat)
            lng = float(request.lng)
            place_name = request.location or explicit_place or "Your Location"
            place_info = {
                "lat": lat,
                "lng": lng,
                "place_name": place_name,
                "city": place_name,
                "state": "",
                "country": "India",
                "source": "client_coordinates"
            }
        elif intent.get("nationwide") and not request.location:
            lat, lng = 20.5937, 78.9629
            place_info = {
                "lat": lat,
                "lng": lng,
                "place_name": "India",
                "state": "",
                "country": "India",
                "source": "default"
            }
        else:
            if explicit_place and explicit_place.lower() not in generic_words:
                place_name = explicit_place
            else:
                place_name = (
                    request.location
                    or (request.location_hint.get("place_name") if request.location_hint else None)
                    or user.location
                    or "Delhi"
                )

            try:
                place_info = await geocoding_service.geocode(place_name)
                lat, lng = place_info["lat"], place_info["lng"]
            except GeocodingError as e:
                logger.error(f"Geocoding failed for {place_name}: {e}, falling back to Delhi")
                place_info = await geocoding_service.geocode("Delhi")
                lat, lng = place_info["lat"], place_info["lng"]

        # Step 2b: Fetch weather data based on intent
        if intent.get("intent") == "historical":
            historical_data = await _fetch_historical_data(
                lat=lat,
                lng=lng,
                query=request.query,
                intent=intent
            )
            weather_data = historical_data
            severity = {"severity": "normal", "alerts": [], "alert_count": 0}
        else:
            weather_data = await weather_service.fetch_weather(lat, lng)
            weather_data["place_info"] = place_info
            severity = weather_service.classify_severity(weather_data)

        # Step 3: Generate grounded response (LLM call #2) with conversation history
        combined_data = {
            **weather_data,
            "severity": severity,
            "place_info": place_info
        }

        response_text = await chat_service.generate_response(
            query=request.query,
            intent=intent,
            weather_data=combined_data,
            role=request.role,
            language=request.language,
            occupation=user.occupation,
            history=request.history
        )

        # Build response
        end_time = datetime.utcnow()
        processing_time = (end_time - start_time).total_seconds()

        logger.info(f"Query processed in {processing_time:.2f}s using LLM tier: {llm_service.last_tier_used}")

        # Save conversation history to database
        try:
            # Save user message
            conversation_service.add_message(
                session_id=effective_session_id,
                role="user",
                content=request.query,
                db=db,
                user_role=request.role,
                user_language=request.language,
                user_location=place_info.get("place_name")
            )

            # Save assistant response
            conversation_service.add_message(
                session_id=effective_session_id,
                role="assistant",
                content=response_text,
                db=db,
                query_metadata=intent,
                weather_data=weather_data,
                llm_tier_used=llm_service.last_tier_used,
                user_role=request.role,
                user_language=request.language,
                user_location=place_info.get("place_name")
            )

            # Update user preferences
            conversation_service.update_user_preferences(
                session_id=effective_session_id,
                db=db,
                language=request.language,
                role=request.role,
                location=place_info.get("place_name")
            )

            logger.info(f"Conversation history saved for session: {effective_session_id}")
        except Exception as e:
            # Don't fail the request if history saving fails
            logger.warning(f"Failed to save conversation history: {e}")

        return AskResponse(
            query=request.query,
            intent=intent,
            weather=weather_data,
            severity=severity,
            response=response_text,
            language=request.language,
            role=request.role,
            grounding_source="Open-Meteo",
            llm_tier_used=llm_service.last_tier_used,
            timestamp=end_time.isoformat()
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing query: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process weather query: {str(e)}"
        )


@router.get("/ask/capabilities")
async def get_ask_capabilities():
    """
    Get capabilities of the /ask endpoint.

    Returns:
        Dict with supported languages, roles, and features
    """
    return {
        "supported_languages": chat_service.get_supported_languages(),
        "language_names": chat_service.get_language_names(),
        "supported_roles": chat_service.get_roles(),
        "features": [
            "Natural language query understanding",
            "Intent + entity extraction",
            "Live Open-Meteo data grounding",
            "Role-aware response generation",
            "Multilingual support (10 Indian languages)",
            "Severity classification",
            "Three-tier LLM provider fallback"
        ],
        "llm_tiers": llm_service.get_tier_info(),
        "data_source": "Open-Meteo API",
        "geocoding_source": "Nominatim (OpenStreetMap)"
    }


@router.get("/ask/examples")
async def get_example_queries():
    """
    Get example queries that work well with the /ask endpoint.

    Returns:
        Dict with example queries by category
    """
    return {
        "examples": {
            "current_weather": [
                "What's the weather like in Mumbai?",
                "Current temperature in Delhi",
                "How's the weather in Bangalore today?",
                "Is it raining in Chennai right now?"
            ],
            "forecast": [
                "Will it rain in Hyderabad tomorrow?",
                "What's the forecast for Pune this weekend?",
                "Weather prediction for Kolkata next week",
                "How hot will it be in Jaipur tomorrow?"
            ],
            "alerts": [
                "Any weather warnings for Mumbai?",
                "Are there storm alerts in my area?",
                "Is there a heat wave warning?",
                "Check for weather alerts in Chennai"
            ],
            "role_specific": {
                "farmer": [
                    "Should I irrigate my fields today in Nashik?",
                    "Is it good weather for planting in Aurangabad?",
                    "What's the rainfall forecast for my crops?"
                ],
                "pilot": [
                    "Flight weather briefing for Mumbai airport",
                    "What's the visibility and wind in Delhi?",
                    "Are there any weather hazards for flying today?"
                ],
                "disaster_manager": [
                    "Weather situation report for coastal Karnataka",
                    "Heavy rain risk assessment for Maharashtra",
                    "Emergency weather briefing for Tamil Nadu"
                ]
            },
            "multilingual": [
                "मुंबई में मौसम कैसा है? (Hindi)",
                "சென்னையில் மழை பெய்யுமா? (Tamil)",
                "ముంబై లో వాతావరణం ఎలా ఉంది? (Telugu)",
                "কলকাতায় আবহাওয়া কেমন? (Bengali)"
            ],
            "historical_climate": [
                "Compare this year's monsoon onset to historical average for Mumbai",
                "Show temperature trend for Delhi over past 10 years",
                "How does this month's rainfall in Chennai compare to normal?",
                "What were the extreme weather events in Bangalore this year?",
                "Is it warmer this year than the historical average in Kolkata?",
                "Temperature changes in Hyderabad over the last decade"
            ]
        }
    }
