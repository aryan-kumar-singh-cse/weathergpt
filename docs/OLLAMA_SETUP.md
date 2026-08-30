# Ollama Setup Guide - WeatherGPT Tier C Fallback

This guide covers setting up and testing Ollama as the Tier C (local, offline-capable) fallback for WeatherGPT's three-tier LLM architecture.

## Overview

WeatherGPT uses a three-tier LLM fallback chain:

- **Tier A (Primary)**: Groq API - Fast cloud inference
- **Tier B (Secondary)**: Google Gemini - Reliable cloud alternative  
- **Tier C (Fallback)**: Ollama - Local, offline-capable

Ollama provides resilience by ensuring the system remains functional even when:
- Internet connectivity is unavailable
- Cloud API rate limits are exceeded
- External services experience downtime
- Demonstrating in environments without internet access

## Quick Start

### 1. Automatic Setup (Recommended)

The Docker Compose configuration automatically sets up Ollama:

```bash
# Start all services including Ollama
docker-compose up -d

# First startup will automatically pull the configured model
# This takes 2-5 minutes depending on your internet speed
docker-compose logs -f ollama
```

### 2. Verify Installation

```bash
# Check Ollama is running
docker-compose ps ollama

# Verify model is available
docker-compose exec ollama ollama list

# Test Ollama API
curl http://localhost:11434/api/tags
```

### 3. Run Comprehensive Tests

```bash
# Run automated fallback chain test
python3 test_llm_fallback.py

# Run manual Ollama verification
bash scripts/test-ollama-fallback.sh
```

## Model Configuration

### Default Model

The default model is `bonsai:1b` - a lightweight 1.5GB model optimized for speed and efficiency.

### Changing the Model

Edit `.env` file:

```bash
# Choose a model based on your requirements
LLM_FALLBACK_MODEL=bonsai:1b
OLLAMA_MODEL=bonsai:1b
```

### Recommended Models

| Model | Size | Use Case | Quality | Speed |
|-------|------|----------|---------|-------|
| `bonsai:1b` | 1.5GB | **Hackathon/Demo** | Good | Very Fast |
| `llama3.2:1b` | 1.3GB | Lightweight | Good | Very Fast |
| `qwen2.5:1.5b` | 1.5GB | Balanced | Good | Fast |
| `llama3.2:3b` | 2GB | Better quality | Better | Fast |
| `bonsai:4b` | 4GB | **Best quality** | Excellent | Medium |

### Model License Considerations

Before production deployment:
- **Bonsai**: Apache 2.0 license (permissive)
- **Llama 3.2**: Meta Llama 3 Community License (permissive for most uses)
- **Qwen**: Apache 2.0 license (permissive)

