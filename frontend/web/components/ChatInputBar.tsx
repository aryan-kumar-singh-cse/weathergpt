"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  MessageSquare,
  X,
  Mic,
  Loader2,
  Sparkles,
  User,
  ChevronDown,
  Trash2,
  CornerDownLeft,
  Bot,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  role?: string;
};

type Props = {
  onSend: (message: string) => void;
  isLoading?: boolean;
  latestResponse?: string;
  role?: string;
  city?: string;
};

const SUGGESTED_PROMPTS = [
  "Will it rain tomorrow?",
  "What should I plan this week considering the weather?",
  "Farming advisory and irrigation timing",
  "Aviation visibility and wind conditions",
];

export default function ChatInputBar({
  onSend,
  isLoading = false,
  latestResponse,
  role = "General Public",
  city = "Delhi",
}: Props) {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Sync latest response into conversation history and auto-expand chat
  useEffect(() => {
    if (latestResponse) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.sender === "assistant" && last.text === latestResponse) {
          return prev;
        }
        return [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "assistant",
            text: latestResponse,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            role,
          },
        ];
      });
      setIsExpanded(true);
    }
  }, [latestResponse, role]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (isExpanded && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded, isLoading]);

  const handleSubmit = (textToSend?: string) => {
    const query = (textToSend || value).trim();
    if (!query || isLoading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        sender: "user",
        text: query,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    setIsExpanded(true);
    onSend(query);
    setValue("");
  };

  // Speech-to-Text Voice Recognition
  const handleVoiceInput = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;

      setIsListening(true);
      recognition.start();

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript.trim()) {
          handleSubmit(transcript.trim());
        }
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
    } catch {
      setIsListening(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => {
            setIsOpen(true);
            setIsExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          aria-label="Open chat"
          className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-2xl
                     border border-white/25 flex items-center justify-center
                     text-white/90 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-2xl cursor-pointer"
        >
          <MessageSquare className="w-5 h-5 text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Floating Chat History Modal / Drawer (Upward Expansion) */}
      {isExpanded && (
        <div
          className="w-full max-h-[380px] md:max-h-[460px] flex flex-col rounded-3xl
                     bg-gray-950/85 backdrop-blur-2xl border border-white/20
                     shadow-2xl animate-fade-in overflow-hidden transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono tracking-tight text-white">
                  WeatherGPT Intelligence
                </h3>
                <p className="text-[10px] text-white/50 font-mono">
                  Grounding: {city} • Mode: {role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  title="Clear conversation history"
                  className="p-1.5 rounded-lg text-white/40 hover:text-white/80 hover:bg-white/10 transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsExpanded(false)}
                title="Minimize chat"
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 text-xs md:text-sm scrollbar-thin scrollbar-thumb-white/20"
          >
            {messages.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-white/10 flex items-center justify-center text-white">
                  <Bot className="w-5 h-5 text-white/90" />
                </div>
                <p className="text-xs text-white/70 font-mono">
                  Ask any meteorological, planning, or agricultural query for{" "}
                  <span className="text-white font-bold">{city}</span>.
                </p>

                {/* Suggested Prompt Chips */}
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmit(prompt)}
                      className="text-[11px] font-mono px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/80 hover:bg-white/20 hover:text-white transition cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.sender === "assistant" && (
                    <div className="w-7 h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 md:p-4 text-white shadow-md ${
                      msg.sender === "user"
                        ? "bg-white/20 border border-white/30 text-white rounded-br-none ml-auto"
                        : "bg-white/10 border border-white/15 rounded-bl-none"
                    }`}
                  >
                    {msg.sender === "assistant" ? (
                      <div className="prose prose-invert prose-xs md:prose-sm max-w-none leading-relaxed space-y-2">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="font-mono text-xs md:text-sm font-medium">{msg.text}</p>
                    )}
                    <span className="block text-[9px] text-white/40 font-mono mt-2 text-right">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.sender === "user" && (
                    <div className="w-7 h-7 rounded-full bg-white/15 border border-white/25 flex items-center justify-center text-white/80 shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Typing / Processing Indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-7 h-7 rounded-full bg-white/15 border border-white/20 flex items-center justify-center text-white shrink-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-bl-none p-3 bg-white/10 border border-white/15 text-white/70 font-mono text-xs flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>Synthesizing live meteorological intelligence for {city}...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Pill Chat Input Bar */}
      <div
        className="flex items-center gap-3 rounded-full
                   bg-gray-950/70 backdrop-blur-2xl border border-white/20
                   px-5 py-3 md:py-3.5 shadow-2xl w-full transition-all focus-within:border-white/40 focus-within:bg-gray-950/85"
      >
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={handleVoiceInput}
          disabled={isListening || isLoading}
          title="Voice prompt (speech to text)"
          className={`p-2 rounded-full transition-all cursor-pointer ${
            isListening
              ? "bg-red-500/30 text-red-300 animate-pulse"
              : "text-white/60 hover:text-white hover:bg-white/10"
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Text Input */}
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          placeholder={
            isListening
              ? "Listening to your voice..."
              : `Ask WeatherGPT (e.g. 'Will it rain tomorrow in ${city}?')...`
          }
          className="flex-1 bg-transparent text-white placeholder-white/45
                     outline-none font-sans text-xs md:text-sm"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!value.trim() || isLoading}
          aria-label="Send query"
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:hover:bg-white/20 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <CornerDownLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          )}
        </button>

        {/* Collapse Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Hide chat bar"
          className="text-white/40 hover:text-white transition text-xs p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
