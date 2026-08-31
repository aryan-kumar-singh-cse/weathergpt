"""
WeatherGPT Authentication Service
Lightweight email-based authentication for personalization and fair-use tracking
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from backend.models.database import AuthUser, UsageLog

logger = logging.getLogger(__name__)

# Rate limiting configuration (per-user daily limit)
MAX_QUESTIONS_PER_DAY = int(os.getenv("MAX_QUESTIONS_PER_DAY", "20"))
ROLLING_WINDOW_HOURS = 24


class AuthService:
    """Service for handling email-based user sessions, profiles, and rate limiting."""

    def login_or_create_user(
        self,
        email: str,
        occupation: str,
        db: Session,
        name: Optional[str] = None,
        location: Optional[str] = None,
        preferred_language: Optional[str] = None
    ) -> AuthUser:
        """
        Login or create user with email, name, occupation, location, and preferred language.
        Upsert operation - creates new user or updates existing.
        """
        email = email.strip().lower()

        if not email or not occupation:
            raise ValueError("Email and occupation are required")

        user = db.query(AuthUser).filter(AuthUser.email == email).first()

        if user:
            # Update existing user profile
            user.occupation = occupation
            if name:
                user.name = name
            if location:
                user.location = location
            if preferred_language:
                user.preferred_language = preferred_language
            user.last_login = datetime.utcnow()
            logger.info(f"Updated existing user: {email}")
        else:
            # Create new user
            user = AuthUser(
                email=email,
                name=name,
                occupation=occupation,
                location=location or "Delhi",
                preferred_language=preferred_language or "en",
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow()
            )
            db.add(user)
            logger.info(f"Created new user: {email}")

        db.commit()
        db.refresh(user)
        return user

    def update_profile(
        self,
        email: str,
        db: Session,
        location: Optional[str] = None,
        preferred_language: Optional[str] = None
    ) -> Optional[AuthUser]:
        """
        Update user profile fields independently (location and/or preferred_language).
        """
        email = email.strip().lower()
        user = db.query(AuthUser).filter(AuthUser.email == email).first()
        if not user:
            return None

        if location is not None:
            user.location = location
        if preferred_language is not None:
            user.preferred_language = preferred_language

        user.last_login = datetime.utcnow()
        db.commit()
        db.refresh(user)
        logger.info(f"Updated profile for {email}: location={user.location}, lang={user.preferred_language}")
        return user

    def get_user(self, email: str, db: Session) -> Optional[AuthUser]:
        """Get user by email."""
        email = email.strip().lower()
        return db.query(AuthUser).filter(AuthUser.email == email).first()

    def check_rate_limit(self, email: str, endpoint: str = "/api/v1/ask", db: Session = None, max_requests: Optional[int] = None) -> Tuple[bool, int, int]:
        """
        Check if user has exceeded rate limit for the rolling 24h window.
        Returns: Tuple of (is_allowed, requests_made, requests_remaining)
        """
        email = email.strip().lower()
        window_start = datetime.utcnow() - timedelta(hours=ROLLING_WINDOW_HOURS)
        limit = max_requests if max_requests is not None else MAX_QUESTIONS_PER_DAY

        request_count = db.query(func.count(UsageLog.id)).filter(
            UsageLog.email == email,
            UsageLog.endpoint == endpoint,
            UsageLog.timestamp >= window_start
        ).scalar() or 0

        requests_remaining = max(0, limit - request_count)
        is_allowed = request_count < limit

        logger.info(
            f"Rate limit check for {email}: {request_count}/{limit} "
            f"requests in last {ROLLING_WINDOW_HOURS}h"
        )

        return is_allowed, request_count, requests_remaining

    def log_usage(self, email: str, endpoint: str, db: Session) -> None:
        """Log API usage for rate limiting."""
        email = email.strip().lower()
        usage_log = UsageLog(
            email=email,
            endpoint=endpoint,
            timestamp=datetime.utcnow()
        )
        db.add(usage_log)
        db.commit()
        logger.info(f"Logged usage for {email} on {endpoint}")

    def cleanup_old_logs(self, db: Session, days: int = 7) -> int:
        """Clean up usage logs older than specified days."""
        cutoff = datetime.utcnow() - timedelta(days=days)
        deleted_count = db.query(UsageLog).filter(
            UsageLog.timestamp < cutoff
        ).delete()
        db.commit()
        logger.info(f"Cleaned up {deleted_count} usage logs older than {days} days")
        return deleted_count


# Singleton instance
auth_service = AuthService()
