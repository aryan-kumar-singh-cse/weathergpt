"use client"

import { useState, useCallback, useRef, useEffect, useMemo, memo } from "react"
import { Send, Mic, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { askWeatherQuestion } from "@/lib/api"
import { AskResponse } from "@/lib/types"
import { mapErrorMessage, getErrorCategory } from "@/lib/error-messages"
import ReactMarkdown from 'react-markdown'
import rehypeSanitize from 'rehype-sanitize'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  metadata?: {
    severity?: string
    llm_tier?: string | null
    intent?: string
    role?: string
  }
}

interface ChatInterfaceProps {
  location: string
  role: string
  language: string
  email: string
  onAuthError: () => void
}

// Memoized MessageBubble component to prevent unnecessary re-renders
const MessageBubble = memo(({ msg }: { msg: Message }) => {
  // Memoize ReactMarkdown components to prevent recreation on every render
  const markdownComponents = useMemo(() => ({
    p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
    strong: ({ children }: any) => <strong className="font-semibold text-gray-900 dark:text-white">{children}</strong>,
    ul: ({ children }: any) => <ul className="my-2 space-y-1 list-disc list-inside">{children}</ul>,
    ol: ({ children }: any) => <ol className="my-2 space-y-1 list-decimal list-inside">{children}</ol>,
    li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
    h3: ({ children }: any) => <h3 className="font-semibold text-base mb-1 mt-3 first:mt-0">{children}</h3>,
    code: ({ children }: any) => <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-900 rounded text-xs">{children}</code>,
  }), [])

  return (
    <div
      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
      style={{ willChange: 'transform, opacity' }}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-md ${
          msg.role === 'user'
            ? 'bg-yellow-400 text-black'
            : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-yellow-500/20'
        }`}
      >
        {msg.role === 'assistant' ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]} components={markdownComponents}>
              {msg.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm leading-relaxed font-medium">{msg.content}</p>
        )}

        {/* Metadata badges - only for assistant messages */}
        {msg.role === 'assistant' && msg.metadata && (
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200 dark:border-yellow-500/20">
            {msg.metadata.severity && msg.metadata.severity !== 'normal' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-[10px] font-semibold">
                <AlertCircle className="w-3 h-3" />
                {msg.metadata.severity}
              </span>
            )}
            {msg.metadata.llm_tier && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-[10px] font-semibold">
                <Sparkles className="w-3 h-3" />
                {msg.metadata.llm_tier}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for memo
  return prevProps.msg.id === nextProps.msg.id &&
         prevProps.msg.content === nextProps.msg.content &&
         JSON.stringify(prevProps.msg.metadata) === JSON.stringify(nextProps.msg.metadata)
})

MessageBubble.displayName = 'MessageBubble'

export default function ChatInterface({ location, role, language, email, onAuthError }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: `🌤️ Hey! I'm WeatherGPT, your smart weather companion. Ask me anything about weather conditions, forecasts, or climate insights.`
    }
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollRequestRef = useRef<number | null>(null)

  const scrollToBottom = useCallback(() => {
    // Cancel any pending scroll animation
    if (scrollRequestRef.current !== null) {
      cancelAnimationFrame(scrollRequestRef.current)
    }

    // Use requestAnimationFrame for smoother scrolling
    scrollRequestRef.current = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      scrollRequestRef.current = null
    })
  }, [])

  useEffect(() => {
    scrollToBottom()

    // Cleanup on unmount
    return () => {
      if (scrollRequestRef.current !== null) {
        cancelAnimationFrame(scrollRequestRef.current)
      }
    }
  }, [messages, scrollToBottom])

  // Paginate messages - only show last 50 for performance
  const visibleMessages = useMemo(() => {
    return messages.slice(-50)
  }, [messages])

  const handleSend = useCallback(async () => {
    if (!input.trim()) return

    const userMsg = input
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMsg
    }])
    setInput('')
    setIsTyping(true)

    try {
      const result: AskResponse = await askWeatherQuestion(userMsg, email, language, role)

      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
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
      const errorCategory = getErrorCategory(error)
      const userFriendlyMessage = mapErrorMessage(error)

      // Check for authentication errors
      if (errorCategory === 'auth') {
        onAuthError()
        return
      }

      // Check for rate limit errors
      if (errorCategory === 'rate-limit') {
        setMessages(prev => [...prev, {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `⚠️ **Rate Limit Reached**\n\n${userFriendlyMessage}`,
          metadata: {
            severity: 'warning',
            llm_tier: null
          }
        }])
        return
      }

      // All other errors
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `Sorry, I couldn't process that request.\n\n${userFriendlyMessage}`,
        metadata: {
          severity: 'normal',
          llm_tier: null
        }
      }])
    } finally {
      setIsTyping(false)
    }
  }, [input, language, role, email, onAuthError])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Messages Container */}
      <div className="flex-1 space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-yellow-400 dark:scrollbar-thumb-yellow-500 scrollbar-track-transparent">
        {visibleMessages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {/* Typing indicator with fixed height to prevent layout shift */}
        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-200" style={{ willChange: 'opacity' }}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl px-5 py-3 shadow-md border border-gray-200 dark:border-yellow-500/20 min-h-[44px] flex items-center">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-yellow-500/20">
        <div className="flex-1">
          <label htmlFor="weather-question-input" className="sr-only">
            Ask a weather question
          </label>
          <input
            id="weather-question-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Ask about weather...`}
            className="w-full px-5 py-3 bg-gray-50 dark:bg-gray-900 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:text-gray-100 border border-gray-200 dark:border-yellow-500/20 transition-all font-medium placeholder-gray-400"
            disabled={isTyping}
          />
        </div>
        <Button
          onClick={handleSend}
          className="rounded-full px-5 shadow-lg hover:shadow-xl transition-all bg-yellow-400 hover:bg-yellow-500 text-black font-semibold"
          disabled={isTyping || !input.trim()}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
