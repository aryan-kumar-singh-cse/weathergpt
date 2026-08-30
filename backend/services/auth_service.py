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
from backend.services.encryption_service import encryption_service

logger = logging.getLogger(__name__)

# Rate limiting configuration
MAX_QUESTIONS_PER_DAY = int(os.getenv("MAX_QUESTIONS_PER_DAY", "50"))
ROLLING_WINDOW_HOURS = 24


class AuthService:
    """Service for handling authentication and rate limiting."""

    def login_or_create_user(
        self,
        email: str,
        occupation: str,
        db: Session,
        groq_api_key: Optional[str] = None,
        gemini_api_key: Optional[str] = None
    ) -> AuthUser:
        """
        Login or create user with email, occupation, and API keys.
        This is an upsert operation - creates new user or updates existing.

        Args:
            email: User's email address
            occupation: User's occupation (free text)
            db: Database session
            groq_api_key: Optional Groq API key (will be encrypted)
            gemini_api_key: Optional Gemini API key (will be encrypted)

        Returns:
            AuthUser: The authenticated user record
        """
        email = email.strip().lower()

        if not email or not occupation:
            raise ValueError("Email and occupation are required")

        # Encrypt API keys if provided
        encrypted_groq_key = None
        encrypted_gemini_key = None

        if groq_api_key:
            try:
                encrypted_groq_key = encryption_service.encrypt(groq_api_key)
                logger.info(f"Encrypted Groq API key for {email}")
            except Exception as e:
                logger.error(f"Failed to encrypt Groq API key: {e}")
                raise ValueError("Failed to encrypt Groq API key")

        if gemini_api_key:
            try:
                encrypted_gemini_key = encryption_service.encrypt(gemini_api_key)
                logger.info(f"Encrypted Gemini API key for {email}")
            except Exception as e:
                logger.error(f"Failed to encrypt Gemini API key: {e}")
                raise ValueError("Failed to encrypt Gemini API key")

        # Upsert logic: get existing or create new
        user = db.query(AuthUser).filter(AuthUser.email == email).first()

        if user:
            # Update existing user
            user.occupation = occupation
            user.last_login = datetime.utcnow()

            # Update API keys if provided
            if encrypted_groq_key is not None:
                user.groq_api_key = encrypted_groq_key
            if encrypted_gemini_key is not None:
                user.gemini_api_key = encrypted_gemini_key

            logger.info(f"Updated existing user: {email}")
        else:
            # Create new user
            user = AuthUser(
                email=email,
                occupation=occupation,
                created_at=datetime.utcnow(),
                last_login=datetime.utcnow(),
                groq_api_key=encrypted_groq_key,
                gemini_api_key=encrypted_gemini_key
            )
            db.add(user)
            logger.info(f"Created new user: {email}")

        db.commit()
        db.refresh(user)
        return user

    def get_user(self, email: str, db: Session) -> Optional[AuthUser]:
        """
        Get user by email.

        Args:
            email: User's email address
            db: Database session

        Returns:
            AuthUser or None if not found
        """
        email = email.strip().lower()
        return db.query(AuthUser).filter(AuthUser.email == email).first()

    def check_rate_limit(self, email: str, endpoint: str, db: Session) -> Tuple[bool, int, int]:
        """
        Check if user has exceeded rate limit for the rolling 24h window.

        Args:
            email: User's email address
            endpoint: API endpoint being accessed
            db: Database session

        Returns:
            Tuple of (is_allowed, requests_made, requests_remaining)
        """
        email = email.strip().lower()

        # Calculate rolling window start time
        window_start = datetime.utcnow() - timedelta(hours=ROLLING_WINDOW_HOURS)

        # Count requests in the rolling window
        request_count = db.query(func.count(UsageLog.id)).filter(
            UsageLog.email == email,
            UsageLog.endpoint == endpoint,
            UsageLog.timestamp >= window_start
        ).scalar()

        requests_remaining = max(0, MAX_QUESTIONS_PER_DAY - request_count)
        is_allowed = request_count < MAX_QUESTIONS_PER_DAY

        logger.info(
            f"Rate limit check for {email}: {request_count}/{MAX_QUESTIONS_PER_DAY} "
            f"requests in last {ROLLING_WINDOW_HOURS}h"
        )

        return is_allowed, request_count, requests_remaining

    def log_usage(self, email: str, endpoint: str, db: Session) -> None:
        """
        Log API usage for rate limiting.

        Args:
            email: User's email address
            endpoint: API endpoint being accessed
            db: Database session
        """
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
        """
        Clean up usage logs older than specified days.
        This is a maintenance operation to prevent database bloat.

        Args:
            db: Database session
            days: Number of days to keep logs (default: 7)

        Returns:
            Number of deleted records
        """
        cutoff = datetime.utcnow() - timedelta(days=days)

        deleted_count = db.query(UsageLog).filter(
            UsageLog.timestamp < cutoff
        ).delete()

        db.commit()

        logger.info(f"Cleaned up {deleted_count} usage logs older than {days} days")
        return deleted_count


# Singleton instance
auth_service = AuthService()