Always verify current license terms at [Ollama Model Library](https://ollama.com/library).

## Manual Model Management

### Pull a Specific Model

```bash
# Pull a model manually
docker-compose exec ollama ollama pull llama3.2:3b

# List all available models
docker-compose exec ollama ollama list

# Remove unused models
docker-compose exec ollama ollama rm llama3.2:1b
```

### Pull Multiple Models

For redundancy, you can keep multiple models:

```bash
docker-compose exec ollama ollama pull bonsai:1b
docker-compose exec ollama ollama pull llama3.2:3b
```

Then switch between them by changing `LLM_FALLBACK_MODEL` in `.env`.

## Testing the Fallback Chain

### Test 1: Verify All Tiers

```bash
# Run comprehensive fallback test
python3 test_llm_fallback.py
```

Expected output:
```
✓ PASSED Configuration
✓ PASSED Successful Call
✓ PASSED Fallback
✓ PASSED Ollama Direct
```

### Test 2: Force Tier C Usage

To test offline capability:

```bash
# Temporarily disable cloud providers
cp .env .env.backup
sed -i 's/^LLM_PRIMARY_API_KEY=/#LLM_PRIMARY_API_KEY=/' .env
sed -i 's/^LLM_SECONDARY_API_KEY=/#LLM_SECONDARY_API_KEY=/' .env

# Restart backend
docker-compose restart backend

# Make a test request
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "city": "Delhi"}'

# Check logs - should show "tier: fallback"
docker-compose logs backend | grep "tier:"

# Restore API keys
mv .env.backup .env
docker-compose restart backend
```

### Test 3: Direct Ollama API Test

```bash
# Test Ollama's OpenAI-compatible API directly
curl http://localhost:11434/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "bonsai:1b",
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello in one sentence."}
    ],
    "max_tokens": 50
  }'
```

## Offline Demo Instructions

For hackathon demonstrations or offline environments:

### Preparation (While Online)

```bash
# 1. Pull the model
docker-compose up -d ollama
docker-compose exec ollama ollama pull bonsai:1b

# 2. Verify model is ready
docker-compose exec ollama ollama list

# 3. Test the system
python3 test_llm_fallback.py
```

### Demo (Offline)

```bash
# 1. Disconnect from internet or disable API keys
cp .env .env.backup
sed -i 's/^LLM_PRIMARY_API_KEY=/#LLM_PRIMARY_API_KEY=/' .env
sed -i 's/^LLM_SECONDARY_API_KEY=/#LLM_SECONDARY_API_KEY=/' .env

# 2. Restart services
docker-compose restart backend

# 3. Access application at http://localhost:3000
# All queries will now use local Ollama (Tier C)

# 4. Show fallback in logs
docker-compose logs -f backend | grep "LLM call successful"
# Should show: "✓ LLM call successful (tier: fallback)"
```

## Troubleshooting

### Problem: Ollama container fails to start

**Solution:**
```bash
# Check logs
docker-compose logs ollama

# Common issue: insufficient memory
# Bonsai 1B requires ~2GB RAM
# Solution: Close other applications or use a smaller model
```

### Problem: Model not found

**Solution:**
```bash
# List available models
docker-compose exec ollama ollama list

# If model is missing, pull it
docker-compose exec ollama ollama pull bonsai:1b

# Verify model name matches .env configuration
grep LLM_FALLBACK_MODEL .env
```

### Problem: Ollama API not responding

**Solution:**
```bash
# Check container health
docker-compose ps ollama

# Restart Ollama
docker-compose restart ollama

# Wait for health check
docker-compose logs -f ollama

# Test API endpoint
curl http://localhost:11434/api/tags
```

### Problem: Backend not using Ollama fallback

**Solution:**
```bash
# Check environment variables
docker-compose exec backend env | grep LLM_FALLBACK

# Should show:
# LLM_FALLBACK_BASE_URL=http://ollama:11434/v1
# LLM_FALLBACK_MODEL=bonsai:1b

# If incorrect, fix .env and restart
docker-compose restart backend
```

### Problem: Slow inference with Ollama

**Solutions:**
1. Use a smaller model (bonsai:1b or llama3.2:1b)
2. Increase Docker memory allocation
3. Close other applications
4. Consider using GPU acceleration (requires ollama-gpu image)

### Problem: "Connection refused" to Ollama

**Solution:**
```bash
# Check Ollama is on the same network
docker-compose exec backend ping ollama

# Should respond with packets
# If not, recreate network
docker-compose down
docker-compose up -d
```

## Performance Considerations

### Model Size vs Performance

| Model | RAM Required | Cold Start | Inference Time | Quality |
|-------|--------------|------------|----------------|---------|
| bonsai:1b | ~2GB | 1-2s | 50-100ms/token | Good |
| llama3.2:3b | ~4GB | 2-3s | 100-200ms/token | Better |
| bonsai:4b | ~5GB | 3-4s | 150-250ms/token | Best |

### Optimization Tips

1. **Keep model loaded**: Ollama keeps models in memory for 5 minutes after last use (configurable via `OLLAMA_KEEP_ALIVE`)

2. **Reduce max_tokens**: Lower `max_tokens` in LLM requests for faster responses:
   ```python
   # In backend/services/llm_service.py
   max_tokens=500  # Reduce from default 1000
   ```

3. **Adjust temperature**: Lower temperature = faster inference:
   ```python
   temperature=0.5  # Reduce from 0.7 for faster, more deterministic output
   ```

## Advanced Configuration

### Custom Ollama Settings

Edit `docker-compose.yml` to customize Ollama behavior:

```yaml
ollama:
  environment:
    OLLAMA_HOST: 0.0.0.0:11434
    OLLAMA_KEEP_ALIVE: 10m        # Keep model loaded longer
    OLLAMA_NUM_PARALLEL: 1        # Number of parallel requests
    OLLAMA_MAX_LOADED_MODELS: 1   # Max models in memory
```

### GPU Acceleration (Optional)

For faster inference with NVIDIA GPU:

```yaml
ollama:
  image: ollama/ollama:latest
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

Requires: NVIDIA Docker runtime installed.

## Production Considerations

### Security

- Ollama container is isolated on private Docker network
- Port 11434 is exposed only to host (not internet-accessible)
- No API key required (local-only access)

### Storage

- Models are persisted in Docker volume `ollama_data`
- Volume persists across container restarts
- To reset: `docker volume rm weathergpt_ollama_data`

### Monitoring

Add health checks to your monitoring:

```bash
# Endpoint: http://localhost:11434/api/tags
# Expected: 200 OK with model list
```

### Backup

Models are stored in Docker volume. To backup:

```bash
# Backup volume
docker run --rm -v weathergpt_ollama_data:/data \
  -v $(pwd):/backup alpine tar czf /backup/ollama-models.tar.gz -C /data .

# Restore volume
docker run --rm -v weathergpt_ollama_data:/data \
  -v $(pwd):/backup alpine tar xzf /backup/ollama-models.tar.gz -C /data
```

## References

- [Ollama Documentation](https://ollama.com/docs)
- [Ollama Model Library](https://ollama.com/library)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [OpenAI API Compatibility](https://ollama.com/blog/openai-compatibility)

## Support

For issues specific to WeatherGPT's Ollama integration:
- Check [backend/services/llm_service.py](../backend/services/llm_service.py) for implementation
- Review logs: `docker-compose logs backend ollama`
- Run tests: `python3 test_llm_fallback.py`

---

**Last Updated**: 2026-08-29  
**WeatherGPT Version**: 1.0  
**Ollama Version**: latest
