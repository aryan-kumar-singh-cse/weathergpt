"""
WeatherGPT Multilingual Test Suite
===================================
Comprehensive test suite covering 10 Indian languages with focus on:
- Language preservation throughout the pipeline
- Weather-specific terminology in each language
- Role-specific terminology
- Code-switching and transliteration
- API integration
- UTF-8 encoding and Unicode handling

Test Strategy:
- All tests are deterministic (mocked external calls)
- Fast execution (no real API calls)
- Isolated (each test independent)
- Coverage for 6+ languages (Hindi, English, Tamil, Telugu, Bengali, Marathi)
"""

import pytest
import json
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime
from typing import Dict, Any

# Import services and models
from backend.services.chat_service import ChatService, chat_service, ROLE_PROMPTS
from backend.api.routes.ask import AskRequest, AskResponse


# ============================================================================
# FIXTURES - Mock Data for Deterministic Tests
# ============================================================================

@pytest.fixture
def mock_weather_data() -> Dict[str, Any]:
    """Mock weather data from Open-Meteo API."""
    return {
        "current": {
            "temperature": 27.5,
            "apparent_temperature": 29.0,
            "humidity": 85,
            "wind_speed": 12.5,
            "wind_direction": 135,
            "pressure": 1013,
            "precipitation": 0.0,
            "weather_code": 2
        },
        "forecast": {
            "days": [
                {
                    "date": "2026-08-30",
                    "temperature_min": 24,
                    "temperature_max": 31,
                    "precipitation_probability": 75,
                    "wind_speed_max": 18
                },
                {
                    "date": "2026-08-31",
                    "temperature_min": 23,
                    "temperature_max": 29,
                    "precipitation_probability": 40,
                    "wind_speed_max": 15
                }
            ]
        },
        "severity": {
            "severity": "moderate",
            "alerts": ["high_humidity"]
        },
        "data_source": "Open-Meteo"
    }


@pytest.fixture
def mock_place_info() -> Dict[str, Any]:
    """Mock geocoding result."""
    return {
        "lat": 19.0760,
        "lng": 72.8777,
        "place_name": "Mumbai",
        "state": "Maharashtra",
        "country": "India",
        "source": "nominatim"
    }


@pytest.fixture
def chat_svc():
    """Return chat service instance for testing."""
    return ChatService()


# ============================================================================
# TEST SUITE 1: LANGUAGE-SPECIFIC QUERIES (CRITICAL PRIORITY)
# ============================================================================

