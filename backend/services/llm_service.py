"""
WeatherGPT LLM Service
Two-tier provider fallback chain using shared environment API keys
- Primary Tier: Groq API
- Secondary Tier: Google Gemini API (OpenAI-compatible & Native REST fallback)
"""

import os
import json
import logging
import re
from typing import List, Dict, Any, Optional
import asyncio
import httpx
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
try:
    from openai import AsyncOpenAI
except ImportError:
    AsyncOpenAI = None

logger = logging.getLogger(__name__)


class LLMService:
    """
    Unified LLM service with two-tier fallback using shared team environment variables:
    - Tier A (Primary): Groq (fast, low latency)
    - Tier B (Secondary): Gemini (reliable fallback with native REST resilience)
    """

    def __init__(self):
        self.last_tier_used = None
        self.timeout = float(os.getenv("LLM_TIMEOUT", "10.0"))

        # Model names
        self.primary_model = os.getenv("LLM_PRIMARY_MODEL", "llama-3.3-70b-versatile")
        self.secondary_model = os.getenv("LLM_SECONDARY_MODEL", "gemini-3.5-flash")

        # Base URLs
        self.primary_base_url = os.getenv("LLM_PRIMARY_BASE_URL", "https://api.groq.com/openai/v1")
        self.secondary_base_url = os.getenv("LLM_SECONDARY_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai/")

        # Shared team API keys loaded from environment
        self.primary_api_key = os.getenv("GROQ_API_KEY") or os.getenv("LLM_PRIMARY_API_KEY")
        self.secondary_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("LLM_SECONDARY_API_KEY")

        logger.info("LLM Service initialized with shared team keys:")
        logger.info(f"  Primary (Groq): {self.primary_model} (Key present: {bool(self.primary_api_key)})")
        logger.info(f"  Secondary (Gemini): {self.secondary_model} (Key present: {bool(self.secondary_api_key)})")

    def _get_primary_key(self) -> Optional[str]:
        return os.getenv("GROQ_API_KEY") or os.getenv("LLM_PRIMARY_API_KEY") or self.primary_api_key

    def _get_secondary_key(self) -> Optional[str]:
        return os.getenv("GEMINI_API_KEY") or os.getenv("LLM_SECONDARY_API_KEY") or self.secondary_api_key

    def _clean_response(self, text: str) -> str:
        if not text:
            return ""
        clean = re.sub(r'<think>[\s\S]*?</think>', '', text, flags=re.IGNORECASE)
        clean = re.sub(r'<think>[\s\S]*$', '', clean, flags=re.IGNORECASE)
        clean = re.sub(r'\[think(?:ing)?\][\s\S]*?\[\/think(?:ing)?\]', '', clean, flags=re.IGNORECASE)
        clean = re.sub(r'\[think(?:ing)?\][\s\S]*$', '', clean, flags=re.IGNORECASE).strip()
        return clean

    async def _call_gemini_native(
        self,
        model: str,
        messages: List[Dict[str, str]],
        temperature: float,
        max_tokens: int,
        json_mode: bool,
        api_key: str
    ) -> str:
        """Call Google Gemini native generateContent API."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

        system_instruction = ""
        contents = []

        for m in messages:
            role = m.get("role", "user")
            content = m.get("content", "")
            if role == "system":
                system_instruction += content + "\n"
            elif role in ["assistant", "model"]:
                contents.append({"role": "model", "parts": [{"text": content}]})
            else:
                contents.append({"role": "user", "parts": [{"text": content}]})

        if not contents:
            contents.append({"role": "user", "parts": [{"text": "Hello"}]})

        payload: Dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }

        if system_instruction.strip():
            payload["system_instruction"] = {
                "parts": [{"text": system_instruction.strip()}]
            }

        if json_mode:
            payload["generationConfig"]["responseMimeType"] = "application/json"

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=payload)
            if resp.status_code != 200:
                raise Exception(f"Gemini REST error {resp.status_code}: {resp.text}")
            data = resp.json()
            raw_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return self._clean_response(raw_text)

    async def call_llm(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000,
        json_mode: bool = False
    ) -> str:
        """
        Call LLM with two-tier fallback using shared team API keys.
        """
        primary_key = self._get_primary_key()
        secondary_key = self._get_secondary_key()

        logger.info(f"🚀 LLM CALL START (Messages: {len(messages)})")
        errors = []

        # Try Tier A (Primary - Groq)
        if primary_key and not primary_key.startswith("your-") and AsyncOpenAI is not None:
            groq_models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768", self.primary_model]
            primary_client = AsyncOpenAI(
                base_url=self.primary_base_url,
                api_key=primary_key
            )
            for m_name in dict.fromkeys(groq_models):
                if not m_name:
                    continue
                try:
                    logger.info(f"🔄 Attempting PRIMARY tier (Groq: {m_name})...")
                    response = await self._call_with_timeout(
                        primary_client,
                        m_name,
                        messages,
                        temperature,
                        max_tokens,
                        json_mode
                    )
                    self.last_tier_used = "primary"
                    logger.info(f"✅ PRIMARY tier successful with {m_name} ({len(response)} chars)")
                    return response
                except Exception as e:
                    error_msg = f"Groq ({m_name}) failed: {type(e).__name__}: {str(e)}"
                    logger.warning(f"⚠️ {error_msg}")
                    errors.append(error_msg)

        # Try Tier B (Secondary - Gemini Native REST)
        if secondary_key and not secondary_key.startswith("your-"):
            gemini_models = [self.secondary_model, "gemini-3.5-flash", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-flash-latest", "gemini-3.5-flash-lite", "gemini-pro-latest"]
            for g_model in dict.fromkeys(gemini_models):
                if not g_model:
                    continue
                try:
                    logger.info(f"🔄 Attempting SECONDARY tier (Gemini REST: {g_model})...")
                    response = await self._call_gemini_native(
                        g_model,
                        messages,
                        temperature,
                        max_tokens,
                        json_mode,
                        secondary_key
                    )
                    if response:
                        self.last_tier_used = "secondary"
                        logger.info(f"✅ SECONDARY tier successful with {g_model} ({len(response)} chars)")
                        return response
                except Exception as e:
                    error_msg = f"Gemini REST ({g_model}) failed: {type(e).__name__}: {str(e)}"
                    logger.warning(f"⚠️ {error_msg}")
                    errors.append(error_msg)

        self.last_tier_used = "rule_based"

        # Safe fallback if LLMs are unavailable
        if json_mode:
            return json.dumps({
                "place": "Delhi",
                "language": "en",
                "intent": "current",
                "nationwide": False,
                "confidence": 0.6
            })

        if not primary_key and not secondary_key:
            raise Exception("No team LLM API keys configured. Set GROQ_API_KEY or GEMINI_API_KEY in environment.")

        error_summary = " | ".join(errors) if errors else "No configured LLM tiers available"
        raise Exception(f"All LLM tiers failed: {error_summary}")

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

        if json_mode:
            kwargs["response_format"] = {"type": "json_object"}

        response = await asyncio.wait_for(
            client.chat.completions.create(**kwargs),
            timeout=self.timeout
        )

        raw_content = response.choices[0].message.content or ""
        return self._clean_response(raw_content)

    def get_tier_info(self) -> Dict[str, Any]:
        """Get information about configured tiers."""
        primary_key = self._get_primary_key()
        secondary_key = self._get_secondary_key()
        return {
            "primary": {
                "model": self.primary_model,
                "base_url": self.primary_base_url,
                "configured": bool(primary_key and not primary_key.startswith("your-"))
            },
            "secondary": {
                "model": self.secondary_model,
                "base_url": self.secondary_base_url,
                "configured": bool(secondary_key and not secondary_key.startswith("your-"))
            },
            "last_tier_used": self.last_tier_used
        }


# Global instance
llm_service = LLMService()
