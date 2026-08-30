"""
Voice Integration Example
Demonstrates how to integrate voice features with the WeatherGPT API
"""

import asyncio
import os
from pathlib import Path
from backend.services.voice_service import voice_service


async def example_complete_voice_flow():
    """
    Complete voice interaction flow:
    1. User speaks weather query
    2. STT converts to text
    3. Text sent to /api/ask (existing endpoint)
    4. Response converted to speech
    5. Audio played to user
    """
    print("=== Complete Voice Flow Example ===\n")

    # Step 1: Simulate audio input (in production, this comes from microphone)
    # For demo, we'll use a sample audio file
    audio_file = Path(__file__).parent / "sample_audio.wav"

    if not audio_file.exists():
        print("Note: Using mock audio data (sample_audio.wav not found)")
        # Mock audio data
        audio_data = b"mock_audio_data"
    else:
        with open(audio_file, "rb") as f:
            audio_data = f.read()

    print(f"Step 1: Audio captured ({len(audio_data)} bytes)")

    # Step 2: Speech-to-Text
    print("\nStep 2: Converting speech to text...")
    try:
        transcription = await voice_service.transcribe_audio(
            audio_data=audio_data,
            language="hi",  # Hindi
            audio_format="wav"
        )

        user_text = transcription["text"]
        print(f"  ✓ Transcription: '{user_text}'")
        print(f"  Provider: {transcription['provider']}")
        print(f"  Confidence: {transcription.get('confidence', 'N/A')}")

    except Exception as e:
        print(f"  ✗ STT Error: {e}")
        # In production, fall back to text input
        user_text = "What is the weather in Mumbai?"

    # Step 3: Process through existing /api/ask endpoint
    print("\nStep 3: Processing query through /api/ask...")
    # In production, this would be an HTTP request to /api/ask
    # For this example, we'll simulate the response
    bot_response = "The weather in Mumbai is sunny with a temperature of 32°C."
    print(f"  ✓ Response: '{bot_response}'")

    # Step 4: Text-to-Speech
    print("\nStep 4: Converting response to speech...")
    try:
        synthesis = await voice_service.synthesize_speech(
            text=bot_response,
            language="en",
            voice_gender="female",
            speed=1.0
        )

        print(f"  ✓ Speech synthesis complete")
        print(f"  Provider: {synthesis['provider']}")

        if synthesis["provider"] == "openai-tts":
            print(f"  Audio format: {synthesis['audio_format']}")
            print(f"  Audio size: {synthesis['audio_size']} bytes")
        else:
            print(f"  Client-side synthesis: {synthesis['instructions']}")

    except Exception as e:
        print(f"  ✗ TTS Error: {e}")

    print("\n✓ Complete voice flow executed successfully")


async def example_multilingual_voice():
    """Demonstrate multilingual voice support."""
    print("\n\n=== Multilingual Voice Example ===\n")

    languages = [
        ("en", "What is the weather today?"),
        ("hi", "आज का मौसम कैसा है?"),
        ("ta", "இன்று வானிலை எப்படி இருக்கிறது?"),
        ("te", "ఈరోజు వాతావరణం ఎలా ఉంది?")
    ]

    for lang_code, sample_query in languages:
        lang_info = next(
            (l for l in voice_service.get_supported_languages() if l["code"] == lang_code),
            None
        )

        if lang_info:
            print(f"\nLanguage: {lang_info['name']} ({lang_info['locale']})")
            print(f"Sample query: {sample_query}")

            # Simulate TTS
            try:
                synthesis = await voice_service.synthesize_speech(
                    text=sample_query,
                    language=lang_code,
                    voice_gender="female"
                )
                print(f"  ✓ TTS available via {synthesis['provider']}")
            except Exception as e:
                print(f"  ✗ TTS error: {e}")


async def example_low_bandwidth_optimization():
    """Demonstrate audio compression for low-bandwidth scenarios."""
    print("\n\n=== Low-Bandwidth Optimization Example ===\n")

    # Simulate large audio file
    large_audio = b"x" * (1024 * 1024)  # 1MB
    print(f"Original audio size: {len(large_audio)} bytes ({len(large_audio) / 1024:.1f} KB)")

    # Test compression
    try:
        compressed = await voice_service._compress_audio_if_needed(
            large_audio,
            "wav"
        )

        compression_ratio = len(compressed) / len(large_audio)
        reduction = (1 - compression_ratio) * 100

        print(f"Compressed size: {len(compressed)} bytes ({len(compressed) / 1024:.1f} KB)")
        print(f"Compression ratio: {compression_ratio:.2f}")
        print(f"Size reduction: {reduction:.1f}%")

        if len(compressed) < len(large_audio):
            print("✓ Compression successful")
        else:
            print("✓ Compression skipped (ffmpeg not available or file too small)")

    except Exception as e:
        print(f"✗ Compression error: {e}")


