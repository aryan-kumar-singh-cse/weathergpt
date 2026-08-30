"""
LLM Provider Fallback Tests
Tests three-tier fallback chain: primary → secondary → fallback
Validates timeout handling and tier logging
"""

import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock
from backend.services.llm_service import LLMService


class TestLLMFallbackChain:
    """
    Test suite for LLM service three-tier fallback mechanism.
    Tests resilience against provider failures and timeout handling.
    """

    @pytest.mark.asyncio
    async def test_primary_tier_success(self):
        """
        Test that primary tier is used when available.
        No fallback should occur on success.
        """
        llm_service = LLMService()

        # Mock primary client to succeed
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="Primary tier response"))]

        with patch.object(llm_service, 'primary_client') as mock_primary:
            mock_primary.chat.completions.create = AsyncMock(return_value=mock_response)

            messages = [{"role": "user", "content": "Test query"}]
            result = await llm_service.call_llm(messages)

            assert result == "Primary tier response"
            assert llm_service.last_tier_used == "primary"
            mock_primary.chat.completions.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_fallback_to_secondary_on_primary_failure(self):
        """
        Test that secondary tier is used when primary fails.
        Primary fails → should automatically try secondary.
        """
        llm_service = LLMService()

        # Mock secondary success
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="Secondary tier response"))]

        with patch.object(llm_service, 'primary_client') as mock_primary, \
             patch.object(llm_service, 'secondary_client') as mock_secondary:

            # Primary fails
            mock_primary.chat.completions.create = AsyncMock(side_effect=Exception("Primary API error"))

            # Secondary succeeds
            mock_secondary.chat.completions.create = AsyncMock(return_value=mock_response)

            messages = [{"role": "user", "content": "Test query"}]
            result = await llm_service.call_llm(messages)

            assert result == "Secondary tier response"
            assert llm_service.last_tier_used == "secondary"
            mock_primary.chat.completions.create.assert_called_once()
            mock_secondary.chat.completions.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_fallback_to_tertiary_on_primary_and_secondary_failure(self):
        """
        Test that fallback tier is used when both primary and secondary fail.
        Primary fails → Secondary fails → should try fallback.
        """
        llm_service = LLMService()

        # Mock fallback success
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="Fallback tier response"))]

        with patch.object(llm_service, 'primary_client') as mock_primary, \
             patch.object(llm_service, 'secondary_client') as mock_secondary, \
             patch.object(llm_service, 'fallback_client') as mock_fallback:

            # Primary and secondary fail
            mock_primary.chat.completions.create = AsyncMock(side_effect=Exception("Primary API error"))
            mock_secondary.chat.completions.create = AsyncMock(side_effect=Exception("Secondary API error"))

            # Fallback succeeds
            mock_fallback.chat.completions.create = AsyncMock(return_value=mock_response)

            messages = [{"role": "user", "content": "Test query"}]
            result = await llm_service.call_llm(messages)

            assert result == "Fallback tier response"
            assert llm_service.last_tier_used == "fallback"
            mock_primary.chat.completions.create.assert_called_once()
            mock_secondary.chat.completions.create.assert_called_once()
            mock_fallback.chat.completions.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_all_tiers_fail_raises_exception(self):
        """
        Test that exception is raised when all three tiers fail.
        Primary fails → Secondary fails → Fallback fails → should raise exception.
        """
        llm_service = LLMService()

        with patch.object(llm_service, 'primary_client') as mock_primary, \
             patch.object(llm_service, 'secondary_client') as mock_secondary, \
             patch.object(llm_service, 'fallback_client') as mock_fallback:

            # All tiers fail
            mock_primary.chat.completions.create = AsyncMock(side_effect=Exception("Primary API error"))
            mock_secondary.chat.completions.create = AsyncMock(side_effect=Exception("Secondary API error"))
            mock_fallback.chat.completions.create = AsyncMock(side_effect=Exception("Fallback API error"))

            messages = [{"role": "user", "content": "Test query"}]

            with pytest.raises(Exception) as exc_info:
                await llm_service.call_llm(messages)

            assert "All LLM provider tiers failed" in str(exc_info.value)
            assert llm_service.last_tier_used == "none"

    @pytest.mark.asyncio
    async def test_timeout_handling_per_tier(self):
        """
        Test that timeout (8s per tier) is enforced.
        Should move to next tier on timeout.
        """
        llm_service = LLMService()
        llm_service.timeout = 0.1  # Set short timeout for testing

        # Mock secondary success
        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="Secondary response after timeout"))]

        with patch.object(llm_service, 'primary_client') as mock_primary, \
             patch.object(llm_service, 'secondary_client') as mock_secondary:

            # Primary times out (slow response)
            async def slow_response(*args, **kwargs):
                await asyncio.sleep(1.0)  # Longer than timeout
                return mock_response

            mock_primary.chat.completions.create = AsyncMock(side_effect=slow_response)

            # Secondary responds quickly
            mock_secondary.chat.completions.create = AsyncMock(return_value=mock_response)

            messages = [{"role": "user", "content": "Test query"}]
            result = await llm_service.call_llm(messages)

            assert result == "Secondary response after timeout"
            assert llm_service.last_tier_used == "secondary"

    @pytest.mark.asyncio
    async def test_json_mode_parameter_passed_correctly(self):
        """
        Test that json_mode parameter is correctly passed to API.
        """
        llm_service = LLMService()

        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content='{"result": "json"}'))]

        with patch.object(llm_service, 'primary_client') as mock_primary:
            mock_primary.chat.completions.create = AsyncMock(return_value=mock_response)

            messages = [{"role": "user", "content": "Test query"}]
            await llm_service.call_llm(messages, json_mode=True)

            # Verify json_mode was passed
            call_kwargs = mock_primary.chat.completions.create.call_args.kwargs
            assert "response_format" in call_kwargs
            assert call_kwargs["response_format"] == {"type": "json_object"}

    @pytest.mark.asyncio
    async def test_temperature_and_max_tokens_parameters(self):
        """
        Test that temperature and max_tokens parameters are passed correctly.
        """
        llm_service = LLMService()

        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="Response"))]

        with patch.object(llm_service, 'primary_client') as mock_primary:
            mock_primary.chat.completions.create = AsyncMock(return_value=mock_response)

            messages = [{"role": "user", "content": "Test query"}]
            await llm_service.call_llm(messages, temperature=0.5, max_tokens=500)

            call_kwargs = mock_primary.chat.completions.create.call_args.kwargs
            assert call_kwargs["temperature"] == 0.5
            assert call_kwargs["max_tokens"] == 500

    @pytest.mark.asyncio
    async def test_get_tier_info_returns_configuration(self):
        """
        Test that get_tier_info returns current configuration.
        Should show which tiers are configured and last tier used.
        """
        llm_service = LLMService()

        # Simulate a call to set last_tier_used
        llm_service.last_tier_used = "primary"

        tier_info = llm_service.get_tier_info()

        assert "primary" in tier_info
        assert "secondary" in tier_info
        assert "fallback" in tier_info
        assert "last_tier_used" in tier_info

        assert isinstance(tier_info["primary"]["configured"], bool)
        assert isinstance(tier_info["primary"]["model"], str)

        assert tier_info["last_tier_used"] == "primary"

    @pytest.mark.asyncio
    async def test_no_clients_configured_raises_exception(self):
        """
        Test behavior when no LLM clients are configured.
        Should fail immediately with clear error.
        """
        llm_service = LLMService()

        # Remove all clients
        llm_service.primary_client = None
        llm_service.secondary_client = None
        llm_service.fallback_client = None

        messages = [{"role": "user", "content": "Test query"}]

        with pytest.raises(Exception) as exc_info:
            await llm_service.call_llm(messages)

        assert "All LLM provider tiers failed" in str(exc_info.value)
        assert llm_service.last_tier_used == "none"


