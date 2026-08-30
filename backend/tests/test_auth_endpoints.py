"""
Integration tests for authentication endpoints
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.database import Base
from backend.api.main import app
from backend.models.db_config import get_db_dependency


@pytest.fixture
def test_client():
    """Create a test client with in-memory database."""
    # Create in-memory database
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    TestSessionLocal = sessionmaker(bind=engine)

    # Override dependency
    def override_get_db():
        db = TestSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db_dependency] = override_get_db

    client = TestClient(app)
    yield client

    # Cleanup
    app.dependency_overrides.clear()


class TestLoginEndpoint:
    """Test suite for /api/v1/login endpoint."""

    def test_login_new_user_success(self, test_client):
        """Test successful login for new user."""
        response = test_client.post(
            "/api/v1/login",
            json={
                "email": "newuser@example.com",
                "occupation": "Software Engineer"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "newuser@example.com"
        assert data["occupation"] == "Software Engineer"
        assert data["is_new_user"] is True
        assert "Welcome to WeatherGPT!" in data["message"]

    def test_login_existing_user_success(self, test_client):
        """Test successful login for existing user."""
        # Create user
        test_client.post(
            "/api/v1/login",
            json={
                "email": "existing@example.com",
                "occupation": "Farmer"
            }
        )

        # Login again with updated occupation
        response = test_client.post(
            "/api/v1/login",
            json={
                "email": "existing@example.com",
                "occupation": "Rice Farmer in Punjab"
            }
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "existing@example.com"
        assert data["occupation"] == "Rice Farmer in Punjab"
        assert data["is_new_user"] is False
        assert "Welcome back" in data["message"]

    def test_login_invalid_email(self, test_client):
        """Test login with invalid email format."""
        response = test_client.post(
            "/api/v1/login",
            json={
                "email": "not-an-email",
                "occupation": "Tester"
            }
        )

        assert response.status_code == 422  # Validation error

    def test_login_missing_occupation(self, test_client):
        """Test login without occupation."""
        response = test_client.post(
            "/api/v1/login",
            json={
                "email": "test@example.com"
            }
        )

        assert response.status_code == 422  # Validation error


class TestAskEndpointAuthentication:
    """Test suite for /api/v1/ask authentication."""

    def test_ask_without_email_fails(self, test_client):
        """Test that /api/v1/ask requires email."""
        response = test_client.post(
            "/api/v1/ask",
            json={
                "query": "What's the weather?",
                "language": "en",
                "role": "citizen"
            }
        )

        assert response.status_code == 422  # Missing required field

    def test_ask_with_nonexistent_user_fails(self, test_client):
        """Test that /api/v1/ask fails for non-existent user."""
        response = test_client.post(
            "/api/v1/ask",
            json={
                "query": "What's the weather?",
                "email": "nonexistent@example.com",
                "language": "en",
                "role": "citizen"
            }
        )

        assert response.status_code == 401
        assert "not found" in response.json()["detail"].lower()

    def test_ask_with_authenticated_user_success(self, test_client):
        """Test successful authenticated request."""
        # First, login
        test_client.post(
            "/api/v1/login",
            json={
                "email": "authenticated@example.com",
                "occupation": "Software Developer"
            }
        )

        # Then make authenticated request
        # Note: This may fail if LLM services are not available, but auth should pass
        response = test_client.post(
            "/api/v1/ask",
            json={
                "query": "What's the weather in Mumbai?",
                "email": "authenticated@example.com",
                "language": "en",
                "role": "citizen"
            }
        )

        # Should not be 401 or 422 (auth passed)
        assert response.status_code not in [401, 422]


class TestRateLimiting:
    """Test suite for rate limiting."""

    def test_rate_limit_enforcement(self, test_client):
        """Test that rate limit is enforced after 50 requests."""
        # Login
        test_client.post(
            "/api/v1/login",
            json={
                "email": "ratelimit@example.com",
                "occupation": "Tester"
            }
        )

        # Make 50 requests (should all succeed or fail for non-auth reasons)
        for i in range(50):
            response = test_client.post(
                "/api/v1/ask",
                json={
                    "query": f"Test query {i}",
                    "email": "ratelimit@example.com",
                    "language": "en",
                    "role": "citizen"
                }
            )
            # Should not be rate limited yet
            if response.status_code == 429:
                pytest.fail(f"Rate limited on request {i+1}, expected after 50")

        # 51st request should be rate limited
        response = test_client.post(
            "/api/v1/ask",
            json={
                "query": "Test query 51",
                "email": "ratelimit@example.com",
                "language": "en",
                "role": "citizen"
            }
        )

        assert response.status_code == 429
        assert "limit" in response.json()["detail"].lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