async def example_error_handling():
    """Demonstrate error handling and fallback mechanisms."""
    print("\n\n=== Error Handling Example ===\n")

    # Test 1: Invalid audio data
    print("Test 1: Invalid audio data")
    try:
        result = await voice_service.transcribe_audio(
            audio_data=b"",
            language="en",
            audio_format="wav"
        )
        print(f"  Result: {result}")
    except Exception as e:
        print(f"  ✓ Caught error: {type(e).__name__}")

    # Test 2: Empty text for TTS
    print("\nTest 2: Empty text for TTS")
    try:
        result = await voice_service.synthesize_speech(
            text="",
            language="en"
        )
        print(f"  ✓ Handled gracefully: {result['provider']}")
    except Exception as e:
        print(f"  ✓ Caught error: {type(e).__name__}")

    # Test 3: Unsupported language fallback
    print("\nTest 3: Unsupported language code")
    try:
        result = await voice_service.transcribe_audio(
            audio_data=b"mock_data",
            language="zz",  # Invalid code
            audio_format="wav"
        )
        print(f"  ✓ Fallback handled: {result['provider']}")
    except Exception as e:
        print(f"  ✓ Caught error: {type(e).__name__}")


async def example_supported_languages():
    """Display all supported languages."""
    print("\n\n=== Supported Languages ===\n")

    languages = voice_service.get_supported_languages()
    print(f"Total: {len(languages)} languages\n")

    print(f"{'Code':<6} {'Name':<12} {'Locale':<10} {'Whisper Code':<12}")
    print("-" * 50)

    for lang in languages:
        print(f"{lang['code']:<6} {lang['name']:<12} {lang['locale']:<10} {lang['whisper_code']:<12}")


async def example_api_integration():
    """Show how to integrate with FastAPI endpoints."""
    print("\n\n=== API Integration Example ===\n")

    print("Frontend JavaScript example:")
    print("""
// Record audio from microphone
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus',
  audioBitsPerSecond: 16000  // Low bandwidth
});

const chunks = [];
mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

mediaRecorder.onstop = async () => {
  const audioBlob = new Blob(chunks, { type: 'audio/webm' });

  // Send to STT endpoint
  const formData = new FormData();
  formData.append('audio_file', audioBlob, 'recording.webm');
  formData.append('language', 'hi');
  formData.append('compress', 'true');

  const response = await fetch('/api/v1/voice/stt', {
    method: 'POST',
    body: formData
  });

  const { transcription } = await response.json();
  console.log('User said:', transcription.text);

  // Send text to existing /api/ask endpoint
  const askResponse = await fetch('/api/v1/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: transcription.text,
      language: 'hi',
      role: 'citizen'
    })
  });

  const { response: botResponse } = await askResponse.json();

  // Convert response to speech
  const ttsResponse = await fetch('/api/v1/voice/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: botResponse,
      language: 'hi',
      voice_gender: 'female'
    })
  });

  const { synthesis } = await ttsResponse.json();

  if (synthesis.provider === 'web') {
    // Use Web Speech API
    const utterance = new SpeechSynthesisUtterance(synthesis.text);
    utterance.lang = 'hi-IN';
    speechSynthesis.speak(utterance);
  } else {
    // Play base64 audio
    const audio = new Audio(`data:audio/mp3;base64,${synthesis.audio_base64}`);
    audio.play();
  }
};

mediaRecorder.start();
""")


async def main():
    """Run all examples."""
    print("WeatherGPT Voice Integration Examples")
    print("=" * 50)

    await example_complete_voice_flow()
    await example_multilingual_voice()
    await example_low_bandwidth_optimization()
    await example_error_handling()
    await example_supported_languages()
    await example_api_integration()

    print("\n" + "=" * 50)
    print("All examples completed!")
    print("\nFor more information, see VOICE_FEATURES.md")


if __name__ == "__main__":
    asyncio.run(main())