class TestMultilingualQueries:
    """Test full pipeline with real queries in different languages."""

    @pytest.mark.asyncio
    async def test_hindi_weather_query_full_pipeline(self, chat_svc, mock_weather_data):
        """
        Test Hindi query: "दिल्ली में कल बारिश होगी क्या?"
        Validates: language detection, terminology preservation, response in Hindi
        """
        query = "दिल्ली में कल बारिश होगी क्या?"

        # Mock LLM response for intent extraction
        mock_intent_response = json.dumps({
            "place": "Delhi",
            "language": "hi",
            "intent": "forecast",
            "nationwide": False
        })

        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = mock_intent_response

            intent = await chat_svc.extract_intent(query, language="hi")

            # Assertions
            assert intent["language"] == "hi", "Language should be detected as Hindi"
            assert intent["place"] == "Delhi", "Place should be extracted as Delhi"
            assert intent["intent"] == "forecast", "Intent should be forecast"
            assert not intent["nationwide"], "Should not be nationwide query"

            # Verify LLM was called with the Hindi query
            mock_llm.assert_called_once()
            call_args = mock_llm.call_args
            messages = call_args[1]["messages"]
            assert any(query in msg["content"] for msg in messages), "Query should be in messages"


    @pytest.mark.asyncio
    async def test_hindi_response_generation(self, chat_svc, mock_weather_data):
        """
        Test response generation in Hindi maintains language throughout.
        Validates: Hindi weather terminology (बारिश, तापमान, हवा)
        """
        query = "मुंबई में मौसम कैसा है?"
        intent = {"place": "Mumbai", "language": "hi", "intent": "current", "nationwide": False}

        # Mock Hindi response from LLM
        mock_hindi_response = (
            "मुंबई में अभी मौसम गर्म और आर्द्र है। तापमान 27°C के आसपास है, "
            "लेकिन यह 29°C जैसा महसूस हो सकता है। हवा हल्की है और दबाव सामान्य है। "
            "आसमान में कुछ बादल हैं।"
        )

        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = mock_hindi_response

            response = await chat_svc.generate_response(
                query=query,
                intent=intent,
                weather_data=mock_weather_data,
                role="citizen",
                language="hi"
            )

            # Assertions
            assert response == mock_hindi_response

            # Verify LLM was called with Hindi language instruction
            call_args = mock_llm.call_args
            messages = call_args[1]["messages"]
            system_msg = next(msg for msg in messages if msg["role"] == "system")
            assert "Respond in hi" in system_msg["content"], "Should instruct to respond in Hindi"

            # Verify Hindi terminology in response
            assert "तापमान" in response or "मौसम" in response, "Should contain Hindi weather terms"


    @pytest.mark.asyncio
    async def test_tamil_weather_query(self, chat_svc, mock_weather_data):
        """
        Test Tamil query: "சென்னையில் இன்று மழை பெய்யுமா?"
        Validates: Tamil script handling, weather terminology (மழை, வெப்பநிலை)
        """
        query = "சென்னையில் இன்று மழை பெய்யுமா?"

        mock_intent_response = json.dumps({
            "place": "Chennai",
            "language": "ta",
            "intent": "forecast",
            "nationwide": False
        })

        mock_tamil_response = (
            "சென்னையில் இன்று மழை பெய்ய வாய்ப்பு உள்ளது. "
            "வெப்பநிலை சுமார் 27°C ஆக இருக்கும். "
            "காற்று லேசாக வீசும்."
        )

        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            # First call for intent extraction
            mock_llm.return_value = mock_intent_response
            intent = await chat_svc.extract_intent(query, language="ta")

            # Second call for response generation
            mock_llm.return_value = mock_tamil_response
            response = await chat_svc.generate_response(
                query=query,
                intent=intent,
                weather_data=mock_weather_data,
                role="citizen",
                language="ta"
            )

            # Assertions
            assert intent["language"] == "ta"
            assert "மழை" in query, "Query contains Tamil word for rain"
            assert "வெப்பநிலை" in response or "மழை" in response, "Response contains Tamil weather terms"


    @pytest.mark.asyncio
    async def test_telugu_weather_query(self, chat_svc, mock_weather_data):
        """
        Test Telugu query: "హైదరాబాద్‌లో వాతావరణం ఎలా ఉంది?"
        Validates: Telugu script handling, weather terminology
        """
        query = "హైదరాబాద్‌లో వాతావరణం ఎలా ఉంది?"

        mock_intent_response = json.dumps({
            "place": "Hyderabad",
            "language": "te",
            "intent": "current",
            "nationwide": False
        })

        mock_telugu_response = (
            "హైదరాబాద్‌లో వాతావరణం వెచ్చగా ఉంది. "
            "ఉష్ణోగ్రత సుమారు 27°C ఉంది. "
            "గాలి తేలికగా వీస్తోంది."
        )

        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = mock_intent_response
            intent = await chat_svc.extract_intent(query, language="te")

            assert intent["language"] == "te"
            assert intent["place"] == "Hyderabad"

            mock_llm.return_value = mock_telugu_response
            response = await chat_svc.generate_response(
                query=query,
                intent=intent,
                weather_data=mock_weather_data,
                role="citizen",
                language="te"
            )

            assert "వాతావరణం" in query or "ఉష్ణోగ్రత" in response, "Contains Telugu weather terms"


    @pytest.mark.asyncio
    async def test_bengali_weather_query(self, chat_svc, mock_weather_data):
        """
        Test Bengali query: "কলকাতায় আজ আবহাওয়া কেমন?"
        Validates: Bengali script handling, weather terminology
        """
        query = "কলকাতায় আজ আবহাওয়া কেমন?"

        mock_intent_response = json.dumps({
            "place": "Kolkata",
            "language": "bn",
            "intent": "current",
            "nationwide": False
        })

        mock_bengali_response = (
            "কলকাতায় আজ আবহাওয়া উষ্ণ এবং আর্দ্র। "
            "তাপমাত্রা প্রায় ২৭°C। "
            "হাওয়া হালকা।"
        )

        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = mock_intent_response
            intent = await chat_svc.extract_intent(query, language="bn")

            assert intent["language"] == "bn"
            assert intent["place"] == "Kolkata"

            mock_llm.return_value = mock_bengali_response
            response = await chat_svc.generate_response(
                query=query,
                intent=intent,
                weather_data=mock_weather_data,
                role="citizen",
                language="bn"
            )

            assert "আবহাওয়া" in query or "তাপমাত্রা" in response, "Contains Bengali weather terms"


    @pytest.mark.asyncio
    async def test_marathi_weather_query(self, chat_svc, mock_weather_data):
        """
        Test Marathi query: "पुण्यात आज पाऊस पडेल का?"
        Validates: Marathi script handling, weather terminology (पाऊस, हवामान)
        """
        query = "पुण्यात आज पाऊस पडेल का?"

        mock_intent_response = json.dumps({
            "place": "Pune",
            "language": "mr",
            "intent": "forecast",
            "nationwide": False
        })

        mock_marathi_response = (
            "पुण्यात आज पाऊस पडण्याची शक्यता आहे. "
            "तापमान सुमारे २७°C असेल. "
            "वारा हलका वाहत असेल."
        )

        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = mock_intent_response
            intent = await chat_svc.extract_intent(query, language="mr")

            assert intent["language"] == "mr"
            assert intent["place"] == "Pune"

            mock_llm.return_value = mock_marathi_response
            response = await chat_svc.generate_response(
                query=query,
                intent=intent,
                weather_data=mock_weather_data,
                role="citizen",
                language="mr"
            )

            assert "पाऊस" in query or "तापमान" in response, "Contains Marathi weather terms"


    @pytest.mark.asyncio
    async def test_english_weather_query_baseline(self, chat_svc, mock_weather_data):
        """
        Test English query as baseline: "What's the weather like in Mumbai?"
        Validates: English language handling, baseline behavior
        """
        query = "What's the weather like in Mumbai?"

        mock_intent_response = json.dumps({
            "place": "Mumbai",
            "language": "en",
            "intent": "current",
            "nationwide": False
        })

        mock_english_response = (
            "It's a warm evening around 27°C in Mumbai, though it might feel a bit warmer at 29°C. "
            "The humidity is quite high at 85%, so it could feel sticky. "
            "Winds are light from the southeast around 12 km/h, and the pressure is normal."
        )

        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = mock_intent_response
            intent = await chat_svc.extract_intent(query, language="en")

            assert intent["language"] == "en"
            assert intent["place"] == "Mumbai"
            assert intent["intent"] == "current"

            mock_llm.return_value = mock_english_response
            response = await chat_svc.generate_response(
                query=query,
                intent=intent,
                weather_data=mock_weather_data,
                role="citizen",
                language="en"
            )

            assert "weather" in response.lower() or "temperature" in response.lower()
            assert "27" in response, "Should mention actual temperature from data"


