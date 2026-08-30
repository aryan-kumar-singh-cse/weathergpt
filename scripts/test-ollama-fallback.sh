#!/bin/bash
# Test Ollama Tier C Fallback - WeatherGPT
# This script helps verify the three-tier LLM fallback chain

set -e

echo "=========================================="
echo "WeatherGPT Ollama Tier C Fallback Test"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker Compose is running
if ! docker-compose ps | grep -q "weathergpt-ollama"; then
    echo -e "${RED}✗ Ollama container is not running${NC}"
    echo "Start it with: docker-compose up -d ollama"
    exit 1
fi

echo -e "${GREEN}✓ Ollama container is running${NC}"
echo ""

# Check Ollama health
echo "Checking Ollama health..."
if docker-compose exec -T ollama curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Ollama API is healthy${NC}"
else
    echo -e "${RED}✗ Ollama API is not responding${NC}"
    echo "Check logs with: docker-compose logs ollama"
    exit 1
fi
echo ""

# List available models
echo "Available Ollama models:"
docker-compose exec -T ollama ollama list
echo ""

# Check if the configured model exists
MODEL=$(grep "^LLM_FALLBACK_MODEL=" .env 2>/dev/null | cut -d'=' -f2)
if [ -z "$MODEL" ]; then
    MODEL="bonsai:1b"
    echo -e "${YELLOW}⚠ LLM_FALLBACK_MODEL not set in .env, using default: $MODEL${NC}"
fi

echo "Configured fallback model: $MODEL"
if docker-compose exec -T ollama ollama list | grep -q "$MODEL"; then
    echo -e "${GREEN}✓ Model $MODEL is available${NC}"
else
    echo -e "${YELLOW}⚠ Model $MODEL not found. Pulling it now...${NC}"
    docker-compose exec -T ollama ollama pull "$MODEL"
    echo -e "${GREEN}✓ Model pulled successfully${NC}"
fi
echo ""

# Test direct Ollama call
echo "Testing direct Ollama API call..."
RESPONSE=$(docker-compose exec -T ollama curl -s http://localhost:11434/v1/chat/completions \
    -H "Content-Type: application/json" \
    -d '{
        "model": "'"$MODEL"'",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Say hello in exactly one sentence."}
        ],
        "max_tokens": 50,
        "temperature": 0.7
    }')

if echo "$RESPONSE" | grep -q "choices"; then
    echo -e "${GREEN}✓ Direct Ollama API call successful${NC}"
    echo "Response preview:"
    echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['choices'][0]['message']['content'])" 2>/dev/null || echo "$RESPONSE"
else
    echo -e "${RED}✗ Direct Ollama API call failed${NC}"
    echo "Response: $RESPONSE"
    exit 1
fi
echo ""

# Test through backend
echo "Testing through WeatherGPT backend..."
if docker-compose ps | grep -q "weathergpt-backend"; then
    echo "Checking backend health..."
    if curl -sf http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is healthy${NC}"

        # Make a test request
        echo "Sending test query to backend..."
        BACKEND_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/chat \
            -H "Content-Type: application/json" \
            -d '{
                "message": "What is the weather like?",
                "city": "Delhi",
                "language": "en",
                "role": "citizen"
            }')

        if echo "$BACKEND_RESPONSE" | grep -q "response"; then
            echo -e "${GREEN}✓ Backend API call successful${NC}"
            echo ""
            echo "To verify which tier was used, check backend logs:"
            echo "  docker-compose logs backend | grep 'LLM call successful'"
        else
            echo -e "${YELLOW}⚠ Backend API call returned unexpected response${NC}"
            echo "Response: $BACKEND_RESPONSE"
        fi
    else
        echo -e "${YELLOW}⚠ Backend is not responding${NC}"
        echo "Start it with: docker-compose up -d backend"
    fi
else
    echo -e "${YELLOW}⚠ Backend container is not running${NC}"
    echo "Start it with: docker-compose up -d"
fi
echo ""

# Instructions for offline testing
echo "=========================================="
echo "Testing Offline Fallback (Optional)"
echo "=========================================="
echo ""
echo "To test the fallback chain in offline mode:"
echo ""
echo "1. Temporarily disable primary and secondary tiers:"
echo "   Edit .env and comment out:"
echo "     # LLM_PRIMARY_API_KEY=..."
echo "     # LLM_SECONDARY_API_KEY=..."
echo ""
echo "2. Restart the backend:"
echo "   docker-compose restart backend"
echo ""
echo "3. Make a request (it should use Tier C - Ollama):"
echo "   curl -X POST http://localhost:8000/api/v1/chat \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"message\": \"Hello\", \"city\": \"Delhi\"}'"
echo ""
echo "4. Check logs to verify Tier C was used:"
echo "   docker-compose logs backend | grep 'tier: fallback'"
echo ""
echo "5. Re-enable API keys in .env and restart"
echo ""

echo "=========================================="
echo "✓ Ollama Tier C fallback test complete"
echo "=========================================="
