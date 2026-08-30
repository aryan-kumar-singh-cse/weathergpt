"use client"

import React, { useState, useCallback, useRef, useEffect, useMemo, memo } from "react"
import { Send, Sparkles, AlertCircle, AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { askWeatherQuestion } from "@/lib/api"
import { AskResponse } from "@/lib/types"
import { useTranslation } from "@/lib/i18n"
import ReactMarkdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"

interface Message {
  id: string
  role: "user" | "assistant"
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

const MessageBubble = memo(({ msg }: { msg: Message }) => {
  const markdownComponents = useMemo(
    () => ({
      p: ({ children }: any) => <p className="mb-2 last:mb-0 leading-relaxed text-sm">{children}</p>,
      strong: ({ children }: any) => <strong className="font-bold text-gray-900 dark:text-white">{children}</strong>,
      ul: ({ children }: any) => <ul className="my-2 space-y-1 list-disc list-inside text-sm">{children}</ul>,
      ol: ({ children }: any) => <ol className="my-2 space-y-1 list-decimal list-inside text-sm">{children}</ol>,
      li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
      h3: ({ children }: any) => <h3 className="font-bold text-sm mb-1 mt-2.5 first:mt-0">{children}</h3>,
      code: ({ children }: any) => <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">{children}</code>,
    }),
    []
  )

  return (
    <div
      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-200`}
    >
      <div
        className={`max-w-[88%] rounded-3xl px-4 py-3 shadow-md ${
          msg.role === "user"
            ? "bg-yellow-400 text-black font-medium"
            : "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-yellow-500/20"
        }`}
      >
        {msg.role === "assistant" ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown rehypePlugins={[rehypeSanitize]} components={markdownComponents}>
              {msg.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{msg.content}</p>
        )}

        {msg.role === "assistant" && msg.metadata && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-gray-100 dark:border-gray-800">
            {msg.metadata.severity && msg.metadata.severity !== "normal" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-[10px] font-bold">
                <AlertCircle className="w-3 h-3" />
                {msg.metadata.severity.toUpperCase()}
              </span>
            )}
            {msg.metadata.llm_tier && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-[10px] font-semibold">
                <Sparkles className="w-3 h-3 text-yellow-600 dark:text-yellow-400" />
                {msg.metadata.llm_tier === "primary" ? "Groq Fast LLM" : "Gemini Fallback"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
})

MessageBubble.displayName = "MessageBubble"

export default function ChatInterface({ location, role, language, email, onAuthError }: ChatInterfaceProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "initial-msg",
      role: "assistant",
      content: `🌤️ **WeatherGPT Active**\nAsk any question about weather conditions, farming advisory, aviation parameters, or emergency forecasts for **${location || "your city"}**.`,
    },
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleSend = useCallback(async () => {
    if (!input.trim() || isTyping) return

    const userMsg = input.trim()
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: userMsg,
      },
    ])
    setInput("")
    setIsTyping(true)
    setRateLimitWarning(null)

    try {
      const result: AskResponse = await askWeatherQuestion(userMsg, email, language, role, location)

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.response,
          metadata: {
            severity: result.severity?.severity,
            llm_tier: result.llm_tier_used,
            intent: result.intent?.intent,
            role: result.role,
          },
        },
      ])
    } catch (error: any) {
      const errorMsg = error?.message || ""

      if (errorMsg.includes("401") || errorMsg.includes("login") || errorMsg.includes("User not found")) {
        onAuthError()
        return
      }

      if (errorMsg.includes("429") || errorMsg.includes("limit")) {
        setRateLimitWarning(t("rate_limit_alert"))
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: `⚠️ **${t("rate_limit_alert")}**`,
            metadata: { severity: "warning" },
          },
        ])
        return
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `⚠️ **Error**: Could not complete weather query. Please try again.`,
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }, [input, isTyping, email, language, role, location, onAuthError, t])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[520px] bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-3xl p-4 border border-gray-200 dark:border-yellow-500/20 shadow-xl space-y-3">
      {/* Rate Limit Banner if Triggered */}
      {rateLimitWarning && (
        <div className="flex items-center gap-2 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-500/30 rounded-2xl text-xs text-yellow-800 dark:text-yellow-200">
          <AlertTriangle className="w-4 h-4 shrink-0 text-yellow-600 dark:text-yellow-400" />
          <span>{rateLimitWarning}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-yellow-400">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-900 rounded-2xl px-4 py-3 shadow-md border border-gray-200 dark:border-yellow-500/20 flex items-center gap-1.5">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 bg-yellow-600 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("ask_placeholder")}
          disabled={isTyping}
          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 font-medium placeholder-gray-400"
        />
        <Button
          type="button"
          onClick={handleSend}
          disabled={isTyping || !input.trim()}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 rounded-2xl shadow-md transition-all shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
