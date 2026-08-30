"""
WeatherGPT Conversation History Service
Manages chat history, user sessions, and conversation context
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from backend.models.database import User, Conversation, Message, WeatherAlert
from backend.models.db_config import get_db

logger = logging.getLogger(__name__)


class ConversationService:
    """Service for managing conversation history."""

    def get_or_create_user(self, session_id: str, db: Session) -> User:
        """Get existing user or create new one by session ID."""
        user = db.query(User).filter_by(session_id=session_id).first()

        if not user:
            user = User(session_id=session_id)
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info(f"Created new user with session_id: {session_id}")
        else:
            # Update last active timestamp
            user.last_active = datetime.utcnow()
            db.commit()

        return user

    def create_conversation(self, session_id: str, db: Session) -> Conversation:
        """Create a new conversation for a user."""
        user = self.get_or_create_user(session_id, db)

        conversation = Conversation(user_id=user.id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        logger.info(f"Created conversation {conversation.id} for user {user.id}")
        return conversation

    def get_active_conversation(self, session_id: str, db: Session) -> Optional[Conversation]:
        """Get the most recent conversation for a user."""
        user = db.query(User).filter_by(session_id=session_id).first()
        if not user:
            return None

        # Get most recent conversation (within last 24 hours)
        cutoff_time = datetime.utcnow() - timedelta(hours=24)
        conversation = (
            db.query(Conversation)
            .filter_by(user_id=user.id)
            .filter(Conversation.created_at >= cutoff_time)
            .order_by(Conversation.created_at.desc())
            .first()
        )

        return conversation

    def get_or_create_conversation(self, session_id: str, db: Session) -> Conversation:
        """Get active conversation or create new one."""
        conversation = self.get_active_conversation(session_id, db)

        if not conversation:
            conversation = self.create_conversation(session_id, db)

        return conversation

    def add_message(
        self,
        session_id: str,
        role: str,
        content: str,
        db: Session,
        query_metadata: Optional[Dict[str, Any]] = None,
        weather_data: Optional[Dict[str, Any]] = None,
        llm_tier_used: Optional[str] = None,
        user_role: str = "citizen",
        user_language: str = "en",
        user_location: Optional[str] = None
    ) -> Message:
        """Add a message to the conversation history."""
        conversation = self.get_or_create_conversation(session_id, db)

        message = Message(
            conversation_id=conversation.id,
            role=role,
            content=content,
            query_metadata=query_metadata,
            weather_data=weather_data,
            llm_tier_used=llm_tier_used,
            user_role=user_role,
            user_language=user_language,
            user_location=user_location
        )

        db.add(message)
        db.commit()
        db.refresh(message)

        logger.info(f"Added {role} message to conversation {conversation.id}")
        return message

    def get_conversation_history(
        self,
        session_id: str,
        db: Session,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get conversation history for a user session."""
        conversation = self.get_active_conversation(session_id, db)

        if not conversation:
            return []

        messages = (
            db.query(Message)
            .filter_by(conversation_id=conversation.id)
            .order_by(Message.created_at.asc())
            .limit(limit)
            .all()
        )

        return [
            {
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat(),
                "user_role": msg.user_role,
                "user_language": msg.user_language,
                "user_location": msg.user_location,
                "llm_tier_used": msg.llm_tier_used,
                "query_metadata": msg.query_metadata,
            }
            for msg in messages
        ]

    def get_conversation_context(
        self,
        session_id: str,
        db: Session,
        max_messages: int = 10
    ) -> List[Dict[str, str]]:
        """
        Get recent conversation context for LLM.
        Returns messages in OpenAI format.
        """
        conversation = self.get_active_conversation(session_id, db)

        if not conversation:
            return []

        messages = (
            db.query(Message)
            .filter_by(conversation_id=conversation.id)
            .order_by(Message.created_at.desc())
            .limit(max_messages)
            .all()
        )

        # Reverse to get chronological order
        messages = list(reversed(messages))

        return [
            {
                "role": msg.role if msg.role in ["user", "assistant"] else "assistant",
                "content": msg.content
            }
            for msg in messages
        ]

    def update_user_preferences(
        self,
        session_id: str,
        db: Session,
        language: Optional[str] = None,
        role: Optional[str] = None,
        location: Optional[str] = None
    ):
        """Update user preferences."""
        user = self.get_or_create_user(session_id, db)

        if language:
            user.preferred_language = language
        if role:
            user.preferred_role = role
        if location:
            user.preferred_location = location

        db.commit()
        logger.info(f"Updated preferences for user {user.id}")

    def clear_old_conversations(self, db: Session, days: int = 30):
        """Clear conversations older than specified days."""
        cutoff_time = datetime.utcnow() - timedelta(days=days)

        old_conversations = (
            db.query(Conversation)
            .filter(Conversation.created_at < cutoff_time)
            .all()
        )

        count = len(old_conversations)
        for conversation in old_conversations:
            db.delete(conversation)

        db.commit()
        logger.info(f"Deleted {count} old conversations")

    def save_weather_alert(
        self,
        session_id: str,
        location: str,
        lat: float,
        lng: float,
        severity: str,
        alert_type: str,
        message: str,
        db: Session,
        weather_data: Optional[Dict[str, Any]] = None,
        phone_number: Optional[str] = None
    ) -> WeatherAlert:
        """Save a weather alert to database."""
        alert = WeatherAlert(
            user_session_id=session_id,
            location=location,
            lat=lat,
            lng=lng,
            severity=severity,
            alert_type=alert_type,
            message=message,
            weather_data=weather_data,
            phone_number=phone_number
        )

        db.add(alert)
        db.commit()
        db.refresh(alert)

        logger.info(f"Saved weather alert for {location} (severity: {severity})")
        return alert


# Global instance
conversation_service = ConversationService()