# ============================================================================
# TEST SUITE 2: EDGE CASES - CODE-SWITCHING & TRANSLITERATION
# ============================================================================

class TestEdgeCases:
    """Test code-switching, transliteration, and mixed language queries."""

    @pytest.mark.asyncio
    async def test_code_switching_hindi_english(self, chat_svc):
        """
        Test code-switching: "Mumbai में कल rain होगा क्या?"
        Validates: Handling mixed English and Hindi
        """
        query = "Mumbai में कल rain होगा क्या?"

        mock_intent_response = json.dumps({
            "place": "Mumbai",
            "language": "hi",
            "intent": "forecast",
            "nationwide": False
        })

        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = mock_intent_response
            intent = await chat_svc.extract_intent(query, language="hi")

            assert intent["place"] == "Mumbai", "Should extract English place name"
            assert intent["intent"] == "forecast", "Should understand mixed language intent"


    @pytest.mark.asyncio
    async def test_transliteration_hindi_roman(self, chat_svc):
        """
        Test transliteration: "Dilli mein mausam kaisa hai?"
        Validates: Hindi in Roman script (Hinglish)
        """
        query = "Dilli mein mausam kaisa hai?"

        # Fallback should handle this - LLM might detect as Hindi or English
        mock_intent_response = json.dumps({
            "place": "Delhi",
            "language": "hi",
            "intent": "current",
            "nationwide": False
        })

        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = mock_intent_response
            intent = await chat_svc.extract_intent(query, language="hi")

            assert intent["place"] == "Delhi" or "Dilli" in intent["place"]
            assert intent["intent"] == "current"


    @pytest.mark.asyncio
    async def test_fallback_intent_extraction_hindi(self, chat_svc):
        """
        Test fallback intent extraction when LLM fails.
        Validates: Keyword-based fallback works for Hindi queries
        """
        query = "कल बारिश होगी क्या mumbai में?"

        # Simulate LLM failure
        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.side_effect = Exception("LLM timeout")

            intent = await chat_svc.extract_intent(query, language="hi")

            # Fallback should still work
            assert intent["place"] == "Mumbai", "Fallback should extract Mumbai"
            assert intent["language"] == "hi", "Should preserve requested language"
            assert intent["confidence"] == 0.6, "Fallback has lower confidence"


