# WeatherGPT Test Suite Documentation

## Overview

Comprehensive automated test suite for WeatherGPT backend, covering API contracts, LLM fallback resilience, severity classification, and end-to-end integration flows.

## Test Philosophy

This test suite follows **Test Automation Engineer** principles:

- **No hard sleeps**: All async tests use condition-based waits, never wall-clock time
- **Tests own their data**: Each test creates its own data via fixtures - no shared state between tests
- **Deterministic by design**: Mocks return known values, not random data
- **Isolated database per test**: In-memory SQLite ensures test independence
- **10x repeatability**: Every test runs green 10 times in a row locally and in CI
- **Failure artifacts**: Clear assertions that make failures debuggable without re-runs

## Test Structure

```
backend/tests/
├── __init__.py                  # Package marker
├── conftest.py                  # Shared fixtures and test configuration
├── pytest.ini                   # Pytest settings
├── test_api.py                  # API contract tests (100+ assertions)
├── test_llm_fallback.py         # Three-tier LLM fallback tests
├── test_severity.py             # Severity classification threshold tests
├── test_integration.py          # End-to-end integration tests
└── test_auth.py                 # Session management tests
```

## Running Tests

### Install Test Dependencies

```bash
pip install -r requirements.txt
```

Required packages:
- `pytest==7.4.3` - Test framework
- `pytest-asyncio==0.23.3` - Async test support
- `pytest-cov==4.1.0` - Coverage reporting
- `pytest-mock==3.12.0` - Mocking utilities
- `faker==20.1.0` - Test data generation

### Quick Start

```bash
# Run all tests
pytest backend/tests/ -v

# Run with coverage report
pytest backend/tests/ -v --cov=backend --cov-report=html

# Run specific test file
pytest backend/tests/test_api.py -v

# Run specific test class
pytest backend/tests/test_api.py::TestAskEndpoint -v

# Run specific test
pytest backend/tests/test_api.py::TestAskEndpoint::test_ask_with_valid_inputs -v
```

### Using Test Runner Script

```bash
# Run all tests
python run_tests.py

# Run fast unit tests only (skip integration)
python run_tests.py fast

# Run integration tests only
python run_tests.py integration

# Run with coverage report
python run_tests.py coverage

# Run specific test file
python run_tests.py test_api.py
```

## Test Coverage

### 1. API Contract Tests (`test_api.py`)

**Purpose**: Validate `/api/ask` endpoint behavior with valid and invalid inputs.

**Coverage**:
- ✅ Valid query with all required fields
- ✅ Empty query returns 400 error
- ✅ Whitespace-only query returns 400 error
- ✅ Invalid role returns 400 error
- ✅ All valid roles are accepted (citizen, farmer, pilot, disaster-manager)
- ✅ Unsupported language falls back to English
- ✅ Missing location returns 404 error
- ✅ Request without session ID creates anonymous session
- ✅ Response schema compliance (all required fields present)
- ✅ `/api/v1/ask/capabilities` endpoint returns system features
- ✅ `/api/v1/ask/examples` endpoint returns example queries
- ✅ Health check endpoints (`/`, `/health`, `/api/v1/status`)

**Key Test Example**:
```python
def test_ask_with_valid_inputs(client, sample_session_id, mock_weather_data):
    """Test /api/ask with valid query, role, and language."""
    response = client.post(
        "/api/v1/ask",
        json={
            "query": "What's the weather in Mumbai?",
            "language": "en",
            "role": "citizen"
        },
        headers={"X-Session-ID": sample_session_id}
    )
    
    assert response.status_code == 200
    assert "weather" in response.json()
    assert "severity" in response.json()
```

### 2. LLM Fallback Tests (`test_llm_fallback.py`)

**Purpose**: Validate three-tier LLM provider fallback chain resilience.

**Coverage**:
- ✅ Primary tier success (no fallback)
- ✅ Fallback to secondary on primary failure
- ✅ Fallback to tertiary on primary + secondary failure
- ✅ Exception raised when all three tiers fail
- ✅ Timeout handling (8s per tier)
- ✅ JSON mode parameter passed correctly
- ✅ Temperature and max_tokens parameters
- ✅ Tier info returns current configuration
- ✅ Message context preserved across tier fallbacks
- ✅ Concurrent requests maintain separate tier tracking

**Key Test Example**:
```python
async def test_fallback_to_secondary_on_primary_failure(llm_service):
    """Test that secondary tier is used when primary fails."""
    # Mock primary to fail
    mock_primary.side_effect = Exception("Primary API error")
    
    # Mock secondary to succeed
    mock_secondary.return_value = "Secondary tier response"
    
    result = await llm_service.call_llm(messages)
    
    assert result == "Secondary tier response"
    assert llm_service.last_tier_used == "secondary"
```

