"use client"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Volume2, VolumeX, Loader2, AlertCircle } from "lucide-react"
import { interactive, radius, typography } from "@/lib/design-system"

interface VoiceInputProps {
  onTranscription: (text: string) => void
  language?: string
  disabled?: boolean
}

export default function VoiceInput({ onTranscription, language = "en", disabled = false }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSupported, setIsSupported] = useState(true)
  const [audioLevel, setAudioLevel] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Check if browser supports media recording
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsSupported(false)
    }

    // Cleanup on unmount
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      setRecordingDuration(0)

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000  // Lower sample rate for bandwidth efficiency
        }
      })

      // Setup audio level monitoring
      audioContextRef.current = new AudioContext({ sampleRate: 16000 })
      const source = audioContextRef.current.createMediaStreamSource(stream)
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      source.connect(analyserRef.current)

      // Monitor audio levels for visual feedback
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
      const updateLevel = () => {
        if (analyserRef.current && isRecording) {
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setAudioLevel(average / 255)
          requestAnimationFrame(updateLevel)
        }
      }
      updateLevel()

      // Use opus codec if available (best for speech compression)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 16000  // Low bitrate for rural connectivity
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: mimeType })
        await sendAudioToBackend(audioBlob)

        // Cleanup
        stream.getTracks().forEach(track => track.stop())
        if (audioContextRef.current) {
          audioContextRef.current.close()
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current)
        }
      }

      mediaRecorder.start(1000)  // Collect data every second
      setIsRecording(true)

      // Start duration timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error('Error starting recording:', err)
      setError('Failed to access microphone. Please grant permission.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setAudioLevel(0)
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current)
      }
    }
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const sendAudioToBackend = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('audio_file', audioBlob, 'recording.webm')
      formData.append('language', language)
      formData.append('compress', 'true')  // Enable compression for low bandwidth

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

      // Add timeout for slow connections
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)  // 30s timeout

      const response = await fetch(`${apiUrl}/voice/stt`, {
        method: 'POST',
        body: formData,
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.detail || `STT failed: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.status === 'success' && data.transcription?.text) {
        onTranscription(data.transcription.text)
      } else {
        throw new Error('No transcription received')
      }
    } catch (err) {
      console.error('Error sending audio:', err)

      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          setError('Request timeout. Please check your connection and try again.')
        } else {
          setError(err.message || 'Failed to transcribe audio. Please try again.')
        }
      } else {
        setError('Failed to transcribe audio. Please try again.')
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (!isSupported) {
    return (
      <button
        disabled
        className="p-2 text-gray-400 cursor-not-allowed"
        title="Voice input not supported in this browser"
        aria-label="Voice input not supported in this browser"
      >
        <MicOff className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={handleToggleRecording}
        disabled={disabled || isProcessing}
        className={`p-2 rounded-lg transition-all relative ${
          isRecording
            ? 'bg-red-500 text-white'
            : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
        } ${disabled || isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}

        {/* Audio level indicator */}
        {isRecording && (
          <div
            className="absolute inset-0 rounded-lg border-2 border-white/50"
            style={{
              transform: `scale(${1 + audioLevel * 0.3})`,
              transition: 'transform 0.1s ease-out'
            }}
          />
        )}
      </button>

      {/* Recording status indicator */}
      {isRecording && (
        <div
          className="absolute bottom-full mb-2 right-0 px-3 py-1 bg-red-500 text-white text-xs rounded-lg shadow-lg whitespace-nowrap"
          role="status"
          aria-live="polite"
        >
          Recording {formatDuration(recordingDuration)}
        </div>
      )}

      {/* Processing status */}
      {isProcessing && (
        <div
          className="absolute bottom-full mb-2 right-0 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg shadow-lg whitespace-nowrap"
          role="status"
          aria-live="polite"
        >
          Processing...
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="absolute bottom-full mb-2 right-0 w-56 p-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Recording pulse indicator */}
      {isRecording && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
      )}
    </div>
  )
}


interface VoiceOutputProps {
  text: string
  language?: string
  autoPlay?: boolean
}

export function VoiceOutput({ text, language = "en", autoPlay = false }: VoiceOutputProps) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isSupported, setIsSupported] = useState(true)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis
    } else {
      setIsSupported(false)
    }
  }, [])

  useEffect(() => {
    if (autoPlay && text && isSupported) {
      speak()
    }
  }, [text, autoPlay, isSupported])

  const speak = () => {
    if (!synthRef.current || !text) return

    // Cancel any ongoing speech
    synthRef.current.cancel()

    const utterance = new SpeechSynthesisUtterance(text)

    // Map language codes to speech synthesis locales
    const localeMap: Record<string, string> = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'ta': 'ta-IN',
      'te': 'te-IN',
      'bn': 'bn-IN',
      'mr': 'mr-IN',
      'kn': 'kn-IN',
      'gu': 'gu-IN',
      'ml': 'ml-IN',
      'pa': 'pa-IN'
    }

    utterance.lang = localeMap[language] || 'en-IN'
    utterance.rate = 0.9
    utterance.pitch = 1.0

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    synthRef.current.speak(utterance)
  }

  const stop = () => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }

  const handleToggleSpeech = () => {
    if (isSpeaking) {
      stop()
    } else {
      speak()
    }
  }

  if (!isSupported) {
    return null
  }

  return (
    <button
      onClick={handleToggleSpeech}
      className={`
        p-2.5 ${radius.md} transition-all
        ${isSpeaking
          ? 'bg-blue-500 hover:bg-blue-600 text-white'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        }
        ${interactive.focus}
      `}
      aria-label={isSpeaking ? 'Stop text-to-speech playback' : 'Read message aloud'}
      aria-pressed={isSpeaking}
    >
      {isSpeaking ? (
        <VolumeX className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Volume2 className="w-5 h-5" aria-hidden="true" />
      )}
    </button>
  )
}
