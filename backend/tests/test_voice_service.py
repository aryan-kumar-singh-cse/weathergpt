"""
Tests for Voice Service
STT and TTS functionality testing
"""

import pytest
import os
from pathlib import Path
from backend.services.voice_service import VoiceService


@pytest.fixture
def voice_service():
    """Create voice service instance."""
    return VoiceService()


@pytest.fixture
def sample_audio_data():
    """Mock audio data for testing."""
    # 1 second of silence in WAV format (44 bytes header + minimal data)
    wav_header = b'RIFF$\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
    return wav_header


class TestVoiceServiceConfiguration:
    """Test voice service configuration and initialization."""

    def test_service_initialization(self, voice_service):
        """Test service initializes with correct providers."""
        assert voice_service.stt_provider in ["whisper", "groq", "web"]
        assert voice_service.tts_provider in ["web", "groq", "openai"]

    def test_supported_languages(self, voice_service):
        """Test supported languages list."""
        languages = voice_service.get_supported_languages()

        assert len(languages) == 10
        assert any(lang["code"] == "en" for lang in languages)
        assert any(lang["code"] == "hi" for lang in languages)
        assert any(lang["code"] == "ta" for lang in languages)

        # Verify each language has required fields
        for lang in languages:
            assert "code" in lang
            assert "name" in lang
            assert "locale" in lang
            assert "whisper_code" in lang


class TestSpeechToText:
    """Test STT functionality."""

    @pytest.mark.asyncio
    async def test_transcribe_returns_structure(self, voice_service, sample_audio_data):
        """Test transcription returns expected data structure."""
        result = await voice_service.transcribe_audio(
            audio_data=sample_audio_data,
            language="en",
            audio_format="wav"
        )

        assert "text" in result
        assert "language" in result
        assert "provider" in result
        assert isinstance(result["text"], str)

    @pytest.mark.asyncio
    async def test_transcribe_with_different_languages(self, voice_service, sample_audio_data):
        """Test transcription with various Indian languages."""
        languages = ["en", "hi", "ta", "te"]

        for lang in languages:
            result = await voice_service.transcribe_audio(
                audio_data=sample_audio_data,
                language=lang,
                audio_format="wav"
            )
            assert result["language"] == lang

    @pytest.mark.asyncio
    async def test_transcribe_handles_empty_audio(self, voice_service):
        """Test transcription handles empty audio data."""
        with pytest.raises(Exception):
            await voice_service.transcribe_audio(
                audio_data=b"",
                language="en",
                audio_format="wav"
            )


class TestTextToSpeech:
    """Test TTS functionality."""

    @pytest.mark.asyncio
    async def test_synthesize_returns_structure(self, voice_service):
        """Test synthesis returns expected data structure."""
        result = await voice_service.synthesize_speech(
            text="Hello world",
            language="en",
            voice_gender="female",
            speed=1.0
        )

        assert "provider" in result
        assert "text" in result
        assert result["text"] == "Hello world"

    @pytest.mark.asyncio
    async def test_synthesize_with_different_parameters(self, voice_service):
        """Test synthesis with various parameters."""
        test_cases = [
            {"text": "Weather update", "language": "en", "speed": 1.0},
            {"text": "मौसम अपडेट", "language": "hi", "speed": 0.9},
            {"text": "வானிலை புதுப்பிப்பு", "language": "ta", "speed": 1.1},
        ]

        for case in test_cases:
            result = await voice_service.synthesize_speech(**case)
            assert result["language"] == case["language"]

    @pytest.mark.asyncio
    async def test_synthesize_handles_empty_text(self, voice_service):
        """Test synthesis handles empty text."""
        result = await voice_service.synthesize_speech(
            text="",
            language="en"
        )
        # Should return structure even with empty text
        assert "provider" in result


class TestLowBandwidthOptimization:
    """Test audio compression and low-bandwidth features."""

    @pytest.mark.asyncio
    async def test_compression_skips_small_files(self, voice_service, sample_audio_data):
        """Test compression skips files smaller than threshold."""
        # Small file should not be compressed
        compressed = await voice_service._compress_audio_if_needed(
            sample_audio_data,
            "wav"
        )
        assert len(compressed) == len(sample_audio_data)

    @pytest.mark.asyncio
    async def test_compression_handles_missing_ffmpeg(self, voice_service):
        """Test compression gracefully handles missing ffmpeg."""
        large_audio = b"x" * (600 * 1024)  # 600KB

        # Should fallback to original data if ffmpeg unavailable
        result = await voice_service._compress_audio_if_needed(
            large_audio,
            "wav"
        )
        assert isinstance(result, bytes)
        assert len(result) > 0


class TestErrorHandling:
    """Test error handling in voice service."""

    @pytest.mark.asyncio
    async def test_invalid_audio_format(self, voice_service):
        """Test handling of invalid audio format."""
        with pytest.raises(Exception):
            await voice_service.transcribe_audio(
                audio_data=b"invalid",
                language="en",
                audio_format="invalid"
            )

    @pytest.mark.asyncio
    async def test_unsupported_language(self, voice_service, sample_audio_data):
        """Test handling of unsupported language codes."""
        # Should still process, may fallback to English
        result = await voice_service.transcribe_audio(
            audio_data=sample_audio_data,
            language="xx",  # Invalid code
            audio_format="wav"
        )
        assert "text" in result


class TestProviderFallbacks:
    """Test provider fallback mechanisms."""

    @pytest.mark.asyncio
    async def test_stt_fallback_on_api_failure(self, voice_service, sample_audio_data):
        """Test STT falls back gracefully when API unavailable."""
        # Remove API key to simulate failure
        original_key = os.getenv("LLM_PRIMARY_API_KEY")
        os.environ.pop("LLM_PRIMARY_API_KEY", None)

        try:
            result = await voice_service.transcribe_audio(
                audio_data=sample_audio_data,
                language="en",
                audio_format="wav"
            )
            # Should return mock/fallback response
            assert "text" in result
        finally:
            if original_key:
                os.environ["LLM_PRIMARY_API_KEY"] = original_key

    @pytest.mark.asyncio
    async def test_tts_fallback_to_web(self, voice_service):
        """Test TTS falls back to web speech API."""
        result = await voice_service.synthesize_speech(
            text="Test fallback",
            language="en"
        )
        # Should return web provider instructions
        assert result["provider"] in ["web", "openai-tts"]


@pytest.mark.integration
class TestIntegration:
    """Integration tests requiring API keys."""

    @pytest.mark.skipif(
        not os.getenv("LLM_PRIMARY_API_KEY"),
        reason="Requires LLM_PRIMARY_API_KEY environment variable"
    )
    @pytest.mark.asyncio
    async def test_real_groq_transcription(self, voice_service, sample_audio_data):
        """Test real Groq Whisper API transcription."""
        result = await voice_service.transcribe_audio(
            audio_data=sample_audio_data,
            language="en",
            audio_format="wav"
        )

        assert result["provider"] == "groq-whisper"
        assert isinstance(result["text"], str)
        assert result["confidence"] >= 0.0

    @pytest.mark.skipif(
        not os.getenv("OPENAI_API_KEY"),
        reason="Requires OPENAI_API_KEY environment variable"
    )
    @pytest.mark.asyncio
    async def test_real_openai_tts(self, voice_service):
        """Test real OpenAI TTS synthesis."""
        voice_service.tts_provider = "openai"

        result = await voice_service.synthesize_speech(
            text="Hello, this is a test.",
            language="en",
            voice_gender="female"
        )

        assert result["provider"] == "openai-tts"
        assert "audio_base64" in result
        assert result["audio_format"] == "mp3"
