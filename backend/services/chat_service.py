"""
WeatherGPT Chat Service
AI-powered conversational query processing with two-step LLM pipeline:
  Step 1: Intent + entity extraction (LLM with JSON output)
  Step 2: Grounded response generation (LLM with retrieved data as context)
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
import json

from backend.services.llm_service import llm_service

logger = logging.getLogger(__name__)

# Role system prompts for role-aware output
ROLE_PROMPTS = {
    "citizen": """You are WeatherGPT, a friendly weather assistant. Talk like a friend explaining weather to another friend.

    IMPORTANT FORMATTING RULES:
    - Keep responses CONCISE and focused on what the user asked
    - Use simple, everyday language - no technical jargon
    - Format responses with clear paragraphs (use double line breaks between sections)
    - Use **bold** for important points (like warnings or key conditions)
    - Use bullet points (with - ) only when listing 3+ distinct items
    - Say "pressure is normal/high/low" instead of "hPa" numbers
    - Don't mention exact wind directions in degrees (like "270°"), just say "from the west" or "light winds"
    - Focus on what the weather means for daily life, not just the numbers
    - Be conversational and warm, like chatting with a neighbor

    RESPONSE LENGTH GUIDELINES:
    - For current weather: 2-3 short paragraphs MAX
    - For forecasts: Brief summary + key days only
    - NEVER dump all available data - prioritize what matters most

    EXAMPLES OF GOOD RESPONSES:
    ❌ BAD: "Temperature: 27°C (feels like 29°C), Humidity: 90%, Wind: 6 km/h from 135°, Pressure: 1013 hPa"
    ✅ GOOD: "It's a warm evening around 27°C, though it might feel a bit warmer. The humidity is quite high, so it could feel sticky. Winds are light and calm."

    ❌ BAD: Multiple paragraphs with asterisks, sections for "studying outside", "commuting", "homework" when not asked
    ✅ GOOD: "Right now it's 24°C but feels like 28°C due to 90% humidity. The sky's overcast with light winds from the west.\n\nExpect rain tonight and through the weekend, so keep an umbrella handy!"

    Use ONLY the data provided. Highlight any weather you should prepare for.""",

    "farmer": """You are WeatherGPT, an agricultural weather advisor for farmers.
    Provide weather information focused on farming decisions: irrigation, planting, harvesting, pest risk.
    Highlight rainfall timing, soil moisture implications, and crop-specific concerns.
    Use ONLY the data provided. Be specific about how weather affects farm operations.""",

    "pilot": """You are WeatherGPT, an aviation weather briefing assistant for pilots.
    Provide precise meteorological information: visibility, wind shear potential, icing risk,
    ceiling, turbulence indicators, and runway conditions.
    Use ONLY the data provided. Format information clearly for flight planning.
    Emphasize conditions that affect safety margins.""",

    "disaster-manager": """You are WeatherGPT, a disaster response weather intelligence system.
    Provide structured briefings with severity levels, affected areas, timeline, and recommended actions.
    Flag elevated risk thresholds clearly. Use ONLY the data provided.
    Prioritize Urgency > Clarity > Actionability in your output."""
}


class ChatService:
    """
    Chat service implementing the two-step LLM pipeline:
    1. Intent + entity extraction (JSON output from LLM)
    2. Grounded response generation (LLM with weather data as context)
    """

    SUPPORTED_LANGUAGES = ["en", "hi", "ta", "te", "bn", "mr", "kn", "gu", "ml", "pa"]

    def __init__(self):
        self.llm = llm_service

    async def extract_intent(
        self,
        query: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Step 1: Extract intent and entities from natural language query.
        """
        logger.info(f"🔍 INTENT EXTRACTION START - Query: '{query}'")

        system_prompt = (
            f"You are a weather query understanding system. "
            f"You detect the user's language, extract the location they're asking about, "
            f"and classify their intent. Output ONLY valid JSON.\n\n"
            f"Possible intents:\n"
            f"- current: asking about current conditions (temperature, rain, wind right now)\n"
            f"- forecast: asking about future weather (tomorrow, this week, etc.)\n"
            f"- risk_check: asking about weather warnings, alerts, or hazardous conditions\n"
            f"- historical: asking about past weather or climate patterns\n"
            f"- briefing: asking for a comprehensive weather summary\n\n"
            f"If the query doesn't mention a specific location but asks about a state/region/country,\n"
            f"set nationwide=true. Otherwise, extract the place name.\n\n"
            f"Return JSON format:\n"
            f'{{"place": "Mumbai", "language": "en", "intent": "forecast", "nationwide": false}}'
        )

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ]

        try:
            logger.info("📞 Calling LLM for intent extraction...")
            response = await self.llm.call_llm(
                messages=messages,
                temperature=0.3,
                max_tokens=200,
                json_mode=True
            )

            logger.info(f"✅ LLM returned response: {response[:200]}")
            result = json.loads(response)
            result["confidence"] = 0.9
            logger.info(f"✅ Intent extracted successfully: {result}")
            return result

        except (json.JSONDecodeError, KeyError, Exception) as e:
            logger.error(f"❌ Intent extraction failed with error: {type(e).__name__}: {str(e)}")
            logger.warning(f"⚠️ Falling back to keyword matching")
            return self._fallback_intent_extraction(query, language)

    def _fallback_intent_extraction(self, query: str, language: str) -> Dict[str, Any]:
        """Fallback intent extraction using keyword matching."""
        query_lower = query.lower()

        # Intent detection
        if any(kw in query_lower for kw in ["forecast", "tomorrow", "weekend", "next week", "predict"]):
            intent = "forecast"
        elif any(kw in query_lower for kw in ["current", "now", "today", "right now"]):
            intent = "current"
        elif any(kw in query_lower for kw in ["alert", "warning", "danger", "storm", "cyclone", "risk"]):
            intent = "risk_check"
        elif any(kw in query_lower for kw in ["historical", "past", "normal", "average", "trend"]):
            intent = "historical"
        elif any(kw in query_lower for kw in ["summary", "briefing", "overview", "update"]):
            intent = "briefing"
        else:
            intent = "current"

        # Place extraction (common Indian cities)
        place = None
        for city in ["mumbai", "delhi", "chennai", "bangalore", "bengaluru", "kolkata", "hyderabad",
                      "pune", "ahmedabad", "jaipur", "lucknow", "kochi", "goa", "trivandrum",
                      "surat", "bhubaneswar", "coimbatore"]:
            if city in query_lower:
                place = city.title()
                break

        return {
            "place": place or "India",
            "language": language,
            "intent": intent,
            "nationwide": place is None,
            "confidence": 0.6
        }

    def _is_greeting_or_simple_query(self, query: str) -> bool:
        """Detect if the query is a simple greeting or introduction."""
        query_lower = query.lower().strip()

        # Simple greetings
        greetings = [
            'hi', 'hello', 'hey', 'hola', 'namaste', 'good morning', 'good afternoon',
            'good evening', 'greetings', 'howdy', 'sup', 'yo', 'hiya'
        ]

        # Introduction queries
        intros = [
            'who are you', 'what are you', 'what can you do', 'help', 'what is this',
            'tell me about yourself', 'introduce yourself', 'your name'
        ]

        # Check if query is just a greeting (with optional punctuation)
        clean_query = query_lower.rstrip('!?.,')

        if clean_query in greetings:
            return True

        # Check if it's an introduction question
        for intro in intros:
            if intro in query_lower:
                return True

        return False

    async def generate_response(
        self,
        query: str,
        intent: Dict[str, Any],
        weather_data: Dict[str, Any],
        role: str = "citizen",
        language: str = "en",
        occupation: Optional[str] = None
    ) -> str:
        """
        Step 2: Generate grounded response using retrieved weather data.
        """
        logger.info(f"🎯 RESPONSE GENERATION START - Query: '{query}'")
        logger.info(f"👤 Role: {role}, Occupation: {occupation}, Language: {language}")

        role_prompt = ROLE_PROMPTS.get(role, ROLE_PROMPTS["citizen"])

        if occupation:
            role_prompt += f"\n\nUser context: The person asking is a {occupation}. Tailor your response to be relevant to their work and concerns."

        grounding = self._format_grounding(weather_data, intent)
        logger.info(f"📊 Grounding data prepared: {len(grounding)} characters")

        language_prompt = ""
        if language != "en":
            language_prompt = f"\n\nRespond in {language}. Use weather terminology appropriate for that language."

        messages = [
            {"role": "system", "content": role_prompt + language_prompt},
            {"role": "user", "content": query},
            {"role": "assistant", "content": f"Grounding data (do NOT invent values not present here):\n{grounding}"}
        ]

        try:
            logger.info("📞 Calling LLM for response generation...")
            response = await self.llm.call_llm(
                messages=messages,
                temperature=0.7,
                max_tokens=1500,
                json_mode=False
            )

            logger.info(f"✅ LLM returned response: {len(response)} characters")
            logger.info(f"🎯 LLM tier used: {self.llm.last_tier_used}")
            return response.strip()

        except Exception as e:
            logger.error(f"❌ Response generation failed with error: {type(e).__name__}: {str(e)}")
            logger.warning(f"⚠️ Falling back to template response")
            return self._fallback_response(query, intent, weather_data, role, language)

    def _format_grounding(self, weather_data: Dict[str, Any], intent: Dict[str, Any]) -> str:
        """Format weather data as grounding context for the LLM with user-friendly descriptions."""
        lines = []

        # Check if this is historical/climate data
        data_type = weather_data.get("data_type")
        if data_type:
            return self._format_historical_grounding(weather_data, intent)

        current = weather_data.get("current", {})

        # Helper function to describe wind direction
        def wind_direction_text(degrees):
            if degrees == 'N/A' or degrees is None:
                return "calm"
            try:
                deg = float(degrees)
                directions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"]
                idx = round(deg / 45) % 8
                return f"from the {directions[idx]}"
            except:
                return "light"

        # Helper function to describe pressure
        def pressure_text(hpa):
            if hpa == 'N/A' or hpa is None:
                return "normal"
            try:
                p = float(hpa)
                if p < 1000:
                    return "low (stormy conditions possible)"
                elif p > 1020:
                    return "high (stable weather)"
                else:
                    return "normal"
            except:
                return "normal"

        # Helper function to describe humidity
        def humidity_text(humidity):
            if humidity == 'N/A' or humidity is None:
                return "moderate"
            try:
                h = float(humidity)
                if h > 80:
                    return f"high ({h}%, will feel sticky)"
                elif h > 60:
                    return f"comfortable ({h}%)"
                else:
                    return f"low ({h}%, quite dry)"
            except:
                return "moderate"

        lines.append(f"Current conditions:")
        lines.append(f"  Temperature: {current.get('temperature', 'N/A')}°C")
        if current.get('apparent_temperature') and current.get('apparent_temperature') != current.get('temperature'):
            lines.append(f"  Feels like: {current.get('apparent_temperature', 'N/A')}°C")
        lines.append(f"  Humidity: {humidity_text(current.get('humidity'))}")
        lines.append(f"  Wind: {current.get('wind_speed', 'N/A')} km/h {wind_direction_text(current.get('wind_direction'))}")
        lines.append(f"  Pressure: {pressure_text(current.get('pressure'))}")
        if current.get('precipitation', 0) > 0:
            lines.append(f"  Rain: {current.get('precipitation')} mm currently falling")
        lines.append(f"  Conditions: {self._weather_code_description(current.get('weather_code', 'N/A'))}")

        # Severity info
        severity = weather_data.get("severity", {})
        if severity:
            lines.append(f"\nWeather severity: {severity.get('severity', 'normal')}")
            if severity.get("alerts"):
                lines.append(f"Alerts: {', '.join(severity['alerts'])}")

        # Forecast
        forecast_days = weather_data.get("forecast", {}).get("days", [])
        if forecast_days:
            lines.append(f"\nForecast for the next {len(forecast_days)} days:")
            for day in forecast_days[:7]:
                precip_prob = day.get('precipitation_probability', 0)
                rain_text = "likely rain" if precip_prob > 70 else "possible rain" if precip_prob > 40 else "mostly dry"
                lines.append(
                    f"  {day.get('date', 'N/A')}: "
                    f"{day.get('temperature_min', 'N/A')}°C to {day.get('temperature_max', 'N/A')}°C, "
                    f"{rain_text}, "
                    f"winds up to {day.get('wind_speed_max', 0)} km/h"
                )

        lines.append(f"\nData source: {weather_data.get('data_source', 'Open-Meteo')}")

        return "\n".join(lines)

    def _weather_code_description(self, code) -> str:
        """Convert weather code to friendly description."""
        if code == 'N/A' or code is None:
            return "unknown"

        try:
            code = int(code)
            descriptions = {
                0: "clear sky",
                1: "mainly clear",
                2: "partly cloudy",
                3: "overcast",
                45: "foggy",
                48: "foggy with frost",
                51: "light drizzle",
                53: "moderate drizzle",
                55: "dense drizzle",
                61: "slight rain",
                63: "moderate rain",
                65: "heavy rain",
                71: "slight snow",
                73: "moderate snow",
                75: "heavy snow",
                77: "snow grains",
                80: "slight rain showers",
                81: "moderate rain showers",
                82: "violent rain showers",
                85: "slight snow showers",
                86: "heavy snow showers",
                95: "thunderstorm",
                96: "thunderstorm with slight hail",
                99: "thunderstorm with heavy hail"
            }
            return descriptions.get(code, "unknown conditions")
        except:
            return "unknown"

    def _generate_greeting_response(
        self,
        query: str,
        role: str,
        language: str,
        occupation: Optional[str] = None
    ) -> str:
        """Generate a brief, friendly greeting response without weather data dump."""
        query_lower = query.lower().strip()

        # Introduction/help queries
        if any(word in query_lower for word in ['who', 'what', 'help', 'about']):
            if occupation:
                return f"Hi! I'm WeatherGPT, your AI weather assistant. I provide personalized weather insights for {occupation}s. Ask me about current conditions, forecasts, or weather alerts!"
            else:
                return "Hi! I'm WeatherGPT, your AI weather assistant. I can help you with current conditions, forecasts, weather alerts, and personalized insights. What would you like to know?"

        # Simple greetings
        greeting_responses = [
            "Hello! How can I help you with the weather today?",
            "Hi there! What weather information do you need?",
            "Hey! Ask me anything about the weather.",
            "Hello! I'm here to help with weather forecasts and conditions."
        ]

        # Return a simple greeting
        import random
        return random.choice(greeting_responses)

    def _fallback_response(
        self,
        query: str,
        intent: Dict[str, Any],
        weather_data: Dict[str, Any],
        role: str,
        language: str
    ) -> str:
        """Generate a fallback response when LLM fails."""
        current = weather_data.get("current", {})
        temp = current.get("temperature", "N/A")
        humidity = current.get("humidity", "N/A")
        wind = current.get("wind_speed", "N/A")
        precip = current.get("precipitation", "N/A")

        severity = weather_data.get("severity", {})
        alerts = severity.get("alerts", [])

        lang_map = {
            "en": {"greeting": "Here's what the weather looks like", "temp": "It's", "hum": "humidity", "wind": "winds", "rain": "rain"},
            "hi": {"greeting": "मौसम की जानकारी", "temp": "तापमान", "hum": "आर्द्रता", "wind": "हवा", "rain": "वर्षा"},
            "ta": {"greeting": "வானிலை தகவல்", "temp": "வெப்பநிலை", "hum": "ஈரப்பதம்", "wind": "காற்று", "rain": "மழை"},
        }
        lang = lang_map.get(language, lang_map["en"])

        # Describe humidity
        humidity_desc = ""
        try:
            h = float(humidity)
            if h > 80:
                humidity_desc = "high humidity (might feel sticky)"
            elif h > 60:
                humidity_desc = "comfortable humidity"
            else:
                humidity_desc = "low humidity (quite dry)"
        except:
            humidity_desc = f"{humidity}% humidity"

        # Simple friendly format
        response = f"{lang['greeting']}:\n\n"
        response += f"Right now it's around {temp}°C"

        if humidity != "N/A":
            response += f" with {humidity_desc}"

        if wind != "N/A":
            try:
                w = float(wind)
                if w < 10:
                    response += f". Winds are light and calm"
                elif w < 30:
                    response += f". Moderate winds around {wind} km/h"
                else:
                    response += f". Strong winds at {wind} km/h"
            except:
                response += f". Winds at {wind} km/h"

        response += "."

        if precip != "N/A" and precip != 0:
            response += "\n\nCurrently experiencing some rain."

        if alerts:
            response += f"\n\n⚠️ Weather alerts: {', '.join(alerts)}"

        response += "\n\n(Weather data from Open-Meteo)"

        return response

    def get_supported_languages(self) -> List[str]:
        """Get list of supported language codes."""
        return self.SUPPORTED_LANGUAGES

    def get_language_names(self) -> Dict[str, str]:
        """Get language codes mapped to human-readable names."""
        names = {
            "en": "English",
            "hi": "हिन्दी (Hindi)",
            "ta": "தமிழ் (Tamil)",
            "te": "తెలుగు (Telugu)",
            "bn": "বাংলা (Bengali)",
            "mr": "मराठी (Marathi)",
            "kn": "ಕನ್ನಡ (Kannada)",
            "gu": "ગુજરાતી (Gujarati)",
            "ml": "മലയാളം (Malayalam)",
            "pa": "ਪੰਜਾਬੀ (Punjabi)",
        }
        return names

    def _format_historical_grounding(self, weather_data: Dict[str, Any], intent: Dict[str, Any]) -> str:
        """Format historical/climate data as grounding context for the LLM."""
        lines = []
        data_type = weather_data.get("data_type")

        if data_type == "monsoon_comparison":
            lines.append("Monsoon Onset Analysis:")
            current = weather_data.get("current", {})
            historical = weather_data.get("historical", {})
            lines.append(f"  Current year ({current.get('year')}): {current.get('onset_date', 'not yet detected')}")
            lines.append(f"  Historical average ({historical.get('period')}): {historical.get('average_onset_date', 'N/A')}")
            lines.append(f"  Comparison: {weather_data.get('comparison', 'N/A')}")

        elif data_type == "temperature_trend":
            period = weather_data.get("period", {})
            trend = weather_data.get("trend", {})
            lines.append(f"Temperature Trend Analysis ({period.get('start_year')}-{period.get('end_year')}):")
            lines.append(f"  Trend: {trend.get('trend', 'N/A')}")
            lines.append(f"  Change per decade: {trend.get('change_per_decade', 'N/A')}°C")

            yearly = weather_data.get("yearly_averages", [])
            if yearly:
                lines.append(f"\n  Recent yearly averages:")
                for year_data in yearly[-5:]:  # Last 5 years
                    lines.append(f"    {year_data.get('year')}: {year_data.get('avg_temperature', 'N/A')}°C average")

        elif data_type == "current_vs_historical":
            month = weather_data.get("month", {})
            lines.append(f"Current vs Historical Comparison for {month.get('name', 'N/A')} {month.get('year')}:")
            lines.append(f"  Current month average: {weather_data.get('current_average', 'N/A')}°C")
            lines.append(f"  Historical average: {weather_data.get('historical_average', 'N/A')}°C")
            lines.append(f"  Comparison: {weather_data.get('comparison', 'N/A')}")

        elif data_type == "extreme_events":
            year = weather_data.get("year")
            temp_extremes = weather_data.get("temperature_extremes", {})
            precip_extremes = weather_data.get("precipitation_extremes", {})

            lines.append(f"Extreme Weather Events in {year}:")
            lines.append(f"\n  Temperature Extremes:")
            lines.append(f"    Hottest day: {temp_extremes.get('hottest_day_temp', 'N/A')}°C")
            lines.append(f"    Coldest day: {temp_extremes.get('coldest_day_temp', 'N/A')}°C")
            lines.append(f"    Extreme heat days (≥40°C): {temp_extremes.get('extreme_heat_days', 0)} days")
            lines.append(f"    Cold days (≤10°C): {temp_extremes.get('cold_days', 0)} days")

            lines.append(f"\n  Precipitation Extremes:")
            lines.append(f"    Total annual rainfall: {precip_extremes.get('total_annual_rainfall', 'N/A')} mm")
            lines.append(f"    Maximum daily rainfall: {precip_extremes.get('max_daily_rainfall', 'N/A')} mm")
            lines.append(f"    Heavy rain days (≥50mm): {precip_extremes.get('heavy_rain_days', 0)} days")
            lines.append(f"    Very heavy rain days (≥100mm): {precip_extremes.get('very_heavy_rain_days', 0)} days")

        lines.append(f"\nData source: {weather_data.get('data_source', 'Open-Meteo Historical Archive')}")
        return "\n".join(lines)

    def get_roles(self) -> List[Dict[str, str]]:
        """Get available user roles for role-aware output."""
        return [
            {"id": "citizen", "name": "Citizen", "description": "General weather information"},
            {"id": "farmer", "name": "Farmer", "description": "Agricultural weather advisory"},
            {"id": "pilot", "name": "Pilot", "description": "Aviation weather briefing"},
            {"id": "disaster-manager", "name": "Disaster Manager", "description": "Emergency weather briefing"},
        ]


# Global instance
chat_service = ChatService()


if __name__ == "__main__":
    import asyncio

    async def demo():
        # Test intent extraction
        queries = [
            "Will it rain in Mumbai tomorrow?",
            "What's the current temperature in Delhi?",
            "Are there any weather warnings for Chennai?",
            "Give me a weather summary for this week in Bangalore",
        ]

        for query in queries:
            print(f"\nQuery: {query}")
            intent = await chat_service.extract_intent(query)
            print(f"Intent: {intent}")

    asyncio.run(demo())
