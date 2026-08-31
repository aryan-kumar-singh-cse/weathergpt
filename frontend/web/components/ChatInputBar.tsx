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
  ChevronUp,
  MapPin,
} from "lucide-react";
import ReactMarkdown from "react-markdown";

export type ChatMessage = {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  role?: string;
  city?: string;
};

type Props = {
  onSend: (message: string, history?: ChatMessage[]) => void;
  isLoading?: boolean;
  latestResponse?: string;
  latestResponseCity?: string;
  role?: string;
  currentDashboardCity?: string;
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  onSwitchDashboardCity?: (city: string) => void;
};

const SUGGESTED_PROMPTS = [
  "Will it rain tomorrow?",
  "How about next weekend?",
  "Farming advisory and irrigation timing",
  "Compare current weather with London",
];

export default function ChatInputBar({
  onSend,
  isLoading = false,
  latestResponse,
  latestResponseCity,
  role = "General Public",
  currentDashboardCity = "Delhi",
  isExpanded: controlledExpanded,
  onToggleExpanded,
  onSwitchDashboardCity,
}: Props) {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Controlled or internal expansion state
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const setExpanded = (exp: boolean) => {
    if (onToggleExpanded) {
      onToggleExpanded(exp);
    } else {
      setInternalExpanded(exp);
    }
  };

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
            city: latestResponseCity,
          },
        ];
      });
      setExpanded(true);
    }
  }, [latestResponse, latestResponseCity, role]);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (isExpanded && chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isExpanded, isLoading]);

  const handleSubmit = (textToSend?: string) => {
    const query = (textToSend || value).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setExpanded(true);
    onSend(query, newMessages);
    setValue("");
  };

  // Clear chat cleanly without breaking state
  const handleClearChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMessages([]);
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
            setExpanded(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          aria-label="Open chat"
          className="w-12 h-12 rounded-full bg-black/80 backdrop-blur-2xl
                     border border-yellow-400/40 flex items-center justify-center
                     text-yellow-400 hover:text-yellow-300 hover:scale-105 active:scale-95 transition-all shadow-2xl cursor-pointer"
        >
          <MessageSquare className="w-5 h-5 text-yellow-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Floating Chat History Modal / Drawer (Upward Expansion) */}
      {isExpanded && (
        <div
          className="w-full max-h-[390px] md:max-h-[470px] flex flex-col rounded-3xl
                     bg-black/90 backdrop-blur-2xl border border-yellow-400/30
                     shadow-2xl shadow-black/90 animate-fade-in overflow-hidden transition-all duration-300"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-yellow-400/20 bg-yellow-400/[0.04]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shadow-sm">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
                  <span>WeatherGPT Conversational Intelligence</span>
                </h3>
                <p className="text-[10px] text-gray-400 font-mono">
                  Context Aware • Main Dashboard: <span className="text-yellow-400 font-semibold">{currentDashboardCity}</span> • Role: {role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title="Clear chat conversation"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setExpanded(false)}
                title="Minimize chat drawer"
                className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Scroll Area */}
          <div
            ref={chatScrollRef}
            className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 text-xs md:text-sm scrollbar-thin scrollbar-thumb-yellow-400/30"
          >
            {messages.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full bg-yellow-400/15 border border-yellow-400/30 flex items-center justify-center text-yellow-400">
                  <Bot className="w-5 h-5" />
                </div>
                <p className="text-xs text-gray-300 font-mono">
                  Ask any weather, agricultural, flight, or planning question.
                  Multi-turn follow-ups (e.g. &quot;How about tomorrow?&quot;, &quot;What about rain then?&quot;) are supported!
                </p>

                {/* Suggested Prompt Chips */}
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {SUGGESTED_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmit(prompt)}
                      className="text-[11px] font-mono px-3 py-1.5 rounded-full bg-black/50 border border-yellow-400/30 text-yellow-400/90 hover:bg-yellow-400/15 hover:text-yellow-300 transition cursor-pointer"
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
                    <div className="w-7 h-7 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 md:p-4 text-white shadow-md ${
                      msg.sender === "user"
                        ? "bg-yellow-400/20 border border-yellow-400/40 text-yellow-50 rounded-br-none ml-auto"
                        : "bg-gray-950/90 border border-white/15 rounded-bl-none"
                    }`}
                  >
                    {msg.sender === "assistant" ? (
                      <div className="prose prose-invert prose-xs md:prose-sm max-w-none leading-relaxed space-y-2 text-gray-200">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="font-mono text-xs md:text-sm font-medium text-white">{msg.text}</p>
                    )}

                    {/* Action button if response discusses another city */}
                    {msg.sender === "assistant" &&
                      msg.city &&
                      msg.city.toLowerCase() !== currentDashboardCity.toLowerCase() &&
                      onSwitchDashboardCity && (
                        <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                          <span className="text-[10px] text-gray-400 font-mono">Location discussed: {msg.city}</span>
                          <button
                            onClick={() => onSwitchDashboardCity(msg.city!)}
                            className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-yellow-400/15 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 flex items-center gap-1 transition cursor-pointer"
                          >
                            <MapPin className="w-3 h-3 text-yellow-400" />
                            <span>Show on Dashboard</span>
                          </button>
                        </div>
                      )}

                    <span className="block text-[9px] text-gray-400 font-mono mt-2 text-right">
                      {msg.timestamp}
                    </span>
                  </div>

                  {msg.sender === "user" && (
                    <div className="w-7 h-7 rounded-full bg-yellow-400/30 border border-yellow-400/50 flex items-center justify-center text-yellow-300 shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              ))
            )}

            {/* Typing / Processing Indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start items-center">
                <div className="w-7 h-7 rounded-full bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shrink-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="rounded-2xl rounded-bl-none p-3 bg-gray-950/80 border border-yellow-400/30 text-yellow-400 font-mono text-xs flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                  <span>Synthesizing live meteorological response...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Pill Chat Input Bar with Manual Chat Trigger */}
      <div
        className="flex items-center gap-2.5 rounded-full
                   bg-black/85 backdrop-blur-2xl border border-yellow-400/30
                   px-4 md:px-5 py-2.5 md:py-3 shadow-2xl shadow-black/80 w-full transition-all focus-within:border-yellow-400/60 focus-within:bg-black/95"
      >
        {/* Manual Chat Drawer Toggle Button */}
        <button
          type="button"
          onClick={() => setExpanded(!isExpanded)}
          title={isExpanded ? "Collapse chat" : "Open chat conversation"}
          className={`p-2 rounded-full transition-all cursor-pointer flex items-center justify-center ${
            isExpanded
              ? "bg-yellow-400/20 text-yellow-300 border border-yellow-400/40"
              : "text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
        </button>

        {/* Voice Input Button */}
        <button
          type="button"
          onClick={handleVoiceInput}
          disabled={isListening || isLoading}
          title="Voice prompt (speech to text)"
          className={`p-2 rounded-full transition-all cursor-pointer ${
            isListening
              ? "bg-red-500/30 text-red-300 animate-pulse"
              : "text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10"
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
              : `Ask WeatherGPT (e.g. 'How is the weather in Tokyo?', 'Will it rain tomorrow?')...`
          }
          className="flex-1 bg-transparent text-white placeholder-gray-500
                     outline-none font-sans text-xs md:text-sm"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={() => handleSubmit()}
          disabled={!value.trim() || isLoading}
          aria-label="Send query"
          className="w-9 h-9 rounded-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 disabled:hover:bg-yellow-400 text-gray-950 font-bold flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0 shadow-md shadow-yellow-400/20"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-950" />
          ) : (
            <CornerDownLeft className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>

        {/* Collapse Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Hide chat bar"
          className="text-gray-500 hover:text-white transition text-xs p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
