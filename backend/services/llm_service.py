"""
WeatherGPT LLM Service
Two-tier provider fallback chain with user-specific API keys
"""

import os
import json
import logging
from typing import List, Dict, Any, Optional
import asyncio
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


class LLMService:
    """
    Unified LLM service with two-tier fallback using user-provided API keys:
    - Tier A (Primary): Groq (fast, efficient)
    - Tier B (Secondary): Gemini (reliable fallback)

    All tiers speak OpenAI-compatible chat/completions API.
    Service is stateless - API keys are provided per request.
    """

    def __init__(self):
        self.last_tier_used = None
        self.timeout = 8.0  # seconds per tier attempt

        # Model names (can be overridden via environment for testing)
        self.primary_model = os.getenv("LLM_PRIMARY_MODEL", "llama-3.3-70b-versatile")
        self.secondary_model = os.getenv("LLM_SECONDARY_MODEL", "gemini-2.0-flash-exp")

        # Base URLs (can be overridden via environment for testing)
        self.primary_base_url = os.getenv("LLM_PRIMARY_BASE_URL", "https://api.groq.com/openai/v1")
        self.secondary_base_url = os.getenv("LLM_SECONDARY_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")

        logger.info(f"LLM Service initialized (stateless mode):")
        logger.info(f"  Primary: {self.primary_model}")
        logger.info(f"  Secondary: {self.secondary_model}")

    async def call_llm(
        self,
        messages: List[Dict[str, str]],
        groq_api_key: Optional[str] = None,
        gemini_api_key: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1000,
        json_mode: bool = False
    ) -> str:
        """
        Call LLM with two-tier fallback using user-provided API keys.

        Args:
            messages: OpenAI-format messages [{"role": "user", "content": "..."}]
            groq_api_key: User's Groq API key (primary tier)
            gemini_api_key: User's Gemini API key (secondary tier)
            temperature: Sampling temperature (0.0-1.0)
            max_tokens: Maximum response tokens
            json_mode: Force JSON response format

        Returns:
            LLM response text

        Raises:
            Exception: If all tiers fail or no API keys provided
        """
        logger.info(f"🚀 LLM CALL START")
        logger.info(f"🔑 Groq key available: {bool(groq_api_key)} (length: {len(groq_api_key) if groq_api_key else 0})")
        logger.info(f"🔑 Gemini key available: {bool(gemini_api_key)} (length: {len(gemini_api_key) if gemini_api_key else 0})")
        logger.info(f"⚙️ Settings: temp={temperature}, max_tokens={max_tokens}, json_mode={json_mode}")
        logger.info(f"💬 Messages count: {len(messages)}")

        errors = []

        # Try Tier A (Primary - Groq)
        if groq_api_key:
            try:
                logger.info(f"🔄 Attempting PRIMARY tier (Groq)...")
                logger.info(f"   Model: {self.primary_model}")
                logger.info(f"   Base URL: {self.primary_base_url}")

                primary_client = AsyncOpenAI(
                    base_url=self.primary_base_url,
                    api_key=groq_api_key
                )
                response = await self._call_with_timeout(
                    primary_client,
                    self.primary_model,
                    messages,
                    temperature,
                    max_tokens,
                    json_mode
                )
                self.last_tier_used = "primary"
                logger.info(f"✅ PRIMARY tier successful! Response length: {len(response)} chars")
                return response
            except Exception as e:
                error_msg = f"Primary tier (Groq) failed: {type(e).__name__}: {str(e)}"
                logger.error(f"❌ {error_msg}")
                logger.error(f"📋 Full traceback:", exc_info=True)
                errors.append(error_msg)
        else:
            logger.warning(f"⚠️ Skipping PRIMARY tier - no Groq API key provided")

        # Try Tier B (Secondary - Gemini)
        if gemini_api_key:
            try:
                logger.info(f"🔄 Attempting SECONDARY tier (Gemini)...")
                logger.info(f"   Model: {self.secondary_model}")
                logger.info(f"   Base URL: {self.secondary_base_url}")

                secondary_client = AsyncOpenAI(
                    base_url=self.secondary_base_url,
                    api_key=gemini_api_key
                )
                response = await self._call_with_timeout(
                    secondary_client,
                    self.secondary_model,
                    messages,
                    temperature,
                    max_tokens,
                    json_mode
                )
                self.last_tier_used = "secondary"
                logger.info(f"✅ SECONDARY tier successful! Response length: {len(response)} chars")
                return response
            except Exception as e:
                error_msg = f"Secondary tier (Gemini) failed: {type(e).__name__}: {str(e)}"
                logger.error(f"❌ {error_msg}")
                logger.error(f"📋 Full traceback:", exc_info=True)
                errors.append(error_msg)
        else:
            logger.warning(f"⚠️ Skipping SECONDARY tier - no Gemini API key provided")

        # All tiers failed
        self.last_tier_used = "none"
        logger.error(f"💥 ALL TIERS FAILED!")

        if not groq_api_key and not gemini_api_key:
            error_msg = "No API keys provided. Please configure at least one LLM provider."
            logger.error(f"❌ {error_msg}")
            raise Exception(error_msg)

        error_summary = " | ".join(errors) if errors else "No configured tiers available"
        logger.error(f"❌ Error summary: {error_summary}")
        raise Exception(f"All LLM provider tiers failed: {error_summary}")

    async def _call_with_timeout(
        self,
        client: AsyncOpenAI,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        json_mode: bool
    ) -> str:
        """Make LLM call with timeout."""
        kwargs = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        # Add JSON mode if requested (not all models support this)
        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        # Call with timeout
        response = await asyncio.wait_for(
            client.chat.completions.create(**kwargs),
            timeout=self.timeout
        )

        return response.choices[0].message.content

    def get_tier_info(self) -> Dict[str, Any]:
        """Get information about configured tiers."""
        return {
            "primary": {
                "model": self.primary_model,
                "base_url": self.primary_base_url
            },
            "secondary": {
                "model": self.secondary_model,
                "base_url": self.secondary_base_url
            },
            "last_tier_used": self.last_tier_used
        }


# Global instance
llm_service = LLMService()


if __name__ == "__main__":
    # Test the service
    async def test():
        import sys
        if len(sys.argv) < 2:
            print("Usage: python llm_service.py <groq_api_key> [gemini_api_key]")
            sys.exit(1)

        groq_key = sys.argv[1] if len(sys.argv) > 1 else None
        gemini_key = sys.argv[2] if len(sys.argv) > 2 else None

        messages = [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say hello in one sentence."}
        ]
        response = await llm_service.call_llm(
            messages,
            groq_api_key=groq_key,
            gemini_api_key=gemini_key
        )
        print(f"Response: {response}")
        print(f"Tier used: {llm_service.last_tier_used}")

    asyncio.run(test())
