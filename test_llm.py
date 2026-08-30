#!/usr/bin/env python3
"""
Quick test script for LLM service with Groq and Gemini keys
"""

import asyncio
import sys
import os

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

print("=" * 70)
print("WeatherGPT LLM Service Test")
print("=" * 70)

# Check if openai is installed
try:
    import openai
    print(f"✓ OpenAI library version: {openai.__version__}")
except ImportError:
    print("✗ OpenAI library not installed")
    print("  Run: pip install openai")
    sys.exit(1)

# Check environment variables
print("\nEnvironment Configuration:")
print(f"  LLM_PRIMARY_BASE_URL: {os.getenv('LLM_PRIMARY_BASE_URL', 'NOT SET')}")
print(f"  LLM_PRIMARY_MODEL: {os.getenv('LLM_PRIMARY_MODEL', 'NOT SET')}")
print(f"  LLM_PRIMARY_API_KEY: {'SET' if os.getenv('LLM_PRIMARY_API_KEY') else 'NOT SET'}")
print(f"  LLM_SECONDARY_BASE_URL: {os.getenv('LLM_SECONDARY_BASE_URL', 'NOT SET')}")
print(f"  LLM_SECONDARY_MODEL: {os.getenv('LLM_SECONDARY_MODEL', 'NOT SET')}")
print(f"  LLM_SECONDARY_API_KEY: {'SET' if os.getenv('LLM_SECONDARY_API_KEY') else 'NOT SET'}")

# Import LLM service
try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
    from services.llm_service import llm_service
    print("\n✓ LLM service imported successfully")
except Exception as e:
    print(f"\n✗ Failed to import LLM service: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Show tier configuration
print("\nLLM Tier Configuration:")
info = llm_service.get_tier_info()
for tier, config in info.items():
    if tier != 'last_tier_used':
        status = "✓ READY" if config["configured"] else "✗ NOT CONFIGURED"
        print(f"  {tier.upper()}: {status} | model={config['model']}")

# Test LLM call
print("\n" + "=" * 70)
print("Testing LLM Call...")
print("=" * 70)

async def test():
    messages = [
        {"role": "system", "content": "You are a helpful weather assistant."},
        {"role": "user", "content": "Say hello in one sentence and mention you can help with weather."}
    ]

    try:
        response = await llm_service.call_llm(messages, temperature=0.7, max_tokens=100)
        print(f"\n✓ SUCCESS!")
        print(f"  Tier used: {llm_service.last_tier_used}")
        print(f"\n  Response:\n  {response}")
        return True
    except Exception as e:
        print(f"\n✗ FAILED: {e}")
        return False

# Run test
success = asyncio.run(test())

print("\n" + "=" * 70)
if success:
    print("LLM Integration: WORKING ✓")
else:
    print("LLM Integration: FAILED ✗")
print("=" * 70)

sys.exit(0 if success else 1)
