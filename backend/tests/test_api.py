"""
API Contract Tests
Tests /api/ask endpoint with valid/invalid inputs and response schema compliance
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock


class TestAskEndpoint:
    """Test suite for /api/v1/ask endpoint - the main conversational entrypoint."""

    def test_ask_with_valid_inputs(self, client, sample_session_id, mock_weather_data, mock_intent_data, mock_geocoding_data):
        """
        Test /api/ask with valid query, role, and language.
        Mocks external services to ensure deterministic behavior.
        """
        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode, \
             patch('backend.services.weather_service.weather_service.fetch_weather', new_callable=AsyncMock) as mock_weather, \
             patch('backend.services.chat_service.chat_service.generate_response', new_callable=AsyncMock) as mock_response:

            mock_intent.return_value = mock_intent_data()
            mock_geocode.return_value = mock_geocoding_data()
            mock_weather.return_value = mock_weather_data()
            mock_response.return_value = "The weather in Mumbai is pleasant with 27°C temperature."

            response = client.post(
                "/api/v1/ask",
                json={
                    "query": "What's the weather in Mumbai?",
                    "language": "en",
                    "role": "citizen"
                },
                headers={"X-Session-ID": sample_session_id}
            )

            assert response.status_code == 200
            data = response.json()

            # Verify response schema compliance
            assert "query" in data
            assert "intent" in data
            assert "weather" in data
            assert "severity" in data
            assert "response" in data
            assert "language" in data
            assert "role" in data
            assert "grounding_source" in data
            assert "llm_tier_used" in data
            assert "timestamp" in data

            # Verify response values
            assert data["query"] == "What's the weather in Mumbai?"
            assert data["language"] == "en"
            assert data["role"] == "citizen"
            assert data["grounding_source"] == "Open-Meteo"
            assert isinstance(data["response"], str)

    def test_ask_requires_query(self, client, sample_session_id):
        """Test that empty query returns 400 error."""
        response = client.post(
            "/api/v1/ask",
            json={
                "query": "",
                "language": "en",
                "role": "citizen"
            },
            headers={"X-Session-ID": sample_session_id}
        )

        assert response.status_code == 400
        assert "Query cannot be empty" in response.json()["detail"]

    def test_ask_with_whitespace_query(self, client, sample_session_id):
        """Test that whitespace-only query returns 400 error."""
        response = client.post(
            "/api/v1/ask",
            json={
                "query": "   ",
                "language": "en",
                "role": "citizen"
            },
            headers={"X-Session-ID": sample_session_id}
        )

        assert response.status_code == 400
        assert "Query cannot be empty" in response.json()["detail"]

    def test_ask_with_invalid_role(self, client, sample_session_id):
        """Test that invalid role returns 400 error."""
        response = client.post(
            "/api/v1/ask",
            json={
                "query": "What's the weather?",
                "language": "en",
                "role": "invalid-role"
            },
            headers={"X-Session-ID": sample_session_id}
        )

        assert response.status_code == 400
        assert "Invalid role" in response.json()["detail"]

    def test_ask_with_all_valid_roles(self, client, sample_session_id, valid_roles, mock_weather_data, mock_intent_data, mock_geocoding_data):
        """Test that all valid roles are accepted."""
        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode, \
             patch('backend.services.weather_service.weather_service.fetch_weather', new_callable=AsyncMock) as mock_weather, \
             patch('backend.services.chat_service.chat_service.generate_response', new_callable=AsyncMock) as mock_response:

            mock_intent.return_value = mock_intent_data()
            mock_geocode.return_value = mock_geocoding_data()
            mock_weather.return_value = mock_weather_data()
            mock_response.return_value = "Weather response"

            for role in valid_roles:
                response = client.post(
                    "/api/v1/ask",
                    json={
                        "query": "What's the weather?",
                        "language": "en",
                        "role": role
                    },
                    headers={"X-Session-ID": sample_session_id}
                )

                assert response.status_code == 200, f"Role '{role}' should be valid"
                assert response.json()["role"] == role

    def test_ask_with_unsupported_language_falls_back_to_english(self, client, sample_session_id, mock_weather_data, mock_intent_data, mock_geocoding_data):
        """
        Test that unsupported language falls back to English.
        Should log warning but not fail the request.
        """
        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode, \
             patch('backend.services.weather_service.weather_service.fetch_weather', new_callable=AsyncMock) as mock_weather, \
             patch('backend.services.chat_service.chat_service.generate_response', new_callable=AsyncMock) as mock_response:

            mock_intent.return_value = mock_intent_data()
            mock_geocode.return_value = mock_geocoding_data()
            mock_weather.return_value = mock_weather_data()
            mock_response.return_value = "Weather response"

            response = client.post(
                "/api/v1/ask",
                json={
                    "query": "What's the weather?",
                    "language": "zz",  # Invalid language code
                    "role": "citizen"
                },
                headers={"X-Session-ID": sample_session_id}
            )

            assert response.status_code == 200
            # Should fall back to English
            assert response.json()["language"] == "en"

    def test_ask_with_missing_location_returns_404(self, client, sample_session_id, mock_intent_data):
        """Test that geocoding failure returns 404."""
        from backend.services import GeocodingError

        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode:

            mock_intent.return_value = mock_intent_data(place="NonExistentPlace12345")
            mock_geocode.side_effect = GeocodingError("Location not found")

            response = client.post(
                "/api/v1/ask",
                json={
                    "query": "What's the weather in NonExistentPlace12345?",
                    "language": "en",
                    "role": "citizen"
                },
                headers={"X-Session-ID": sample_session_id}
            )

            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()

    def test_ask_without_session_id_creates_anonymous_session(self, client, mock_weather_data, mock_intent_data, mock_geocoding_data):
        """
        Test that request without session ID generates anonymous session.
        Should not fail - system creates temporary session.
        """
        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode, \
             patch('backend.services.weather_service.weather_service.fetch_weather', new_callable=AsyncMock) as mock_weather, \
             patch('backend.services.chat_service.chat_service.generate_response', new_callable=AsyncMock) as mock_response:

            mock_intent.return_value = mock_intent_data()
            mock_geocode.return_value = mock_geocoding_data()
            mock_weather.return_value = mock_weather_data()
            mock_response.return_value = "Weather response"

            response = client.post(
                "/api/v1/ask",
                json={
                    "query": "What's the weather?",
                    "language": "en",
                    "role": "citizen"
                }
                # No X-Session-ID header
            )

            assert response.status_code == 200


class TestCapabilitiesEndpoint:
    """Test suite for /api/v1/ask/capabilities endpoint."""

    def test_capabilities_endpoint_returns_supported_features(self, client):
        """Test that capabilities endpoint returns system capabilities."""
        response = client.get("/api/v1/ask/capabilities")

        assert response.status_code == 200
        data = response.json()

        assert "supported_languages" in data
        assert "language_names" in data
        assert "supported_roles" in data
        assert "features" in data
        assert "llm_tiers" in data
        assert "data_source" in data
        assert "geocoding_source" in data

        # Verify expected values
        assert isinstance(data["supported_languages"], list)
        assert len(data["supported_languages"]) >= 10
        assert "en" in data["supported_languages"]

        assert isinstance(data["supported_roles"], list)
        assert "citizen" in data["supported_roles"]
        assert "farmer" in data["supported_roles"]


class TestExamplesEndpoint:
    """Test suite for /api/v1/ask/examples endpoint."""

    def test_examples_endpoint_returns_query_examples(self, client):
        """Test that examples endpoint returns example queries by category."""
        response = client.get("/api/v1/ask/examples")

        assert response.status_code == 200
        data = response.json()

        assert "examples" in data
        examples = data["examples"]

        assert "current_weather" in examples
        assert "forecast" in examples
        assert "alerts" in examples
        assert "role_specific" in examples
        assert "multilingual" in examples

        # Verify structure
        assert isinstance(examples["current_weather"], list)
        assert len(examples["current_weather"]) > 0

        assert isinstance(examples["role_specific"], dict)
        assert "farmer" in examples["role_specific"]


class TestHealthEndpoints:
    """Test suite for health and status endpoints."""

    def test_root_endpoint(self, client):
        """Test root endpoint returns API information."""
        response = client.get("/")

        assert response.status_code == 200
        data = response.json()

        assert data["message"] == "Welcome to WeatherGPT API"
        assert data["status"] == "operational"
        assert "documentation" in data
        assert "features" in data

    def test_health_check_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "healthy"
        assert "timestamp" in data
        assert data["service"] == "WeatherGPT API"

    def test_status_endpoint(self, client):
        """Test service status endpoint."""
        response = client.get("/api/v1/status")

        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "operational"
        assert "integrations" in data
        assert "capabilities" in data
        assert "timestamp" in data
