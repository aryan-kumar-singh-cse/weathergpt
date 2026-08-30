#!/usr/bin/env python3
"""
Test LLM Three-Tier Fallback Chain
Verifies Groq → Gemini → Ollama fallback behavior
"""

import os
import sys
import asyncio
from typing import Dict, Any

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from backend.services.llm_service import LLMService


async def test_tier_configuration():
    """Test that tiers are properly configured."""
    print("=" * 60)
    print("TEST 1: Tier Configuration")
    print("=" * 60)

    llm = LLMService()
    tier_info = llm.get_tier_info()

    print(f"\nTier A (Primary):   {'✓ Configured' if tier_info['primary']['configured'] else '✗ Not configured'}")
    print(f"  Model: {tier_info['primary']['model']}")

    print(f"\nTier B (Secondary): {'✓ Configured' if tier_info['secondary']['configured'] else '✗ Not configured'}")
    print(f"  Model: {tier_info['secondary']['model']}")

    print(f"\nTier C (Fallback):  {'✓ Configured' if tier_info['fallback']['configured'] else '✗ Not configured'}")
    print(f"  Model: {tier_info['fallback']['model']}")

    return tier_info


async def test_successful_call(llm: LLMService):
    """Test a successful LLM call with all tiers available."""
    print("\n" + "=" * 60)
    print("TEST 2: Successful LLM Call")
    print("=" * 60)

    messages = [
        {"role": "system", "content": "You are a helpful weather assistant."},
        {"role": "user", "content": "Say 'Hello from WeatherGPT' in one sentence."}
    ]

    try:
        response = await llm.call_llm(messages, temperature=0.7, max_tokens=50)
        print(f"\n✓ Response: {response}")
        print(f"✓ Tier used: {llm.last_tier_used}")
        return True
    except Exception as e:
        print(f"\n✗ Failed: {e}")
        return False


async def test_fallback_with_mock_failure():
    """Test fallback behavior by simulating primary failure."""
    print("\n" + "=" * 60)
    print("TEST 3: Fallback Chain (Simulated Primary Failure)")
    print("=" * 60)

    # Temporarily disable primary by clearing API key
    original_primary_key = os.getenv("LLM_PRIMARY_API_KEY")
    os.environ["LLM_PRIMARY_API_KEY"] = ""

    llm = LLMService()
    messages = [
        {"role": "system", "content": "You are a weather assistant."},
        {"role": "user", "content": "Respond with 'Fallback test successful' in one sentence."}
    ]

    try:
        response = await llm.call_llm(messages, temperature=0.7, max_tokens=50)
        print(f"\n✓ Fallback worked!")
        print(f"✓ Response: {response}")
        print(f"✓ Tier used: {llm.last_tier_used}")
        success = llm.last_tier_used != "primary"
    except Exception as e:
        print(f"\n✗ Fallback failed: {e}")
        success = False
    finally:
        # Restore original key
        if original_primary_key:
            os.environ["LLM_PRIMARY_API_KEY"] = original_primary_key

    return success


async def test_ollama_directly():
    """Test Ollama (Tier C) directly if configured."""
    print("\n" + "=" * 60)
    print("TEST 4: Direct Ollama Test (Tier C)")
    print("=" * 60)

    if not os.getenv("LLM_FALLBACK_BASE_URL"):
        print("\n⚠ Ollama not configured (LLM_FALLBACK_BASE_URL not set)")
        return None

    # Create LLM service with only fallback configured
    original_primary_key = os.getenv("LLM_PRIMARY_API_KEY")
    original_secondary_key = os.getenv("LLM_SECONDARY_API_KEY")

    os.environ["LLM_PRIMARY_API_KEY"] = ""
    os.environ["LLM_SECONDARY_API_KEY"] = ""

    llm = LLMService()
    messages = [
        {"role": "system", "content": "You are a weather assistant."},
        {"role": "user", "content": "Say 'Ollama is working' in exactly one sentence."}
    ]

    try:
        response = await llm.call_llm(messages, temperature=0.5, max_tokens=30)
        print(f"\n✓ Ollama is functional!")
        print(f"✓ Response: {response}")
        print(f"✓ Model: {llm.fallback_model}")
        success = True
    except Exception as e:
        print(f"\n✗ Ollama test failed: {e}")
        print("\nTroubleshooting:")
        print("  1. Check if Ollama container is running: docker-compose ps ollama")
        print("  2. Check Ollama logs: docker-compose logs ollama")
        print("  3. Verify model is pulled: docker-compose exec ollama ollama list")
        print(f"  4. Try manually: docker-compose exec ollama ollama pull {llm.fallback_model}")
        success = False
    finally:
        # Restore original keys
        if original_primary_key:
            os.environ["LLM_PRIMARY_API_KEY"] = original_primary_key
        if original_secondary_key:
            os.environ["LLM_SECONDARY_API_KEY"] = original_secondary_key

    return success


async def main():
    """Run all fallback chain tests."""
    print("\n" + "=" * 60)
    print("WeatherGPT LLM Three-Tier Fallback Chain Test")
    print("=" * 60)

    results = {}

    # Test 1: Configuration
    tier_info = await test_tier_configuration()
    results['configuration'] = any([
        tier_info['primary']['configured'],
        tier_info['secondary']['configured'],
        tier_info['fallback']['configured']
    ])

    # Test 2: Successful call with available tiers
    llm = LLMService()
    results['successful_call'] = await test_successful_call(llm)

    # Test 3: Fallback behavior
    if tier_info['secondary']['configured'] or tier_info['fallback']['configured']:
        results['fallback'] = await test_fallback_with_mock_failure()
    else:
        print("\n⚠ Skipping fallback test (no secondary/fallback tiers configured)")
        results['fallback'] = None

    # Test 4: Direct Ollama test
    if tier_info['fallback']['configured']:
        results['ollama_direct'] = await test_ollama_directly()
    else:
        print("\n⚠ Skipping Ollama direct test (Tier C not configured)")
        results['ollama_direct'] = None

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)

    for test_name, result in results.items():
        if result is None:
            status = "⊘ SKIPPED"
        elif result:
            status = "✓ PASSED"
        else:
            status = "✗ FAILED"
        print(f"{status:12} {test_name.replace('_', ' ').title()}")

    print("\n" + "=" * 60)

    # Overall result
    passed = sum(1 for r in results.values() if r is True)
    total = sum(1 for r in results.values() if r is not None)

    if total == 0:
        print("⚠ No tiers configured. Please set up at least one LLM provider.")
        sys.exit(1)
    elif passed == total:
        print(f"✓ All tests passed ({passed}/{total})")
        sys.exit(0)
    else:
        print(f"⚠ Some tests failed ({passed}/{total} passed)")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
