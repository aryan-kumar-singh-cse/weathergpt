#!/usr/bin/env python3
"""
WeatherGPT Server Startup Script
Loads environment variables and starts uvicorn server
"""

import os
import sys
from dotenv import load_dotenv

# Add project root to path
sys.path.insert(0, os.path.dirname(__file__))

# Load environment variables from .env
load_dotenv()

# Verify LLM configuration
print("=" * 70)
print("WeatherGPT Server Starting...")
print("=" * 70)
print(f"LLM Primary Model: {os.getenv('LLM_PRIMARY_MODEL', 'NOT SET')}")
print(f"LLM Primary API Key: {'SET' if os.getenv('LLM_PRIMARY_API_KEY') else 'NOT SET'}")
print(f"LLM Secondary Model: {os.getenv('LLM_SECONDARY_MODEL', 'NOT SET')}")
print(f"LLM Secondary API Key: {'SET' if os.getenv('LLM_SECONDARY_API_KEY') else 'NOT SET'}")
print("=" * 70)

# Import and run uvicorn
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "backend.api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