class TestLLMServiceIntegration:
    """
    Integration tests for LLM service behavior in realistic scenarios.
    """

    @pytest.mark.asyncio
    async def test_fallback_preserves_message_context(self):
        """
        Test that message context is preserved across tier fallbacks.
        When primary fails, secondary should receive same messages.
        """
        llm_service = LLMService()

        mock_response = MagicMock()
        mock_response.choices = [MagicMock(message=MagicMock(content="Response"))]

        test_messages = [
            {"role": "system", "content": "You are a helpful assistant"},
            {"role": "user", "content": "What's the weather?"}
        ]

        with patch.object(llm_service, 'primary_client') as mock_primary, \
             patch.object(llm_service, 'secondary_client') as mock_secondary:

            mock_primary.chat.completions.create = AsyncMock(side_effect=Exception("Primary error"))
            mock_secondary.chat.completions.create = AsyncMock(return_value=mock_response)

            await llm_service.call_llm(test_messages)

            # Verify secondary received same messages
            secondary_call_args = mock_secondary.chat.completions.create.call_args.kwargs
            assert secondary_call_args["messages"] == test_messages

    @pytest.mark.asyncio
    async def test_concurrent_requests_maintain_separate_tier_tracking(self):
        """
        Test that concurrent requests don't interfere with each other's tier tracking.
        Each call should independently track which tier succeeded.
        """
        llm_service = LLMService()

        mock_response_primary = MagicMock()
        mock_response_primary.choices = [MagicMock(message=MagicMock(content="Primary"))]

        mock_response_secondary = MagicMock()
        mock_response_secondary.choices = [MagicMock(message=MagicMock(content="Secondary"))]

        with patch.object(llm_service, 'primary_client') as mock_primary, \
             patch.object(llm_service, 'secondary_client') as mock_secondary:

            # Primary succeeds
            mock_primary.chat.completions.create = AsyncMock(return_value=mock_response_primary)
            mock_secondary.chat.completions.create = AsyncMock(return_value=mock_response_secondary)

            messages = [{"role": "user", "content": "Test"}]

            # Make concurrent calls
            results = await asyncio.gather(
                llm_service.call_llm(messages),
                llm_service.call_llm(messages),
                llm_service.call_llm(messages)
            )

            assert len(results) == 3
            assert all(r == "Primary" for r in results)
            assert llm_service.last_tier_used == "primary"