### 3. Severity Classification Tests (`test_severity.py`)

**Purpose**: Validate weather severity thresholds and alert generation.

**Coverage**:
- ✅ Normal conditions (no alerts)
- ✅ Extreme heat threshold (≥ 45°C)
- ✅ High heat warning (≥ 40°C, < 45°C)
- ✅ Frost/freeze warning (≤ 0°C)
- ✅ High wind warning (≥ 62 km/h)
- ✅ Strong winds (≥ 40 km/h, < 62 km/h)
- ✅ Heavy rain warning (≥ 80% probability AND ≥ 100mm)
- ✅ Moderate rain expected (≥ 70% probability AND ≥ 50mm)
- ✅ High probability alone doesn't trigger alert
- ✅ High accumulation alone doesn't trigger alert
- ✅ Multiple conditions result in highest severity
- ✅ All hazards combined (worst-case scenario)
- ✅ Edge cases just below thresholds
- ✅ Forecast beyond 3 days not checked
- ✅ WMO weather code descriptions

**Key Test Example**:
```python
def test_extreme_heat_threshold(mock_weather_data):
    """Test extreme heat classification (≥ 45°C)."""
    weather = mock_weather_data(temperature=45, wind_speed=15)
    severity = weather_service.classify_severity(weather)
    
    assert severity["severity"] == "extreme"
    assert any("Extreme heat" in alert for alert in severity["alerts"])
```

**Parameterized Tests**:
```python
@pytest.mark.parametrize("temperature,wind_speed,expected_severity", [
    (27, 15, "normal"),
    (40, 15, "warning"),
    (45, 15, "extreme"),
    (27, 62, "severe"),
])
def test_severity_thresholds(temperature, wind_speed, expected_severity):
    """Test various severity threshold combinations."""
```

### 4. Integration Tests (`test_integration.py`)

**Purpose**: End-to-end query flow with database persistence.

**Coverage**:
- ✅ Complete query flow (intent → geocode → weather → response → save)
- ✅ Multiple queries in same session maintain history
- ✅ Role-specific response generation
- ✅ Severe weather classification in flow
- ✅ Nationwide query uses default coordinates (no geocoding)
- ✅ Database failure doesn't break request
- ✅ Conversation history persistence
- ✅ Message ordering

**Key Test Example**:
```python
async def test_complete_query_flow_with_persistence(client, db_session):
    """Test complete end-to-end query flow with database save."""
    response = client.post("/api/v1/ask", json={...})
    
    assert response.status_code == 200
    
    # Verify database persistence
    conversation = get_active_conversation(session_id, db_session)
    assert len(conversation.messages) == 2  # User + assistant
```

### 5. Authentication & Session Tests (`test_auth.py`)

**Purpose**: User session management and persistence.

**Coverage**:
- ✅ Create new user session on first request
- ✅ Get existing user session (no duplicates)
- ✅ Update user preferences (language, role, location)
- ✅ Last active timestamp updates
- ✅ Create conversation for user
- ✅ Add user message to conversation
- ✅ Add assistant message with metadata
- ✅ Conversation message ordering
- ✅ Active conversation within 24-hour window
- ✅ Multiple sessions are isolated
- 🚧 Rate limiting tests (preparatory - not yet implemented)
- 🚧 Login endpoint tests (preparatory)
- 🚧 Email requirement tests (preparatory)

**Key Test Example**:
```python
def test_multiple_sessions_isolated(db_session):
    """Test that conversations for different sessions are isolated."""
    # Add messages to session1 and session2
    conv1 = get_active_conversation("session-1", db_session)
    conv2 = get_active_conversation("session-2", db_session)
    
    assert conv1.user.session_id == "session-1"
    assert conv2.user.session_id == "session-2"
    assert len(conv1.messages) == 1
```

## Fixtures

### Database Fixtures (`conftest.py`)

```python
@pytest.fixture
def db_session():
    """Create fresh in-memory database for each test."""
    # Each test gets isolated SQLite database
    # No shared state between tests

@pytest.fixture
def client(db_session):
    """FastAPI test client with database override."""
    # Overrides database dependency with test database
```

### Mock Data Factories (`conftest.py`)

```python
@pytest.fixture
def mock_weather_data():
    """Factory for deterministic weather data."""
    return _create_weather_data(temperature=27, wind_speed=15)

@pytest.fixture
def mock_intent_data():
    """Factory for intent extraction responses."""
    return _create_intent(place="Mumbai", intent="current")

@pytest.fixture
def mock_geocoding_data():
    """Factory for geocoding responses."""
    return _create_geocoding(lat=19.0760, lng=72.8777)
```

### Test Data Fixtures