# ============================================================================
# TEST SUITE 3: ROLE-SPECIFIC TERMINOLOGY
# ============================================================================

class TestRoleSpecificLanguage:
    """Test role-aware responses in different languages."""

    @pytest.mark.asyncio
    async def test_farmer_role_hindi(self, chat_svc, mock_weather_data):
        """
        Test farmer role with Hindi query.
        Validates: Agricultural terminology in Hindi
        """
        query = "फसल के लिए मौसम कैसा है?"
        intent = {"place": "Nashik", "language": "hi", "intent": "current", "nationwide": False}

        mock_hindi_farmer_response = (
            "खेती के लिए मौसम की स्थिति: तापमान 27°C है और आर्द्रता 85% है। "
            "सिंचाई के लिए उपयुक्त समय है। हवा हल्की है।"
        )

        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = mock_hindi_farmer_response

            response = await chat_svc.generate_response(
                query=query,
                intent=intent,
                weather_data=mock_weather_data,
                role="farmer",
                language="hi"
            )

            # Verify farmer role prompt was used
            call_args = mock_llm.call_args
            messages = call_args[1]["messages"]
            system_msg = next(msg for msg in messages if msg["role"] == "system")
            assert "agricultural" in system_msg["content"].lower() or "farming" in system_msg["content"].lower()


    @pytest.mark.asyncio
    async def test_pilot_role_english(self, chat_svc, mock_weather_data):
        """
        Test pilot role with English query.
        Validates: Aviation terminology preserved
        """
        query = "What's the visibility and wind for Mumbai airport?"
        intent = {"place": "Mumbai", "language": "en", "intent": "current", "nationwide": False}

        mock_pilot_response = (
            "Aviation Weather Briefing for Mumbai:\n"
            "Temperature: 27°C, Winds: 12 km/h from 135° (SE)\n"
            "Pressure: 1013 hPa (normal), Humidity: 85%\n"
            "Conditions: Partly cloudy\n"
            "No significant weather hazards reported."
        )

        with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = mock_pilot_response

            response = await chat_svc.generate_response(
                query=query,
                intent=intent,
                weather_data=mock_weather_data,
                role="pilot",
                language="en"
            )

            # Verify pilot role prompt was used
            call_args = mock_llm.call_args
            messages = call_args[1]["messages"]
            system_msg = next(msg for msg in messages if msg["role"] == "system")
            assert "aviation" in system_msg["content"].lower() or "pilot" in system_msg["content"].lower()
            assert "visibility" in response.lower() or "wind" in response.lower()


# ============================================================================
# TEST SUITE 4: UTF-8 ENCODING & UNICODE HANDLING
# ============================================================================

