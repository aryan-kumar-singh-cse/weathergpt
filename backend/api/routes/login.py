"""
WeatherGPT Login & User Profile Endpoints
Lightweight email-based login for personalization and fair-use tracking
"""

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
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
    name: Optional[str] = None
    occupation: str
    location: Optional[str] = "Delhi"
    preferred_language: Optional[str] = "en"


class LoginResponse(BaseModel):
    """Response model for login endpoint."""
    email: str
    name: Optional[str] = None
    occupation: str
    location: Optional[str] = "Delhi"
    preferred_language: Optional[str] = "en"
    message: str
    is_new_user: bool


class ProfileUpdateRequest(BaseModel):
    """Request model for updating profile fields."""
    email: EmailStr
    location: Optional[str] = None
    preferred_language: Optional[str] = None


@router.post("/login", response_model=LoginResponse)
async def login(
    request: LoginRequest,
    db: Session = Depends(get_db_dependency)
):
    """
    Login or create user with email and profile details.
    """
    try:
        existing_user = auth_service.get_user(str(request.email), db)
        is_new_user = existing_user is None

        user = auth_service.login_or_create_user(
            email=str(request.email),
            name=request.name,
            occupation=request.occupation,
            location=request.location,
            preferred_language=request.preferred_language,
            db=db
        )

        message = "Welcome to WeatherGPT!" if is_new_user else "Welcome back to WeatherGPT!"
        logger.info(f"User logged in: {user.email} (new={is_new_user})")

        return LoginResponse(
            email=user.email,
            name=user.name,
            occupation=user.occupation,
            location=user.location or "Delhi",
            preferred_language=user.preferred_language or "en",
            message=message,
            is_new_user=is_new_user
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
    Check if a user exists and retrieve their current profile.
    """
    try:
        normalized_email = email.strip().lower()
        user = auth_service.get_user(normalized_email, db)

        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "exists": True,
            "email": user.email,
            "name": user.name,
            "occupation": user.occupation,
            "location": user.location or "Delhi",
            "preferred_language": user.preferred_language or "en",
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "last_login": user.last_login.isoformat() if user.last_login else None
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Status check error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to check user status"
        )


@router.put("/user/profile")
@router.patch("/login/profile")
async def update_user_profile(
    request: ProfileUpdateRequest,
    db: Session = Depends(get_db_dependency)
):
    """
    Update user location and/or language preference independently.
    """
    try:
        user = auth_service.update_profile(
            email=str(request.email),
            location=request.location,
            preferred_language=request.preferred_language,
            db=db
        )
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        return {
            "success": True,
            "email": user.email,
            "location": user.location,
            "preferred_language": user.preferred_language,
            "message": "Profile updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Profile update error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to update profile")

