#!/usr/bin/env python3
"""
WeatherGPT Comprehensive System Check
Tests all backend features and generates a status report
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api/v1"

def print_header(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def test_endpoint(name, method, url, data=None, headers=None, timeout=30):
    """Test an endpoint and return result."""
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=timeout)
        else:
            response = requests.post(url, json=data, headers=headers, timeout=timeout)

        if response.status_code == 200:
            print(f"✓ {name}")
            return True, response.json()
        else:
            print(f"✗ {name} - Status {response.status_code}")
            return False, None
    except Exception as e:
        print(f"✗ {name} - Error: {str(e)[:50]}")
        return False, None

print("="*70)
print("  WeatherGPT System Comprehensive Check")
print("  Date:", datetime.utcnow().isoformat())
print("="*70)

results = {
    "backend": {"total": 0, "passed": 0, "failed": 0},
    "features": {"total": 0, "passed": 0, "failed": 0},
    "endpoints": []
}

# BACKEND CORE TESTS
print_header("1. Backend Core Services")

tests = [
    ("Health Check", "GET", f"{BASE_URL}/health"),
    ("API Status", "GET", f"{API_URL}/status"),
    ("Root Endpoint", "GET", f"{BASE_URL}/"),
]

for name, method, url in tests:
    success, data = test_endpoint(name, method, url)
    results["backend"]["total"] += 1
    if success:
        results["backend"]["passed"] += 1
    else:
        results["backend"]["failed"] += 1

# WEATHER DATA TESTS
print_header("2. Weather Data Services")

tests = [
    ("Current Weather - Mumbai", "GET", f"{API_URL}/weather/current?city=Mumbai"),
    ("Current Weather - Delhi", "GET", f"{API_URL}/weather/current?city=Delhi"),
    ("7-Day Forecast", "GET", f"{API_URL}/weather/forecast/daily?city=Bangalore&days=7"),
    ("Weather Alerts", "GET", f"{API_URL}/weather/alerts?city=Chennai"),
    ("Geocoding", "GET", f"{API_URL}/weather/geocode?city=Kolkata"),
]

for name, method, url in tests:
    success, data = test_endpoint(name, method, url)
    results["features"]["total"] += 1
    if success:
        results["features"]["passed"] += 1
    else:
        results["features"]["failed"] += 1

# CONVERSATIONAL AI TEST
print_header("3. Conversational AI (LLM Integration)")

session_id = "comprehensive-test-session"
queries = [
    ("Simple Query", {
        "query": "What's the weather in Mumbai?",
        "language": "en",
        "role": "citizen"
    }),
    ("Hindi Query", {
        "query": "दिल्ली में मौसम कैसा है?",
        "language": "hi",
        "role": "citizen"
    }),
    ("Farmer Query", {
        "query": "Should I irrigate today in Pune?",
        "language": "en",
        "role": "farmer"
    }),
]

for name, data in queries:
    success, response = test_endpoint(
        name,
        "POST",
        f"{API_URL}/ask",
        data=data,
        headers={"X-Session-ID": session_id},
        timeout=30
    )
    results["features"]["total"] += 1
    if success:
        results["features"]["passed"] += 1
        if response:
            print(f"    LLM Tier: {response.get('llm_tier_used', 'N/A')}")
            print(f"    Response: {response.get('response', '')[:60]}...")
    else:
        results["features"]["failed"] += 1

# CONVERSATION HISTORY TESTS
print_header("4. Conversation History (Database)")

tests = [
    ("Get Conversation Stats", "GET", f"{API_URL}/conversations/stats",
     None, {"X-Session-ID": session_id}),
    ("Get Conversation History", "GET", f"{API_URL}/conversations/history",
     None, {"X-Session-ID": session_id}),
]

for name, method, url, data, headers in tests:
    success, response = test_endpoint(name, method, url, data, headers)
    results["features"]["total"] += 1
    if success:
        results["features"]["passed"] += 1
        if response and "message_count" in response:
            print(f"    Messages: {response['message_count']}")
    else:
        results["features"]["failed"] += 1

# VOICE FEATURES TESTS
print_header("5. Voice Features (STT/TTS)")

tests = [
    ("Voice Service Info", "GET", f"{API_URL}/voice/"),
    ("Voice Test Status", "GET", f"{API_URL}/voice/test"),
    ("Voice Languages", "GET", f"{API_URL}/voice/languages"),
    ("TTS Synthesis", "POST", f"{API_URL}/voice/tts", {
        "text": "Hello, the weather is sunny today",
        "language": "en",
        "voice_gender": "female"
    }),
]

for item in tests:
    if len(item) == 3:
        name, method, url = item
        data = None
    else:
        name, method, url, data = item

    success, response = test_endpoint(name, method, url, data)
    results["features"]["total"] += 1
    if success:
        results["features"]["passed"] += 1
    else:
        results["features"]["failed"] += 1

# SMS ALERTS TESTS
print_header("6. SMS Alert Notifications")

tests = [
    ("SMS Service Info", "GET", f"{API_URL}/sms/"),
    ("SMS Configuration", "GET", f"{API_URL}/sms/config"),
    ("SMS Test Message", "POST", f"{API_URL}/sms/test", {
        "phone_number": "+919876543210",
        "message": "Test alert from WeatherGPT"
    }),
    ("Weather Alert SMS", "POST", f"{API_URL}/sms/alert", {
        "phone_number": "+919876543210",
        "location": "Mumbai",
        "severity": "warning",
        "alert_type": "rain",
        "summary": "Heavy rainfall expected"
    }, {"X-Session-ID": session_id}),
    ("Alert History", "GET", f"{API_URL}/sms/history",
     None, {"X-Session-ID": session_id}),
]

for item in tests:
    if len(item) == 3:
        name, method, url = item
        data, headers = None, None
    elif len(item) == 4:
        name, method, url, data = item
        headers = None
    else:
        name, method, url, data, headers = item

    success, response = test_endpoint(name, method, url, data, headers)
    results["features"]["total"] += 1
    if success:
        results["features"]["passed"] += 1
    else:
        results["features"]["failed"] += 1

# SUMMARY
print_header("Test Summary")

total_tests = results["backend"]["total"] + results["features"]["total"]
total_passed = results["backend"]["passed"] + results["features"]["passed"]
total_failed = results["backend"]["failed"] + results["features"]["failed"]

print(f"\nBackend Core:  {results['backend']['passed']}/{results['backend']['total']} passed")
print(f"Features:      {results['features']['passed']}/{results['features']['total']} passed")
print(f"\nTotal:         {total_passed}/{total_tests} passed")
print(f"Success Rate:  {(total_passed/total_tests*100):.1f}%")

if total_failed == 0:
    print("\n🎉 ALL TESTS PASSED! System is fully operational.")
else:
    print(f"\n⚠️  {total_failed} test(s) failed. Review logs above.")

print("\n" + "="*70)
print("Check complete!")
print("="*70)