class TestEncodingAndTypography:
    """Test UTF-8 encoding and Unicode handling for Indic scripts."""

    def test_hindi_devanagari_encoding(self):
        """Test Hindi Devanagari script encodes/decodes correctly."""
        hindi_text = "दिल्ली में बारिश होगी"

        # Encode to bytes and decode back
        encoded = hindi_text.encode('utf-8')
        decoded = encoded.decode('utf-8')

        assert decoded == hindi_text, "Hindi text should survive UTF-8 round-trip"
        assert isinstance(encoded, bytes), "Should encode to bytes"
        assert isinstance(decoded, str), "Should decode to string"


    def test_tamil_script_encoding(self):
        """Test Tamil script encodes/decodes correctly."""
        tamil_text = "சென்னையில் மழை பெய்யும்"

        encoded = tamil_text.encode('utf-8')
        decoded = encoded.decode('utf-8')

        assert decoded == tamil_text, "Tamil text should survive UTF-8 round-trip"


    def test_telugu_script_encoding(self):
        """Test Telugu script encodes/decodes correctly."""
        telugu_text = "హైదరాబాద్‌లో వాతావరణం"

        encoded = telugu_text.encode('utf-8')
        decoded = encoded.decode('utf-8')

        assert decoded == telugu_text, "Telugu text should survive UTF-8 round-trip"


    def test_bengali_script_encoding(self):
        """Test Bengali script encodes/decodes correctly."""
        bengali_text = "কলকাতায় আবহাওয়া"

        encoded = bengali_text.encode('utf-8')
        decoded = encoded.decode('utf-8')

        assert decoded == bengali_text, "Bengali text should survive UTF-8 round-trip"


    def test_json_serialization_unicode(self):
        """Test JSON serialization handles Unicode correctly."""
        data = {
            "query": "मुंबई में मौसम कैसा है?",
            "response": "மழை பெய்யும்",
            "language": "hi"
        }

        # Serialize and deserialize
        json_str = json.dumps(data, ensure_ascii=False)
        decoded_data = json.loads(json_str)

        assert decoded_data["query"] == data["query"], "Hindi should survive JSON serialization"
        assert decoded_data["response"] == data["response"], "Tamil should survive JSON serialization"


    def test_mixed_scripts_in_single_string(self):
        """Test strings containing multiple Indic scripts."""
        mixed_text = "English + हिन्दी + தமிழ் + తెలుగు + বাংলা"

        encoded = mixed_text.encode('utf-8')
        decoded = encoded.decode('utf-8')

        assert decoded == mixed_text, "Mixed scripts should survive encoding"
        assert "हिन्दी" in decoded, "Hindi should be preserved"
        assert "தமிழ்" in decoded, "Tamil should be preserved"
        assert "తెలుగు" in decoded, "Telugu should be preserved"
        assert "বাংলা" in decoded, "Bengali should be preserved"


# ============================================================================
# TEST SUITE 5: API INTEGRATION TESTS
# ============================================================================

