"""
Tests for Authentication Service
"""

import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models.database import Base, AuthUser, UsageLog
from backend.services.auth_service import auth_service


@pytest.fixture
def db_session():
    """Create a test database session."""
    # Use in-memory SQLite for testing
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    SessionLocal = sessionmaker(bind=engine)
    session = SessionLocal()
    yield session
    session.close()


class TestAuthService:
    """Test suite for authentication service."""

    def test_login_creates_new_user(self, db_session):
        """Test that login creates a new user if they don't exist."""
        email = "newuser@example.com"
        occupation = "Software Developer"

        user = auth_service.login_or_create_user(email, occupation, db_session)

        assert user.email == email.lower()
        assert user.occupation == occupation
        assert user.created_at is not None
        assert user.last_login is not None

    def test_login_updates_existing_user(self, db_session):
        """Test that login updates existing user's occupation."""
        email = "existing@example.com"
        initial_occupation = "Student"
        updated_occupation = "Software Engineer"

        # Create initial user
        user1 = auth_service.login_or_create_user(email, initial_occupation, db_session)
        initial_created_at = user1.created_at

        # Login again with updated occupation
        user2 = auth_service.login_or_create_user(email, updated_occupation, db_session)

        assert user2.email == email.lower()
        assert user2.occupation == updated_occupation
        assert user2.created_at == initial_created_at  # Should not change
        assert user2.last_login > initial_created_at  # Should be updated

    def test_get_user_returns_existing_user(self, db_session):
        """Test retrieving an existing user."""
        email = "test@example.com"
        occupation = "Farmer"

        # Create user
        auth_service.login_or_create_user(email, occupation, db_session)

        # Retrieve user
        user = auth_service.get_user(email, db_session)

        assert user is not None
        assert user.email == email.lower()
        assert user.occupation == occupation

    def test_get_user_returns_none_for_nonexistent(self, db_session):
        """Test that get_user returns None for non-existent user."""
        user = auth_service.get_user("nonexistent@example.com", db_session)
        assert user is None

    def test_rate_limit_allows_under_limit(self, db_session):
        """Test that rate limit allows requests under the limit."""
        email = "ratelimit1@example.com"
        occupation = "Tester"
        endpoint = "/api/v1/ask"

        # Create user
        auth_service.login_or_create_user(email, occupation, db_session)

        # Log 10 requests
        for _ in range(10):
            auth_service.log_usage(email, endpoint, db_session)

        # Check rate limit
        is_allowed, count, remaining = auth_service.check_rate_limit(email, endpoint, db_session)

        assert is_allowed is True
        assert count == 10
        assert remaining == 40  # Assuming MAX_QUESTIONS_PER_DAY=50

    def test_rate_limit_blocks_over_limit(self, db_session):
        """Test that rate limit blocks requests over the limit."""
        email = "ratelimit2@example.com"
        occupation = "Tester"
        endpoint = "/api/v1/ask"

        # Create user
        auth_service.login_or_create_user(email, occupation, db_session)

        # Log 51 requests (over the limit of 50)
        for _ in range(51):
            auth_service.log_usage(email, endpoint, db_session)

        # Check rate limit
        is_allowed, count, remaining = auth_service.check_rate_limit(email, endpoint, db_session)

        assert is_allowed is False
        assert count == 51
        assert remaining == 0

    def test_rate_limit_rolling_window(self, db_session):
        """Test that rate limit uses rolling 24h window."""
        email = "ratelimit3@example.com"
        occupation = "Tester"
        endpoint = "/api/v1/ask"

        # Create user
        auth_service.login_or_create_user(email, occupation, db_session)

        # Log 50 requests at current time
        for _ in range(50):
            auth_service.log_usage(email, endpoint, db_session)

        # Manually add an old request (25 hours ago - should be ignored)
        old_log = UsageLog(
            email=email.lower(),
            endpoint=endpoint,
            timestamp=datetime.utcnow() - timedelta(hours=25)
        )
        db_session.add(old_log)
        db_session.commit()

        # Check rate limit (should still be at 50, old request ignored)
        is_allowed, count, remaining = auth_service.check_rate_limit(email, endpoint, db_session)

        assert count == 50  # Old request not counted
        assert is_allowed is False

    def test_log_usage_creates_record(self, db_session):
        """Test that log_usage creates a usage record."""
        email = "usage@example.com"
        occupation = "Tester"
        endpoint = "/api/v1/ask"

        # Create user
        auth_service.login_or_create_user(email, occupation, db_session)

        # Log usage
        auth_service.log_usage(email, endpoint, db_session)

        # Verify record exists
        log = db_session.query(UsageLog).filter(UsageLog.email == email.lower()).first()

        assert log is not None
        assert log.email == email.lower()
        assert log.endpoint == endpoint
        assert log.timestamp is not None

    def test_cleanup_old_logs(self, db_session):
        """Test that cleanup removes old logs."""
        email = "cleanup@example.com"
        occupation = "Tester"
        endpoint = "/api/v1/ask"

        # Create user
        auth_service.login_or_create_user(email, occupation, db_session)

        # Add recent log
        auth_service.log_usage(email, endpoint, db_session)

        # Add old log (8 days ago)
        old_log = UsageLog(
            email=email.lower(),
            endpoint=endpoint,
            timestamp=datetime.utcnow() - timedelta(days=8)
        )
        db_session.add(old_log)
        db_session.commit()

        # Verify we have 2 logs
        count_before = db_session.query(UsageLog).filter(UsageLog.email == email.lower()).count()
        assert count_before == 2

        # Cleanup logs older than 7 days
        deleted_count = auth_service.cleanup_old_logs(db_session, days=7)

        assert deleted_count == 1

        # Verify only recent log remains
        count_after = db_session.query(UsageLog).filter(UsageLog.email == email.lower()).count()
        assert count_after == 1

    def test_email_case_insensitive(self, db_session):
        """Test that email comparison is case-insensitive."""
        email_lower = "user@example.com"
        email_upper = "USER@EXAMPLE.COM"
        email_mixed = "UsEr@ExAmPlE.cOm"
        occupation = "Tester"

        # Create user with lowercase email
        user1 = auth_service.login_or_create_user(email_lower, occupation, db_session)

        # Try to get with uppercase
        user2 = auth_service.get_user(email_upper, db_session)

        # Try to get with mixed case
        user3 = auth_service.get_user(email_mixed, db_session)

        assert user2 is not None
        assert user3 is not None
        assert user1.email == user2.email == user3.email

    def test_validation_rejects_empty_email(self, db_session):
        """Test that empty email is rejected."""
        with pytest.raises(ValueError, match="Email and occupation are required"):
            auth_service.login_or_create_user("", "Occupation", db_session)

    def test_validation_rejects_empty_occupation(self, db_session):
        """Test that empty occupation is rejected."""
        with pytest.raises(ValueError, match="Email and occupation are required"):
            auth_service.login_or_create_user("test@example.com", "", db_session)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
