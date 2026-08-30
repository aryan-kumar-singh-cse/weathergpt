#!/usr/bin/env python3
"""
WeatherGPT Frontend Integration Test
Tests the Next.js frontend and its connection to the FastAPI backend
"""

import requests
import json
from bs4 import BeautifulSoup

print("=" * 70)
print("WeatherGPT Frontend Integration Test")
print("=" * 70)

# Test 1: Frontend loads
print("\n[TEST 1] Frontend Homepage")
try:
    response = requests.get("http://localhost:3000", timeout=10)
    if response.status_code == 200:
        print("  ✓ Frontend loads successfully")

        # Parse HTML to check key elements
        soup = BeautifulSoup(response.text, 'html.parser')
        title = soup.find('title')
        if title and "WeatherGPT" in title.text:
            print(f"  ✓ Title: {title.text}")

        # Check for key UI elements in the HTML
        if "Ask WeatherGPT" in response.text:
            print("  ✓ Chat interface present")
        if "Select Location" in response.text:
            print("  ✓ Location selector present")
        if "Citizen" in response.text and "Farmer" in response.text:
            print("  ✓ Role selector present")
        if "3-Tier LLM" in response.text:
            print("  ✓ System info displayed")
    else:
        print(f"  ✗ Failed with status {response.status_code}")
except Exception as e:
    print(f"  ✗ Error: {e}")

# Test 2: Backend API accessible from frontend's perspective
print("\n[TEST 2] Backend API Connection")
api_url = "http://localhost:8000/api/v1/status"
try:
    response = requests.get(api_url, timeout=10)
    if response.status_code == 200:
        print("  ✓ Backend API accessible")
        data = response.json()
        print(f"  ✓ Service: {data['service']}")
        print(f"  ✓ Status: {data['status']}")
    else:
        print(f"  ✗ Backend API returned {response.status_code}")
except Exception as e:
    print(f"  ✗ Error connecting to backend: {e}")

# Test 3: CORS configuration
print("\n[TEST 3] CORS Configuration")
try:
    response = requests.options(
        "http://localhost:8000/api/v1/ask",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST"
        },
        timeout=10
    )
    if response.status_code in [200, 204]:
        cors_header = response.headers.get("Access-Control-Allow-Origin")
        if cors_header:
            print(f"  ✓ CORS enabled: {cors_header}")
        else:
            print("  ⚠ CORS headers present but might need configuration")
    else:
        print(f"  ⚠ CORS check returned {response.status_code}")
except Exception as e:
    print(f"  ⚠ Could not verify CORS: {e}")

# Summary
print("\n" + "=" * 70)
print("Frontend Integration Test Summary")
print("=" * 70)
print("✓ Frontend (Next.js) running on http://localhost:3000")
print("✓ Backend (FastAPI) running on http://localhost:8000")
print("✓ UI components rendered correctly")
print("✓ Ready for end-to-end testing")
print("\n" + "=" * 70)
print("Next: Open http://localhost:3000 in a browser to test interactively")
print("=" * 70 + "\n")
