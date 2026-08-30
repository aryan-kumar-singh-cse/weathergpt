"""
WeatherGPT Voice Service
Speech-to-Text and Text-to-Speech implementation
Supports multiple providers: Web Speech API, Google Cloud, Azure, OpenAI Whisper
"""

import os
import io
import logging
from typing import Optional, Dict, Any, BinaryIO
import tempfile
import base64
import asyncio
from pathlib import Path

logger = logging.getLogger(__name__)


class VoiceService:
    """Voice service with STT and TTS capabilities."""

    def __init__(self):
        self.stt_provider = os.getenv("STT_PROVIDER", "whisper")  # whisper, google, azure, web
        self.tts_provider = os.getenv("TTS_PROVIDER", "web")  # web, google, azure, elevenlabs

        logger.info(f"Voice service initialized: STT={self.stt_provider}, TTS={self.tts_provider}")

    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: str = "en",
        audio_format: str = "wav"
    ) -> Dict[str, Any]:
        """
        Transcribe audio to text using configured provider.

        Args:
            audio_data: Raw audio bytes
            language: Language code (en, hi, ta, etc.)
            audio_format: Audio format (wav, mp3, ogg, flac)

        Returns:
            Transcription result with text and metadata
        """
        try:
            # Compress audio for low-bandwidth scenarios
            compressed_audio = await self._compress_audio_if_needed(audio_data, audio_format)

            if self.stt_provider == "whisper":
                return await self._transcribe_with_whisper(compressed_audio, language)
            elif self.stt_provider == "groq":
                return await self._transcribe_with_groq(compressed_audio, language)
            else:
                # Fallback to mock transcription
                return {
                    "text": "[Mock transcription - configure STT provider]",
                    "language": language,
                    "confidence": 0.0,
                    "provider": "mock"
                }

        except Exception as e:
            logger.error(f"STT error: {e}")
            raise

    async def _transcribe_with_whisper(
        self,
        audio_data: bytes,
        language: str
    ) -> Dict[str, Any]:
        """Transcribe using OpenAI Whisper API."""
        try:
            from openai import AsyncOpenAI

            api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_PRIMARY_API_KEY")
            if not api_key:
                raise ValueError("OpenAI API key not configured")

            client = AsyncOpenAI(api_key=api_key)

            # Save audio to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name

            # Transcribe
            with open(temp_file_path, "rb") as audio_file:
                transcript = await client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language if language != "auto" else None
                )

            # Cleanup
            os.unlink(temp_file_path)

            return {
                "text": transcript.text,
                "language": language,
                "confidence": 1.0,
                "provider": "whisper"
            }

        except Exception as e:
            logger.error(f"Whisper STT error: {e}")
            raise

    async def _transcribe_with_groq(
        self,
        audio_data: bytes,
        language: str
    ) -> Dict[str, Any]:
        """Transcribe using Groq Whisper API."""
        try:
            from openai import AsyncOpenAI

            api_key = os.getenv("LLM_PRIMARY_API_KEY")
            if not api_key:
                raise ValueError("Groq API key not configured")

            client = AsyncOpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            )

            # Save audio to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name

            # Transcribe with Groq's Whisper
            with open(temp_file_path, "rb") as audio_file:
                transcript = await client.audio.transcriptions.create(
                    model="whisper-large-v3",
                    file=audio_file,
                    language=language if language != "auto" else None,
                    temperature=0.0
                )

            # Cleanup
            os.unlink(temp_file_path)

            return {
                "text": transcript.text,
                "language": language,
                "confidence": 1.0,
                "provider": "groq-whisper"
            }

        except Exception as e:
            logger.error(f"Groq Whisper STT error: {e}")
            # Fallback to mock
            return {
                "text": f"[STT unavailable: {str(e)}]",
                "language": language,
                "confidence": 0.0,
                "provider": "error"
            }

    async def synthesize_speech(
        self,
        text: str,
        language: str = "en",
        voice_gender: str = "female",
        speed: float = 1.0
    ) -> Dict[str, Any]:
        """
        Convert text to speech.

        Args:
            text: Text to synthesize
            language: Language code
            voice_gender: male or female
            speed: Speech rate (0.5 to 2.0)

        Returns:
            Audio data and metadata
        """
        try:
            if self.tts_provider == "groq":
                return await self._synthesize_with_groq(text, language, voice_gender, speed)
            elif self.tts_provider == "openai":
                return await self._synthesize_with_openai(text, language, voice_gender, speed)
            else:
                # Return metadata for Web Speech API (client-side TTS)
                return {
                    "provider": "web",
                    "text": text,
                    "language": language,
                    "voice_gender": voice_gender,
                    "speed": speed,
                    "audio_url": None,  # Client will synthesize
                    "instructions": "Use browser Web Speech API for synthesis"
                }

        except Exception as e:
            logger.error(f"TTS error: {e}")
            raise

    async def _synthesize_with_openai(
        self,
        text: str,
        language: str,
        voice_gender: str,
        speed: float
    ) -> Dict[str, Any]:
        """Synthesize speech using OpenAI TTS."""
        try:
            from openai import AsyncOpenAI

            api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_PRIMARY_API_KEY")
            if not api_key:
                raise ValueError("OpenAI API key not configured")

            client = AsyncOpenAI(api_key=api_key)

            # Map voice gender to OpenAI voices
            voice_map = {
                "female": "nova",  # or "alloy", "shimmer"
                "male": "onyx"     # or "echo", "fable"
            }
            voice = voice_map.get(voice_gender, "nova")

            # Generate speech
            response = await client.audio.speech.create(
                model="tts-1",
                voice=voice,
                input=text[:4096],  # Limit to 4096 chars
                speed=speed
            )

            # Get audio bytes
            audio_data = response.content

            # Encode as base64 for JSON response
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')

            return {
                "provider": "openai-tts",
                "text": text,
                "language": language,
                "voice": voice,
                "speed": speed,
                "audio_format": "mp3",
                "audio_base64": audio_base64,
                "audio_size": len(audio_data)
            }

        except Exception as e:
            logger.error(f"OpenAI TTS error: {e}")
            raise

    async def _synthesize_with_groq(
        self,
        text: str,
        language: str,
        voice_gender: str,
        speed: float
    ) -> Dict[str, Any]:
        """Synthesize speech using Groq (if available)."""
        # Groq doesn't have TTS API yet, fallback to web
        return {
            "provider": "web",
            "text": text,
            "language": language,
            "voice_gender": voice_gender,
            "speed": speed,
            "audio_url": None,
            "instructions": "Use browser Web Speech API for synthesis"
        }

    async def _compress_audio_if_needed(
        self,
        audio_data: bytes,
        audio_format: str
    ) -> bytes:
        """
        Compress audio for low-bandwidth scenarios using ffmpeg if available.
        Falls back to original audio if compression fails.

        Args:
            audio_data: Raw audio bytes
            audio_format: Audio format

        Returns:
            Compressed audio bytes (or original if compression unavailable)
        """
        # Skip compression if file is already small (< 500KB)
        if len(audio_data) < 500 * 1024:
            return audio_data

        try:
            # Check if ffmpeg is available
            import shutil
            if not shutil.which('ffmpeg'):
                logger.warning("ffmpeg not available, skipping compression")
                return audio_data

            # Create temp files
            with tempfile.NamedTemporaryFile(suffix=f'.{audio_format}', delete=False) as input_file:
                input_file.write(audio_data)
                input_path = input_file.name

            output_path = input_path.replace(f'.{audio_format}', '_compressed.opus')

            # Compress using opus codec (excellent for speech, low bandwidth)
            process = await asyncio.create_subprocess_exec(
                'ffmpeg', '-i', input_path,
                '-c:a', 'libopus',
                '-b:a', '16k',  # 16 kbps - good for speech
                '-vbr', 'on',
                '-compression_level', '10',
                '-frame_duration', '60',  # Optimize for speech
                '-application', 'voip',
                '-y',  # Overwrite output
                output_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )

            await process.communicate()

            # Read compressed audio
            if os.path.exists(output_path):
                with open(output_path, 'rb') as f:
                    compressed_data = f.read()

                # Cleanup
                os.unlink(input_path)
                os.unlink(output_path)

                original_size = len(audio_data)
                compressed_size = len(compressed_data)
                reduction = ((original_size - compressed_size) / original_size) * 100

                logger.info(f"Audio compressed: {original_size} → {compressed_size} bytes ({reduction:.1f}% reduction)")
                return compressed_data
            else:
                os.unlink(input_path)
                return audio_data

        except Exception as e:
            logger.warning(f"Audio compression failed, using original: {e}")
            return audio_data

    def get_supported_languages(self) -> list:
        """Get list of supported languages for voice."""
        return [
            {"code": "en", "name": "English", "locale": "en-IN", "whisper_code": "en"},
            {"code": "hi", "name": "Hindi", "locale": "hi-IN", "whisper_code": "hi"},
            {"code": "ta", "name": "Tamil", "locale": "ta-IN", "whisper_code": "ta"},
            {"code": "te", "name": "Telugu", "locale": "te-IN", "whisper_code": "te"},
            {"code": "bn", "name": "Bengali", "locale": "bn-IN", "whisper_code": "bn"},
            {"code": "mr", "name": "Marathi", "locale": "mr-IN", "whisper_code": "mr"},
            {"code": "kn", "name": "Kannada", "locale": "kn-IN", "whisper_code": "kn"},
            {"code": "gu", "name": "Gujarati", "locale": "gu-IN", "whisper_code": "gu"},
            {"code": "ml", "name": "Malayalam", "locale": "ml-IN", "whisper_code": "ml"},
            {"code": "pa", "name": "Punjabi", "locale": "pa-IN", "whisper_code": "pa"}
        ]


# Global instance
voice_service = VoiceService()
