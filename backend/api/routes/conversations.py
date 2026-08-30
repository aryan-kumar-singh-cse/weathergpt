"""
WeatherGPT Conversation History Routes
API endpoints for managing chat history and user sessions
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.orm import Session

from backend.models.db_config import get_db_dependency
from backend.services.conversation_service import conversation_service

router = APIRouter(prefix="/conversations", tags=["Conversations"])


class MessageResponse(BaseModel):
    """Message response model."""
    id: int
    role: str
    content: str
    created_at: str
    user_role: str
    user_language: str
    user_location: Optional[str]
    llm_tier_used: Optional[str]


class ConversationHistoryResponse(BaseModel):
    """Conversation history response model."""
    session_id: str
    messages: List[Dict[str, Any]]
    total_messages: int
    conversation_created_at: Optional[str]


class UserPreferencesUpdate(BaseModel):
    """User preferences update model."""
    language: Optional[str] = None
    role: Optional[str] = None
    location: Optional[str] = None


@router.get("/history", response_model=ConversationHistoryResponse)
async def get_conversation_history(
    session_id: str = Header(..., alias="X-Session-ID"),
    limit: int = 50,
    db: Session = Depends(get_db_dependency)
):
    """
    Get conversation history for a user session.

    Args:
        session_id: User session ID (from X-Session-ID header)
        limit: Maximum number of messages to return (default: 50)
        db: Database session

    Returns:
        Conversation history with messages
    """
    try:
        messages = conversation_service.get_conversation_history(session_id, db, limit)

        conversation = conversation_service.get_active_conversation(session_id, db)
        conversation_created_at = conversation.created_at.isoformat() if conversation else None

        return ConversationHistoryResponse(
            session_id=session_id,
            messages=messages,
            total_messages=len(messages),
            conversation_created_at=conversation_created_at
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversation history: {str(e)}")


@router.get("/context")
async def get_conversation_context(
    session_id: str = Header(..., alias="X-Session-ID"),
    max_messages: int = 10,
    db: Session = Depends(get_db_dependency)
):
    """
    Get recent conversation context in OpenAI format for LLM.

    Args:
        session_id: User session ID (from X-Session-ID header)
        max_messages: Maximum number of recent messages (default: 10)
        db: Database session

    Returns:
        Recent messages in OpenAI chat format
    """
    try:
        context = conversation_service.get_conversation_context(session_id, db, max_messages)

        return {
            "session_id": session_id,
            "context": context,
            "message_count": len(context)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversation context: {str(e)}")


@router.post("/preferences")
async def update_user_preferences(
    preferences: UserPreferencesUpdate,
    session_id: str = Header(..., alias="X-Session-ID"),
    db: Session = Depends(get_db_dependency)
):
    """
    Update user preferences (language, role, location).

    Args:
        preferences: Preferences to update
        session_id: User session ID (from X-Session-ID header)
        db: Database session

    Returns:
        Success message
    """
    try:
        conversation_service.update_user_preferences(
            session_id=session_id,
            db=db,
            language=preferences.language,
            role=preferences.role,
            location=preferences.location
        )

        return {
            "status": "success",
            "message": "User preferences updated",
            "session_id": session_id,
            "preferences": {
                "language": preferences.language,
                "role": preferences.role,
                "location": preferences.location
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update preferences: {str(e)}")


@router.delete("/clear")
async def clear_conversation_history(
    session_id: str = Header(..., alias="X-Session-ID"),
    db: Session = Depends(get_db_dependency)
):
    """
    Clear conversation history for a user session (start fresh).

    Args:
        session_id: User session ID (from X-Session-ID header)
        db: Database session

    Returns:
        Success message
    """
    try:
        conversation = conversation_service.get_active_conversation(session_id, db)

        if conversation:
            db.delete(conversation)
            db.commit()

            return {
                "status": "success",
                "message": "Conversation history cleared",
                "session_id": session_id
            }
        else:
            return {
                "status": "success",
                "message": "No active conversation to clear",
                "session_id": session_id
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to clear conversation: {str(e)}")


@router.get("/stats")
async def get_conversation_stats(
    session_id: str = Header(..., alias="X-Session-ID"),
    db: Session = Depends(get_db_dependency)
):
    """
    Get conversation statistics for a user session.

    Args:
        session_id: User session ID (from X-Session-ID header)
        db: Database session

    Returns:
        Conversation statistics
    """
    try:
        from backend.models.database import User, Message

        user = db.query(User).filter_by(session_id=session_id).first()

        if not user:
            return {
                "session_id": session_id,
                "exists": False
            }

        conversation = conversation_service.get_active_conversation(session_id, db)

        if not conversation:
            return {
                "session_id": session_id,
                "exists": True,
                "active_conversation": False,
                "preferences": {
                    "language": user.preferred_language,
                    "role": user.preferred_role,
                    "location": user.preferred_location
                }
            }

        message_count = db.query(Message).filter_by(conversation_id=conversation.id).count()

        return {
            "session_id": session_id,
            "exists": True,
            "active_conversation": True,
            "conversation_id": conversation.id,
            "created_at": conversation.created_at.isoformat(),
            "message_count": message_count,
            "user_created_at": user.created_at.isoformat(),
            "last_active": user.last_active.isoformat(),
            "preferences": {
                "language": user.preferred_language,
                "role": user.preferred_role,
                "location": user.preferred_location
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversation stats: {str(e)}")