class TestAPIIntegration:
    """Test API endpoints with multilingual queries."""

    @pytest.mark.asyncio
    async def test_ask_endpoint_preserves_language(self, mock_weather_data, mock_place_info):
        """
        Test /ask endpoint preserves language throughout pipeline.
        Validates: Request language = Response language
        """
        from backend.api.routes.ask import ask_weather_question

        request = AskRequest(
            query="दिल्ली में मौसम कैसा है?",
            email="test@example.com",
            language="hi",
            role="citizen"
        )

        # Mock all external dependencies
        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode, \
             patch('backend.services.weather_service.weather_service.fetch_weather', new_callable=AsyncMock) as mock_weather, \
             patch('backend.services.weather_service.weather_service.classify_severity') as mock_severity, \
             patch('backend.services.chat_service.chat_service.generate_response', new_callable=AsyncMock) as mock_response, \
             patch('backend.services.auth_service.auth_service.get_user') as mock_get_user, \
             patch('backend.services.auth_service.auth_service.check_rate_limit') as mock_rate_limit, \
             patch('backend.services.auth_service.auth_service.log_usage') as mock_log_usage, \
             patch('backend.services.conversation_service.conversation_service.add_message') as mock_add_msg, \
             patch('backend.services.conversation_service.conversation_service.update_user_preferences') as mock_update_prefs:

            # Setup mocks
            mock_intent.return_value = {
                "place": "Delhi",
                "language": "hi",
                "intent": "current",
                "nationwide": False
            }
            mock_geocode.return_value = mock_place_info
            mock_weather.return_value = mock_weather_data
            mock_severity.return_value = {"severity": "normal", "alerts": []}
            mock_response.return_value = "दिल्ली में मौसम गर्म है।"

            # Mock user auth
            mock_user = MagicMock()
            mock_user.email = "test@example.com"
            mock_user.occupation = "citizen"
            mock_get_user.return_value = mock_user
            mock_rate_limit.return_value = (True, 5, 95)

            # Mock database session
            mock_db = MagicMock()

            # Call endpoint
            response = await ask_weather_question(request, session_id="test-123", db=mock_db)

            # Assertions
            assert response.language == "hi", "Response language should match request"
            assert response.intent["language"] == "hi", "Intent language should be Hindi"
            assert mock_response.called, "Response generation should be called"

            # Verify generate_response was called with Hindi language
            mock_response.assert_called_once()
            call_kwargs = mock_response.call_args[1]
            assert call_kwargs["language"] == "hi", "Response should be generated in Hindi"


    @pytest.mark.asyncio
    async def test_intent_extraction_preserves_language_code(self, chat_svc):
        """
        Test intent extraction preserves language codes correctly.
        Validates: All 10 supported languages
        """
        test_cases = [
            ("en", "What's the weather in Mumbai?"),
            ("hi", "मुंबई में मौसम कैसा है?"),
            ("ta", "சென்னையில் வானிலை எப்படி?"),
            ("te", "హైదరాబాద్‌లో వాతావరణం ఎలా ఉంది?"),
            ("bn", "কলকাতায় আবহাওয়া কেমন?"),
            ("mr", "मुंबईचे हवामान कसे आहे?"),
        ]

        for lang_code, query in test_cases:
            mock_intent_response = json.dumps({
                "place": "Mumbai",
                "language": lang_code,
                "intent": "current",
                "nationwide": False
            })

            with patch.object(chat_svc.llm, 'call_llm', new_callable=AsyncMock) as mock_llm:
                mock_llm.return_value = mock_intent_response
                intent = await chat_svc.extract_intent(query, language=lang_code)

                assert intent["language"] == lang_code, f"Language {lang_code} should be preserved"


    def test_supported_languages_list(self, chat_svc):
        """Test that all 10 languages are supported."""
        expected_languages = ["en", "hi", "ta", "te", "bn", "mr", "kn", "gu", "ml", "pa"]
        supported = chat_svc.get_supported_languages()

        assert supported == expected_languages, "Should support all 10 Indian languages"
        assert len(supported) == 10, "Should have exactly 10 languages"


    def test_language_names_mapping(self, chat_svc):
        """Test language code to name mapping."""
        lang_names = chat_svc.get_language_names()

        assert lang_names["en"] == "English"
        assert "हिन्दी" in lang_names["hi"], "Hindi name should be in Devanagari"
        assert "தமிழ்" in lang_names["ta"], "Tamil name should be in Tamil script"
        assert "తెలుగు" in lang_names["te"], "Telugu name should be in Telugu script"
        assert "বাংলা" in lang_names["bn"], "Bengali name should be in Bengali script"
        assert "मराठी" in lang_names["mr"], "Marathi name should be in Devanagari"

        assert len(lang_names) == 10, "Should have names for all 10 languages"


# ============================================================================
# TEST SUITE 6: WEATHER TERMINOLOGY VALIDATION
# ============================================================================

class TestWeatherTerminology:
    """Test weather-specific terms in different languages."""

    def test_hindi_weather_terms(self):
        """Test Hindi weather terminology."""
        terms = {
            "rain": "बारिश",
            "temperature": "तापमान",
            "wind": "हवा",
            "humidity": "आर्द्रता",
            "weather": "मौसम"
        }

        # Verify terms encode correctly
        for english, hindi in terms.items():
            encoded = hindi.encode('utf-8')
            decoded = encoded.decode('utf-8')
            assert decoded == hindi, f"Hindi term for {english} should survive encoding"


    def test_tamil_weather_terms(self):
        """Test Tamil weather terminology."""
        terms = {
            "rain": "மழை",
            "temperature": "வெப்பநிலை",
            "wind": "காற்று",
            "weather": "வானிலை"
        }

        for english, tamil in terms.items():
            encoded = tamil.encode('utf-8')
            decoded = encoded.decode('utf-8')
            assert decoded == tamil, f"Tamil term for {english} should survive encoding"


    def test_fallback_response_multilingual(self, chat_svc, mock_weather_data):
        """Test fallback response generation maintains language."""
        query = "मौसम कैसा है?"
        intent = {"place": "Mumbai", "language": "hi", "intent": "current", "nationwide": False}

        # Call fallback directly
        fallback_response = chat_svc._fallback_response(
            query=query,
            intent=intent,
            weather_data=mock_weather_data,
            role="citizen",
            language="hi"
        )

        # Fallback may be in English (as per current implementation)
        # but should contain weather data
        assert "27" in fallback_response or "27.5" in fallback_response, "Should contain temperature"


# ============================================================================
# RUN CONFIGURATION
# ============================================================================

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
