"""
Integration Tests
End-to-end query flow tests with database persistence
"""

import pytest
from unittest.mock import patch, AsyncMock


class TestEndToEndQueryFlow:
    """
    Integration tests for complete query processing pipeline.
    Tests the full journey from query to response with database persistence.
    """

    @pytest.mark.asyncio
    async def test_complete_query_flow_with_persistence(self, client, db_session, sample_session_id, mock_weather_data, mock_intent_data, mock_geocoding_data):
        """
        Test complete end-to-end query flow:
        1. User sends query
        2. System extracts intent
        3. System geocodes location
        4. System fetches weather data
        5. System generates response
        6. Conversation history is saved
        """
        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode, \
             patch('backend.services.weather_service.weather_service.fetch_weather', new_callable=AsyncMock) as mock_weather, \
             patch('backend.services.chat_service.chat_service.generate_response', new_callable=AsyncMock) as mock_response:

            mock_intent.return_value = mock_intent_data(place="Mumbai", intent="current")
            mock_geocode.return_value = mock_geocoding_data(place_name="Mumbai")
            mock_weather.return_value = mock_weather_data(temperature=27, wind_speed=15)
            mock_response.return_value = "The weather in Mumbai is pleasant with a temperature of 27°C."

            # Send query
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

            # Verify response structure
            assert data["query"] == "What's the weather in Mumbai?"
            assert data["response"] == "The weather in Mumbai is pleasant with a temperature of 27°C."
            assert "weather" in data
            assert "severity" in data

            # Verify database persistence
            from backend.services.conversation_service import conversation_service

            conversation = conversation_service.get_active_conversation(sample_session_id, db_session)
            assert conversation is not None
            assert len(conversation.messages) == 2  # User query + assistant response

            user_message = conversation.messages[0]
            assert user_message.role == "user"
            assert user_message.content == "What's the weather in Mumbai?"

            assistant_message = conversation.messages[1]
            assert assistant_message.role == "assistant"
            assert assistant_message.llm_tier_used is not None
            assert assistant_message.weather_data is not None

    @pytest.mark.asyncio
    async def test_multiple_queries_in_same_session(self, client, db_session, sample_session_id, mock_weather_data, mock_intent_data, mock_geocoding_data):
        """
        Test multiple queries in same session maintain conversation history.
        """
        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode, \
             patch('backend.services.weather_service.weather_service.fetch_weather', new_callable=AsyncMock) as mock_weather, \
             patch('backend.services.chat_service.chat_service.generate_response', new_callable=AsyncMock) as mock_response:

            mock_intent.return_value = mock_intent_data()
            mock_geocode.return_value = mock_geocoding_data()
            mock_weather.return_value = mock_weather_data()
            mock_response.return_value = "Weather response"

            queries = [
                "What's the weather in Mumbai?",
                "Will it rain tomorrow?",
                "What about next week?"
            ]

            for query in queries:
                response = client.post(
                    "/api/v1/ask",
                    json={
                        "query": query,
                        "language": "en",
                        "role": "citizen"
                    },
                    headers={"X-Session-ID": sample_session_id}
                )
                assert response.status_code == 200

            # Verify conversation history
            from backend.services.conversation_service import conversation_service

            conversation = conversation_service.get_active_conversation(sample_session_id, db_session)
            assert conversation is not None
            # 3 queries × 2 messages (user + assistant) = 6 messages
            assert len(conversation.messages) == 6

            # Verify order
            for i, query in enumerate(queries):
                user_msg_index = i * 2
                assert conversation.messages[user_msg_index].role == "user"
                assert conversation.messages[user_msg_index].content == query
                assert conversation.messages[user_msg_index + 1].role == "assistant"

    @pytest.mark.asyncio
    async def test_role_specific_response_generation(self, client, sample_session_id, mock_weather_data, mock_intent_data, mock_geocoding_data):
        """
        Test that different roles receive role-appropriate responses.
        Verifies that role is passed through the pipeline correctly.
        """
        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode, \
             patch('backend.services.weather_service.weather_service.fetch_weather', new_callable=AsyncMock) as mock_weather, \
             patch('backend.services.chat_service.chat_service.generate_response', new_callable=AsyncMock) as mock_response:

            mock_intent.return_value = mock_intent_data()
            mock_geocode.return_value = mock_geocoding_data()
            mock_weather.return_value = mock_weather_data()

            # Different response based on role
            def role_based_response(query, intent, weather_data, role, language):
                responses = {
                    "citizen": "The weather is pleasant at 27°C.",
                    "farmer": "Conditions are suitable for farming with 27°C and 65% humidity.",
                    "pilot": "Flight conditions: Temperature 27°C, Wind 15 km/h, Visibility good.",
                    "disaster-manager": "No weather warnings. Conditions normal: 27°C, Wind 15 km/h."
                }
                return responses.get(role, "Weather response")

            mock_response.side_effect = role_based_response

            roles_and_expected_keywords = [
                ("citizen", ["pleasant"]),
                ("farmer", ["farming", "humidity"]),
                ("pilot", ["Flight conditions", "Visibility"]),
                ("disaster-manager", ["warnings", "normal"])
            ]

            for role, keywords in roles_and_expected_keywords:
                response = client.post(
                    "/api/v1/ask",
                    json={
                        "query": "What's the weather?",
                        "language": "en",
                        "role": role
                    },
                    headers={"X-Session-ID": f"{sample_session_id}-{role}"}
                )

                assert response.status_code == 200
                response_text = response.json()["response"]

                # Verify role-specific keywords appear
                assert any(keyword.lower() in response_text.lower() for keyword in keywords)

    @pytest.mark.asyncio
    async def test_severe_weather_classification_in_flow(self, client, sample_session_id, mock_weather_data, mock_intent_data, mock_geocoding_data):
        """
        Test that severe weather is correctly classified in end-to-end flow.
        """
        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode, \
             patch('backend.services.weather_service.weather_service.fetch_weather', new_callable=AsyncMock) as mock_weather, \
             patch('backend.services.chat_service.chat_service.generate_response', new_callable=AsyncMock) as mock_response:

            mock_intent.return_value = mock_intent_data()
            mock_geocode.return_value = mock_geocoding_data()

            # Extreme weather conditions
            extreme_weather = mock_weather_data(temperature=45, wind_speed=62)
            mock_weather.return_value = extreme_weather
            mock_response.return_value = "EXTREME WEATHER ALERT"

            response = client.post(
                "/api/v1/ask",
                json={
                    "query": "What's the weather?",
                    "language": "en",
                    "role": "disaster-manager"
                },
                headers={"X-Session-ID": sample_session_id}
            )

            assert response.status_code == 200
            data = response.json()

            # Verify severity classification
            assert data["severity"]["severity"] == "extreme"
            assert data["severity"]["alert_count"] >= 2
            assert any("heat" in alert.lower() for alert in data["severity"]["alerts"])
            assert any("wind" in alert.lower() for alert in data["severity"]["alerts"])

    @pytest.mark.asyncio
    async def test_nationwide_query_uses_default_coordinates(self, client, sample_session_id, mock_weather_data, mock_intent_data):
        """
        Test that nationwide queries use India's center coordinates.
        Should not call geocoding service.
        """
        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode, \
             patch('backend.services.weather_service.weather_service.fetch_weather', new_callable=AsyncMock) as mock_weather, \
             patch('backend.services.chat_service.chat_service.generate_response', new_callable=AsyncMock) as mock_response:

            mock_intent.return_value = mock_intent_data(nationwide=True)
            mock_weather.return_value = mock_weather_data()
            mock_response.return_value = "National weather summary"

            response = client.post(
                "/api/v1/ask",
                json={
                    "query": "What's the weather situation in India?",
                    "language": "en",
                    "role": "citizen"
                },
                headers={"X-Session-ID": sample_session_id}
            )

            assert response.status_code == 200

            # Verify geocoding was NOT called (nationwide uses default coords)
            mock_geocode.assert_not_called()

            # Verify weather fetch was called with India's center coordinates
            call_args = mock_weather.call_args
            lat, lng = call_args[0]
            assert lat == 20.5937  # India center latitude
            assert lng == 78.9629  # India center longitude


class TestErrorHandling:
    """Test suite for error handling in integration scenarios."""

    @pytest.mark.asyncio
    async def test_database_failure_does_not_break_request(self, client, sample_session_id, mock_weather_data, mock_intent_data, mock_geocoding_data):
        """
        Test that database failure during history saving doesn't fail the request.
        User should still get weather response even if history fails to save.
        """
        with patch('backend.services.chat_service.chat_service.extract_intent', new_callable=AsyncMock) as mock_intent, \
             patch('backend.services.geocoding_service.geocoding_service.geocode', new_callable=AsyncMock) as mock_geocode, \
             patch('backend.services.weather_service.weather_service.fetch_weather', new_callable=AsyncMock) as mock_weather, \
             patch('backend.services.chat_service.chat_service.generate_response', new_callable=AsyncMock) as mock_response, \
             patch('backend.services.conversation_service.conversation_service.add_message', side_effect=Exception("DB error")):

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
                },
                headers={"X-Session-ID": sample_session_id}
            )

            # Request should still succeed
            assert response.status_code == 200
            assert response.json()["response"] == "Weather response"
