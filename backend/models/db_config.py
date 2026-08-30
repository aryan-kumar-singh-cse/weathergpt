"""
WeatherGPT Database Configuration
Database connection and session management
"""

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from contextlib import contextmanager
import logging

from backend.models.database import Base

logger = logging.getLogger(__name__)

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./weathergpt.db"  # Default to SQLite for development
)

logger.info(f"Using database URL: {DATABASE_URL}")

# Create engine
if DATABASE_URL.startswith("sqlite"):
    # SQLite configuration for development
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
        echo=False
    )
    logger.info("Using SQLite database for development")
else:
    # PostgreSQL configuration for production
    try:
        engine = create_engine(
            DATABASE_URL,
            pool_size=20,
            max_overflow=40,
            pool_pre_ping=True,
            echo=False
        )
        logger.info("Using PostgreSQL database")
    except Exception as e:
        logger.error(f"Failed to connect to PostgreSQL: {e}")
        logger.info("Falling back to SQLite")
        DATABASE_URL = "sqlite:///./weathergpt.db"
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
            echo=False
        )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def init_db():
    """Initialize database - create all tables."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise


@contextmanager
def get_db() -> Session:
    """
    Get database session context manager.

    Usage:
        with get_db() as db:
            user = db.query(User).filter_by(session_id=session_id).first()
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {e}")
        raise
    finally:
        db.close()


def get_db_dependency():
    """
    FastAPI dependency for database sessions.

    Usage in routes:
        @router.get("/endpoint")
        async def endpoint(db: Session = Depends(get_db_dependency)):
            ...
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
