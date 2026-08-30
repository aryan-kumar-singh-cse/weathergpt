"""
WeatherGPT Database Models
SQLAlchemy models for conversation history and user sessions
"""

from sqlalchemy import Column, Integer, String, DateTime, Text, Float, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    """User model for tracking sessions and preferences."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # User preferences
    preferred_language = Column(String(10), default="en")
    preferred_role = Column(String(50), default="citizen")
    preferred_location = Column(String(255), nullable=True)

    # Relationships
    conversations = relationship("Conversation", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User(session_id={self.session_id}, role={self.preferred_role})>"


class Conversation(Base):
    """Conversation model for storing chat history."""
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Conversation(id={self.id}, user_id={self.user_id}, messages={len(self.messages)})>"


class Message(Base):
    """Message model for individual chat messages."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Message content
    role = Column(String(20), nullable=False)  # 'user' or 'assistant'
    content = Column(Text, nullable=False)

    # Query metadata
    query_metadata = Column(JSON, nullable=True)  # stores intent, location, etc.
    weather_data = Column(JSON, nullable=True)  # stores weather snapshot
    llm_tier_used = Column(String(20), nullable=True)  # which LLM tier was used

    # User context
    user_role = Column(String(50), default="citizen")  # citizen/farmer/pilot/disaster-manager
    user_language = Column(String(10), default="en")
    user_location = Column(String(255), nullable=True)

    # Relationships
    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self):
        return f"<Message(id={self.id}, role={self.role}, content={self.content[:50]}...)>"


class WeatherAlert(Base):
    """Weather alert model for storing alert history and subscriptions."""
    __tablename__ = "weather_alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(255), unique=True, index=True, nullable=False)
    user_session_id = Column(String(255), index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

    # Alert details
    location = Column(String(255), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    severity = Column(String(20), nullable=False)  # normal/watch/warning/severe/extreme
    alert_type = Column(String(50), nullable=False)  # heatwave/heavy_rain/high_wind/frost/storm
    message = Column(Text, nullable=False)
    source = Column(String(50), default="severity_classification")

    # Delivery status (multi-channel)
    sent_via_sms = Column(Integer, default=0)  # 0=not sent, 1=sent, 2=failed
    sent_via_push = Column(Integer, default=0)
    sent_via_email = Column(Integer, default=0)
    sent_via_whatsapp = Column(Integer, default=0)
    sent_via_voice = Column(Integer, default=0)

    phone_number = Column(String(20), nullable=True)

    # Weather snapshot
    weather_data = Column(JSON, nullable=True)
    affected_areas = Column(JSON, nullable=True)

    def __repr__(self):
        return f"<WeatherAlert(alert_id={self.alert_id}, location={self.location}, severity={self.severity})>"


class AlertSubscription(Base):
    """Alert subscription model for user alert preferences."""
    __tablename__ = "alert_subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    subscription_id = Column(String(255), unique=True, index=True, nullable=False)
    user_id = Column(String(255), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Location preferences
    location_name = Column(String(255), nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)

    # Alert preferences
    alert_types = Column(JSON, nullable=False)  # List of alert types
    severity_levels = Column(JSON, nullable=False)  # List of severity levels
    delivery_channels = Column(JSON, nullable=False)  # List of delivery channels
    notification_frequency = Column(String(20), default="immediate")  # immediate/hourly/daily

    # Status
    is_active = Column(Integer, default=1)  # 1=active, 0=inactive
    last_notified = Column(DateTime, nullable=True)

    # Contact information
    phone_number = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    device_token = Column(String(255), nullable=True)  # For push notifications

    def __repr__(self):
        return f"<AlertSubscription(subscription_id={self.subscription_id}, user_id={self.user_id}, is_active={self.is_active})>"


class AuthUser(Base):
    """User authentication model for email-based login and personalization."""
    __tablename__ = "auth_users"

    email = Column(String(255), primary_key=True, index=True)
    occupation = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # User's own API keys (encrypted)
    groq_api_key = Column(String(512), nullable=True)  # Encrypted
    gemini_api_key = Column(String(512), nullable=True)  # Encrypted

    # Relationships
    usage_logs = relationship("UsageLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<AuthUser(email={self.email}, occupation={self.occupation})>"


class UsageLog(Base):
    """Usage log for rate limiting (rolling 24h window)."""
    __tablename__ = "usage_logs"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), ForeignKey("auth_users.email"), nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    endpoint = Column(String(100), nullable=False)

    # Relationships
    user = relationship("AuthUser", back_populates="usage_logs")

    def __repr__(self):
        return f"<UsageLog(email={self.email}, endpoint={self.endpoint}, timestamp={self.timestamp})>"
