"""
WeatherGPT Voice Routes
Speech-to-Text and Text-to-Speech integration for accessibility
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import logging

from backend.services.voice_service import voice_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["Voice"])


class TTSRequest(BaseModel):
    """Request model for text-to-speech."""
    text: str
    language: str = "en"
    voice_gender: str = "female"
    speed: float = 1.0


@router.get("/")
async def get_voice_info():
    """
    Get voice service information.

    Returns:
        Voice service capabilities and supported languages
    """
    return {
        "service": "WeatherGPT Voice API",
        "description": "Speech-to-Text and Text-to-Speech for accessibility",
        "features": [
            "Multi-language STT (Groq Whisper)",
            "Natural TTS synthesis (OpenAI TTS / Web Speech API)",
            "10 Indian languages supported",
            "Accessibility compliance"
        ],
        "supported_languages": voice_service.get_supported_languages(),
        "audio_formats": {
            "input": ["wav", "mp3", "ogg", "flac", "webm", "m4a", "opus"],
            "output": ["mp3", "opus"]
        },
        "low_bandwidth": {
            "compression": "opus codec at 16kbps",
            "typical_reduction": "70-85%",
            "recommended_for": "Rural areas with 2G/3G connectivity"
        },
        "providers": {
            "stt": "groq-whisper (fallback: mock)",
            "tts": "web-speech-api (fallback: openai-tts)"
        },
        "max_audio_duration_seconds": 300,
        "max_text_length": 4096
    }


@router.post("/stt")
async def speech_to_text(
    audio_file: UploadFile = File(...),
    language: str = Form(default="en"),
    compress: bool = Form(default=True)
):
    """
    Convert speech to text using Groq Whisper.

    Args:
        audio_file: Audio file (WAV, MP3, OGG, FLAC, WebM, Opus)
        language: Language code (en, hi, ta, te, bn, mr, kn, gu, ml, pa, or auto)
        compress: Enable audio compression for low bandwidth (default: True)

    Returns:
        Transcribed text and metadata

    Example:
        curl -X POST /api/v1/voice/stt \\
          -F "audio_file=@recording.wav" \\
          -F "language=hi" \\
          -F "compress=true"
    """
    if not audio_file:
        raise HTTPException(status_code=400, detail="Audio file is required")

    # Validate file type
    allowed_extensions = ["wav", "mp3", "ogg", "flac", "webm", "m4a", "opus"]
    file_ext = audio_file.filename.split(".")[-1].lower() if "." in audio_file.filename else ""

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported audio format. Allowed: {', '.join(allowed_extensions)}"
        )

    try:
        # Read audio data
        audio_data = await audio_file.read()
        file_size = len(audio_data)

        # Check file size (max 25MB)
        if file_size > 25 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="Audio file too large. Maximum size: 25MB"
            )

        logger.info(f"Processing STT for {audio_file.filename} ({file_size} bytes, language={language}, compress={compress})")

        # Transcribe audio
        transcription = await voice_service.transcribe_audio(
            audio_data=audio_data,
            language=language,
            audio_format=file_ext
        )

        return {
            "status": "success",
            "transcription": {
                "text": transcription["text"],
                "language": transcription["language"],
                "confidence": transcription.get("confidence", 1.0),
                "provider": transcription.get("provider", "unknown")
            },
            "audio": {
                "filename": audio_file.filename,
                "size_bytes": file_size,
                "format": file_ext,
                "compressed": compress
            },
            "timestamp": datetime.utcnow().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"STT error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to transcribe audio: {str(e)}"
        )


@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """
    Convert text to speech.

    Args:
        request: TTSRequest with text, language, voice_gender, speed

    Returns:
        Audio data (base64 encoded) or instructions for client-side synthesis

    Example:
        {
            "text": "Hello, the weather in Mumbai is sunny today",
            "language": "en",
            "voice_gender": "female",
            "speed": 1.0
        }
    """
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    if len(request.text) > 4096:
        raise HTTPException(
            status_code=400,
            detail="Text too long. Maximum length: 4096 characters"
        )

    if request.speed < 0.5 or request.speed > 2.0:
        raise HTTPException(
            status_code=400,
            detail="Speed must be between 0.5 and 2.0"
        )

    try:
        logger.info(f"Processing TTS for {len(request.text)} chars (language={request.language})")

        # Synthesize speech
        result = await voice_service.synthesize_speech(
            text=request.text,
            language=request.language,
            voice_gender=request.voice_gender,
            speed=request.speed
        )

        return {
            "status": "success",
            "synthesis": result,
            "timestamp": datetime.utcnow().isoformat()
        }

    except Exception as e:
        logger.error(f"TTS error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to synthesize speech: {str(e)}"
        )


@router.get("/languages")
async def get_supported_languages():
    """
    Get list of supported languages for voice features.

    Returns:
        List of supported languages with codes and locales
    """
    return {
        "languages": voice_service.get_supported_languages(),
        "total": len(voice_service.get_supported_languages())
    }


@router.get("/test")
async def test_voice_service():
    """
    Test voice service configuration and availability.

    Returns:
        Service status and provider information
    """
    import os

    return {
        "stt": {
            "provider": voice_service.stt_provider,
            "configured": bool(os.getenv("LLM_PRIMARY_API_KEY")),
            "status": "ready" if os.getenv("LLM_PRIMARY_API_KEY") else "api_key_missing"
        },
        "tts": {
            "provider": voice_service.tts_provider,
            "configured": voice_service.tts_provider == "web",
            "status": "ready"
        },
        "supported_languages": len(voice_service.get_supported_languages())
    }
