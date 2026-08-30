#!/bin/bash
# Test Suite Runner for WeatherGPT
# Installs dependencies if needed and runs tests

set -e

PROJECT_ROOT="/home/piyushxdev/SIH/weather-gpt"
cd "$PROJECT_ROOT"

echo "================================"
echo "WeatherGPT Test Suite Runner"
echo "================================"
echo ""

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Creating..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "✓ Activating virtual environment..."
source venv/bin/activate

# Check if pytest is installed
if ! python -c "import pytest" 2>/dev/null; then
    echo "⚠️  pytest not found. Installing test dependencies..."
    pip install -q pytest pytest-asyncio pytest-cov pytest-mock faker httpx
    echo "✓ Test dependencies installed"
fi

echo ""
echo "================================"
echo "Running Test Suite"
echo "================================"
echo ""

# Run tests based on argument
case "${1:-all}" in
    "all")
        echo "Running all tests..."
        python -m pytest backend/tests/ -v
        ;;
    "fast")
        echo "Running fast unit tests..."
        python -m pytest backend/tests/ -v -m "not integration" --no-cov
        ;;
    "coverage")
        echo "Running tests with coverage..."
        python -m pytest backend/tests/ -v --cov=backend --cov-report=term-missing --cov-report=html
        echo ""
        echo "✓ Coverage report generated at htmlcov/index.html"
        ;;
    "api")
        echo "Running API tests..."
        python -m pytest backend/tests/test_api.py -v
        ;;
    "llm")
        echo "Running LLM fallback tests..."
        python -m pytest backend/tests/test_llm_fallback.py -v
        ;;
    "severity")
        echo "Running severity classification tests..."
        python -m pytest backend/tests/test_severity.py -v
        ;;
    "integration")
        echo "Running integration tests..."
        python -m pytest backend/tests/test_integration.py -v
        ;;
    "auth")
        echo "Running authentication tests..."
        python -m pytest backend/tests/test_auth.py -v
        ;;
    *)
        echo "Running custom test: $1"
        python -m pytest "backend/tests/$1" -v
        ;;
esac

echo ""
echo "================================"
echo "Test Suite Complete"
echo "================================"
