"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Send, Sparkles, Bot, User, AlertCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { askWeatherQuestion } from "@/lib/api"
import { AskResponse } from "@/lib/types"
import VoiceInput, { VoiceOutput } from "@/components/VoiceInput"
import { typography, interactive, radius, getStatusClasses } from "@/lib/design-system"

interface Message {
  role: 'user' | 'assistant'
  content: string
  metadata?: {
    severity?: string
    llm_tier?: string | null
    intent?: string
    role?: string
  }
}

interface EnhancedChatInterfaceProps {
  location: string
  role: string
  language: string
  email?: string
}

export default function EnhancedChatInterface({
  location,
  role,
  language,
  email
}: EnhancedChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm WeatherGPT, your AI weather assistant. Ask me about the weather in ${location} or any weather-related questions.`
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    remaining: number
    total: number
    resetTime?: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return

    const userMsg = input
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setInput('')
    setIsTyping(true)
    setError(null)

    try {
      const result: AskResponse = await askWeatherQuestion(userMsg, language, role)

      // Update rate limit info if available
      if (result.rate_limit) {
        setRateLimitInfo({
          remaining: result.rate_limit.remaining,
          total: result.rate_limit.limit,
          resetTime: result.rate_limit.reset_at
        })
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: result.response,
        metadata: {
          severity: result.severity.severity,
          llm_tier: result.llm_tier_used,
          intent: result.intent.intent,
          role: result.role
        }
      }])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'

      // Check for rate limit error
      if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        setError('You have reached your daily question limit. Please try again tomorrow.')
        setRateLimitInfo(prev => prev ? { ...prev, remaining: 0 } : { remaining: 0, total: 50 })
      } else {
        setError(errorMessage)
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `I encountered an issue: ${errorMessage}. Please try again or rephrase your question.`,
        metadata: {
          severity: 'normal',
          llm_tier: null
        }
      }])
    } finally {
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }, [input, language, role, isTyping])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleVoiceTranscription = useCallback((text: string) => {
    setInput(text)
    inputRef.current?.focus()
  }, [])

  const isRateLimited = rateLimitInfo !== null && rateLimitInfo.remaining === 0

  return (
    <div className="flex flex-col h-full">
      {/* Rate Limit Banner */}
      {rateLimitInfo && (
        <div
          className={`
            mb-4 p-3 ${radius.md}
            ${rateLimitInfo.remaining <= 5 && rateLimitInfo.remaining > 0
              ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
              : rateLimitInfo.remaining === 0
              ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
              : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
            }
          `}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            <Info
              className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                rateLimitInfo.remaining === 0
                  ? 'text-red-600 dark:text-red-400'
                  : rateLimitInfo.remaining <= 5
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
              aria-hidden="true"
            />
            <div className="flex-1">
              <p className={`${typography.caption} font-medium`}>
                {rateLimitInfo.remaining === 0 ? (
                  <>Daily limit reached. Resets {rateLimitInfo.resetTime || 'in 24 hours'}.</>
                ) : (
                  <>{rateLimitInfo.remaining} of {rateLimitInfo.total} questions remaining today</>
                )}
              </p>
              {!email && rateLimitInfo.remaining <= 10 && (
                <p className={`${typography.caption} mt-1 opacity-80`}>
                  Sign in to track your usage across sessions
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div
          className={`mb-4 p-3 ${radius.md} bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800`}
          role="alert"
        >
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" aria-hidden="true" />
            <p className={`${typography.caption} text-red-800 dark:text-red-200`}>{error}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 space-y-3 overflow-y-auto mb-4 pr-2"
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        aria-atomic="false"
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`
                max-w-[85%] ${radius.lg} px-4 py-3 shadow-sm
                ${msg.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }
              `}
            >
              {/* Message Header with Icon */}
              <div className="flex items-center gap-2 mb-2">
                {msg.role === 'user' ? (
                  <User className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Bot className="w-4 h-4" aria-hidden="true" />
                )}
                <span className={`${typography.caption} font-medium opacity-80`}>
                  {msg.role === 'user' ? 'You' : 'WeatherGPT'}
                </span>
              </div>

              {/* Message Content */}
              <p className={typography.bodySmall}>{msg.content}</p>

              {/* Metadata */}
              {msg.role === 'assistant' && msg.metadata && (
                <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-white/20 dark:border-white/10">
                  {msg.metadata.severity && msg.metadata.severity !== 'normal' && (
                    <span
                      className={`
                        inline-flex items-center gap-1 px-2 py-0.5 ${radius.sm}
                        ${typography.caption} font-medium
                        ${getStatusClasses(msg.metadata.severity as any).bg}
                        ${getStatusClasses(msg.metadata.severity as any).text}
                      `}
                      aria-label={`Severity: ${msg.metadata.severity}`}
                    >
                      <AlertCircle className="w-3 h-3" aria-hidden="true" />
                      {msg.metadata.severity}
                    </span>
                  )}
                  {msg.metadata.llm_tier && (
                    <span
                      className={`px-2 py-0.5 ${radius.sm} ${typography.caption} bg-white/20 dark:bg-white/10`}
                      title="AI model tier used"
                    >
                      {msg.metadata.llm_tier}
                    </span>
                  )}
                  {msg.metadata.intent && (
                    <span
                      className={`px-2 py-0.5 ${radius.sm} ${typography.caption} bg-white/20 dark:bg-white/10`}
                      title="Detected intent"
                    >
                      {msg.metadata.intent}
                    </span>
                  )}

                  {/* Voice Output for assistant messages */}
                  <VoiceOutput text={msg.content} language={language} autoPlay={false} />
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className={`bg-gray-100 dark:bg-gray-800 ${radius.lg} px-4 py-3`}>
              <div className="flex items-center gap-2 mb-2">
                <Bot className="w-4 h-4 text-gray-600 dark:text-gray-400" aria-hidden="true" />
                <span className={`${typography.caption} text-gray-600 dark:text-gray-400`}>
                  WeatherGPT is typing...
                </span>
              </div>
              <div className="flex gap-1" aria-label="Loading">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRateLimited ? "Daily limit reached" : `Ask about weather in ${location}...`}
            className={`
              w-full pl-4 pr-12 py-3
              bg-gray-100 dark:bg-gray-800
              ${radius.full}
              ${typography.bodySmall}
              text-gray-900 dark:text-white
              placeholder-gray-500 dark:placeholder-gray-400
              ${interactive.focus}
              ${isRateLimited || isTyping ? interactive.disabled : ''}
            `}
            disabled={isTyping || isRateLimited}
            aria-label="Chat message input"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <VoiceInput
              onTranscription={handleVoiceTranscription}
              language={language}
              disabled={isTyping || isRateLimited}
            />
          </div>
        </div>
        <Button
          onClick={handleSend}
          className={`${radius.full} px-6`}
          disabled={isTyping || !input.trim() || isRateLimited}
          aria-label="Send message"
        >
          {isTyping ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      {/* Accessibility hint */}
      <p className="sr-only" role="status" aria-live="polite">
        {isTyping ? 'WeatherGPT is responding' : 'Ready to send message'}
      </p>
    </div>
  )
}
