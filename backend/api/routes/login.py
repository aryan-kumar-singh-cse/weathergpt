"""
WeatherGPT Login Endpoint
Lightweight email-based login for personalization and fair-use
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session
import logging
from typing import Optional

from backend.services.auth_service import auth_service
from backend.models.db_config import get_db_dependency

logger = logging.getLogger(__name__)

router = APIRouter()


class LoginRequest(BaseModel):
    """Request model for login endpoint."""
    email: EmailStr
    occupation: str
    groq_api_key: Optional[str] = None
    gemini_api_key: Optional[str] = None

    @field_validator('groq_api_key')
    @classmethod
    def validate_groq_key(cls, v):
        """Validate Groq API key format."""
        if v is not None and v.strip():
            if not v.startswith('gsk_'):
                raise ValueError('Groq API key must start with "gsk_"')
        return v

    @field_validator('gemini_api_key')
    @classmethod
    def validate_gemini_key(cls, v):
        """Validate Gemini API key format."""
        if v is not None and v.strip():
            # Gemini keys can start with different prefixes (AIza, AQ, etc.)
            # Just validate it's not empty and has reasonable length
            if len(v.strip()) < 10:
                raise ValueError('Gemini API key appears to be too short')
        return v

    def has_at_least_one_key(self) -> bool:
        """Check if at least one API key is provided."""
        return bool((self.groq_api_key and self.groq_api_key.strip()) or
                   (self.gemini_api_key and self.gemini_api_key.strip()))


class LoginResponse(BaseModel):
    """Response model for login endpoint."""
    email: str
    occupation: str
    message: str
    is_new_user: bool
    has_groq_key: bool
    has_gemini_key: bool


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db_dependency)
):
    """
    Login or create user with email and occupation.

    This is a lightweight authentication system for personalization and fair-use tracking.
    - No passwords or verification required
    - Email is used as identifier for rate limiting
    - Occupation is used to personalize AI responses

    Args:
        request: LoginRequest with email and occupation
        db: Database session

    Returns:
        LoginResponse with user details and welcome message

    Example:
        POST /api/v1/login
        {
            "email": "farmer@example.com",
            "occupation": "Rice farmer in Punjab"
        }
    """
    try:
        # Validate that at least one API key is provided
        if not request.has_at_least_one_key():
            raise HTTPException(
                status_code=400,
                detail="At least one API key (Groq or Gemini) must be provided"
            )

        # Check if user already exists
        existing_user = auth_service.get_user(request.email, db)
        is_new_user = existing_user is None

        # Login or create user with API keys
        user = auth_service.login_or_create_user(
            email=request.email,
            occupation=request.occupation,
            groq_api_key=request.groq_api_key.strip() if request.groq_api_key else None,
            gemini_api_key=request.gemini_api_key.strip() if request.gemini_api_key else None,
            db=db
        )

        message = (
            "Welcome to WeatherGPT!" if is_new_user
            else "Welcome back to WeatherGPT!"
        )

        logger.info(f"User logged in: {user.email} (new={is_new_user})")

        return LoginResponse(
            email=user.email,
            occupation=user.occupation,
            message=message,
            is_new_user=is_new_user,
            has_groq_key=bool(user.groq_api_key),
            has_gemini_key=bool(user.gemini_api_key)
        )

    except ValueError as e:
        logger.error(f"Login validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to process login request"
        )


@router.get("/login/status")
async def get_login_status(email: str, db: Session = Depends(get_db_dependency)):
    """
    Check if a user exists and get their occupation + encrypted API keys for client-side storage.

    Returns 200 with user data if found, 404 if not found (for new user registration flow).

    Args:
        email: User's email address
        db: Database session

    Returns:
        User status, occupation, and encrypted API keys if found, or 404 if new user
    """
    try:
        from datetime import datetime
        from backend.services.encryption_service import encryption_service

        # Normalize email
        normalized_email = email.strip().lower()

        user = auth_service.get_user(normalized_email, db)

        if not user:
            # User doesn't exist - return 404 to trigger registration flow
            raise HTTPException(status_code=404, detail="User not found")

        # Update last login timestamp
        user.last_login = datetime.utcnow()
        db.commit()

        # Decrypt API keys to send back to client for localStorage storage
        groq_key = None
        gemini_key = None

        if user.groq_api_key:
            try:
                groq_key = encryption_service.decrypt(user.groq_api_key)
            except Exception as e:
                logger.error(f"Failed to decrypt Groq key for {email}: {e}")

        if user.gemini_api_key:
            try:
                gemini_key = encryption_service.decrypt(user.gemini_api_key)
            except Exception as e:
                logger.error(f"Failed to decrypt Gemini key for {email}: {e}")

        return {
            "exists": True,
            "email": user.email,
            "occupation": user.occupation,
            "groq_api_key": groq_key,
            "gemini_api_key": gemini_key,
            "has_groq_key": bool(groq_key),
            "has_gemini_key": bool(gemini_key),
            "created_at": user.created_at.isoformat(),
            "last_login": user.last_login.isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status check error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to check user status"
        )