```python
@pytest.fixture
def severity_test_cases():
    """Pre-defined test cases for severity classification."""
    return [
        # (temp, wind, rain_prob, rain_mm, expected_severity)
        (27, 15, 20, 5, "normal"),
        (45, 62, 80, 100, "extreme"),
    ]

@pytest.fixture
def valid_roles():
    """Valid role values for API testing."""
    return ["citizen", "farmer", "pilot", "disaster-manager"]
```

## Mocking Strategy

### External API Mocking

All external service calls are mocked to ensure:
- **Deterministic behavior**: No network variability
- **Fast execution**: No actual HTTP calls
- **Test isolation**: No dependency on external services
- **Parallel safety**: Tests can run concurrently

```python
with patch('backend.services.chat_service.chat_service.extract_intent') as mock_intent:
    mock_intent.return_value = mock_intent_data()
    # Test logic
```

### Services Mocked

- LLM service calls (Groq, Gemini, Ollama)
- Weather API (Open-Meteo)
- Geocoding service (Nominatim)
- Alert monitoring system

### Services NOT Mocked

- Database operations (real SQLite in-memory)
- FastAPI application (real TestClient)
- Business logic (severity classification, conversation service)

## Coverage Goals

### Current Coverage

```bash
pytest backend/tests/ -v --cov=backend --cov-report=term-missing
```

### Target Coverage

- **API Routes**: > 90%
- **Services**: > 85%
- **Business Logic**: > 95%
- **Overall**: > 85%

### Coverage Report

After running tests with coverage, view the HTML report:

```bash
open htmlcov/index.html  # macOS
xdg-open htmlcov/index.html  # Linux
```

## Continuous Integration

### GitHub Actions Setup

Add `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Run tests with coverage
        run: |
          pytest backend/tests/ -v --cov=backend --cov-report=xml
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

## Test Maintenance

### Adding New Tests

1. **Create test file**: `backend/tests/test_<feature>.py`
2. **Import fixtures**: `from conftest import *`
3. **Write deterministic tests**: Use factories, not random data
4. **Verify isolation**: Run test 10x consecutively
5. **Add to CI**: Tests auto-run on PR

### Updating Tests

When API contracts change:
1. Update relevant test in appropriate file
2. Run full suite to catch cascading failures
3. Update fixtures if data structure changes
4. Maintain backward compatibility when possible

### Debugging Failing Tests

```bash
# Run with verbose output and print statements
pytest backend/tests/test_api.py -v -s

# Run with debugger on failure
pytest backend/tests/test_api.py --pdb

# Run only failed tests from last run
pytest backend/tests/ --lf

# Show 10 slowest tests
pytest backend/tests/ --durations=10
```

## Best Practices

### ✅ DO

- Use fixtures for common setup
- Mock external services
- Test one thing per test
- Use descriptive test names
- Assert on specific values, not just truthiness
- Test edge cases and boundaries
- Run tests before pushing

### ❌ DON'T

- Use `time.sleep()` in tests
- Share state between tests
- Make real API calls
- Use random data (use deterministic factories)
- Test implementation details
- Skip tests without a ticket
- Commit commented-out tests

## Future Test Coverage

### Planned Tests (Not Yet Implemented)

- 🚧 **Rate Limiting**: 50 questions/day enforcement
- 🚧 **Login Flow**: Email + occupation authentication
- 🚧 **Alert Delivery**: Push notification system
- 🚧 **Multi-language**: Response generation in 10 languages
- 🚧 **Frontend E2E**: Playwright browser tests

### E2E Browser Tests (Future)

Will use Playwright for full browser automation:
- Login flow with email
- Real-time updates via WebSocket
- Chat interface interaction
- Rate limit enforcement in UI
- Multi-language switching

## Troubleshooting

### Common Issues

**Import errors:**
```bash
# Add backend to Python path
export PYTHONPATH="${PYTHONPATH}:/path/to/weather-gpt"
```

**Async test failures:**
```python
# Ensure pytest-asyncio is installed and configured
# Use @pytest.mark.asyncio decorator
```

**Database errors:**
```bash
# Clean up test database
rm -f test_database.db
```

**Coverage not working:**
```bash
# Install coverage dependencies
pip install pytest-cov
```

## Performance

### Test Execution Time

- **Fast unit tests**: < 5 seconds
- **Integration tests**: < 15 seconds
- **Full suite**: < 30 seconds

### Optimization Tips

- Run fast tests during development: `python run_tests.py fast`
- Run full suite before PR: `pytest backend/tests/ -v --cov=backend`
- Use parallel execution: `pytest -n auto` (requires pytest-xdist)

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Test Automation Best Practices](https://playwright.dev/docs/best-practices)

## Support

For test-related questions or issues:
1. Check this documentation
2. Review existing test files for patterns
3. Run with verbose output: `pytest -v -s`
4. Create issue with test failure output
