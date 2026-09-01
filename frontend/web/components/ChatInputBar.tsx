"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Volume2,
  VolumeX,
  Copy,
  Check,
  Zap,
  CloudRain,
  Wind,
  Calendar,
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
  onSend: (message: string, history?: ChatMessage[]) => Promise<string | undefined> | any;
  isLoading?: boolean;
  latestResponse?: string;
  latestResponseCity?: string;
  role?: string;
  currentDashboardCity?: string;
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  onSwitchDashboardCity?: (city: string) => void;
};

function getRoleBasedPrompts(role: string): string[] {
  const r = (role || "").toLowerCase();
  if (r.includes("farmer")) {
    return [
      "Next 5 days rainfall & soil moisture",
      "Is it safe to spray pesticides tomorrow?",
      "Irrigation scheduling & dry spell forecast",
      "Temperature risk for sowing crops",
    ];
  }
  if (r.includes("pilot")) {
    return [
      "Wind shear, turbulence & cloud ceiling",
      "Aviation visibility & crosswind runway status",
      "Thunderstorm & icing alert along flight paths",
      "METAR & pressure altimeter briefing",
    ];
  }
  if (r.includes("disaster")) {
    return [
      "Flash flood & inundation risk analysis",
      "Cyclone path, wind speed & surge alert",
      "Heavy rainfall danger zones",
      "Emergency evacuation advisory",
    ];
  }
  return [
    "Will it rain in the next 3 hours?",
    "Hourly temperature & humidity trend",
    "Should I carry an umbrella today?",
    "Compare weather with London",
  ];
}

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
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

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

  // Text-To-Speech (TTS) Voice Reader
  const toggleSpeech = useCallback((msgId: string, text: string) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMessageId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for cleaner speech
    const cleanText = text.replace(/[*#_`>]/g, "").replace(/\[.*?\]\(.*?\)/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(msgId);
    window.speechSynthesis.speak(utterance);
  }, [speakingMessageId]);

  // Copy message to clipboard
  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSubmit = async (textToSend?: string) => {
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
    setValue("");

    try {
      const responseText = await onSend(query, newMessages);
      if (responseText) {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.sender === "assistant" && last.text === responseText) {
            return prev;
          }
          return [
            ...prev,
            {
              id: crypto.randomUUID(),
              sender: "assistant",
              text: responseText,
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              role,
              city: latestResponseCity || currentDashboardCity,
            },
          ];
        });
      }
    } catch {}
  };

  const handleClearChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.speechSynthesis?.cancel();
    setSpeakingMessageId(null);
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

  const dynamicPrompts = getRoleBasedPrompts(role);

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
          className="w-full max-h-[410px] md:max-h-[500px] flex flex-col rounded-3xl
                     bg-black/95 backdrop-blur-3xl border border-yellow-400/35
                     shadow-2xl shadow-black/95 animate-fade-in overflow-hidden transition-all duration-300"
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
                  District & City Aware • Main: <span className="text-yellow-400 font-semibold">{currentDashboardCity}</span> • Role: {role}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  window.speechSynthesis?.cancel();
                  setSpeakingMessageId(null);
                  setExpanded(false);
                }}
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
                <p className="text-xs text-gray-300 font-mono max-w-md mx-auto">
                  Ask any question about districts, cities, rain timings, crop advisory, flight conditions, or alerts.
                  Follow-ups remember previous context automatically.
                </p>

                {/* Role-tailored Suggested Prompt Chips */}
                <div className="flex flex-wrap justify-center gap-2 pt-2 max-w-xl mx-auto">
                  {dynamicPrompts.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmit(prompt)}
                      className="text-[11px] font-mono px-3 py-1.5 rounded-full bg-black/60 border border-yellow-400/35 text-yellow-300 hover:bg-yellow-400/20 hover:text-yellow-200 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Zap className="w-3 h-3 text-yellow-400 shrink-0" />
                      <span>{prompt}</span>
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
                    className={`max-w-[88%] rounded-2xl p-3.5 md:p-4 text-white shadow-md ${
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

                    {/* Bot Message Toolbar: Read Aloud, Copy, Action Chips */}
                    {msg.sender === "assistant" && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* TTS Audio Speak Button */}
                          <button
                            onClick={() => toggleSpeech(msg.id, msg.text)}
                            title={speakingMessageId === msg.id ? "Stop voice audio" : "Listen to weather audio"}
                            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[10px] font-mono ${
                              speakingMessageId === msg.id
                                ? "bg-yellow-400 text-gray-950 border-yellow-400 font-bold"
                                : "bg-black/40 border-white/10 text-gray-300 hover:text-yellow-400 hover:border-yellow-400/40"
                            }`}
                          >
                            {speakingMessageId === msg.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5" />
                                <span>Stop</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
                                <span>Listen</span>
                              </>
                            )}
                          </button>

                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopy(msg.id, msg.text)}
                            title="Copy response"
                            className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-gray-300 hover:text-yellow-400 hover:border-yellow-400/40 transition cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-green-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Action chip if response discusses another location */}
                        {msg.city &&
                          msg.city.toLowerCase() !== currentDashboardCity.toLowerCase() &&
                          onSwitchDashboardCity && (
                            <button
                              onClick={() => onSwitchDashboardCity(msg.city!)}
                              className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-yellow-400/15 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 flex items-center gap-1 transition cursor-pointer"
                            >
                              <MapPin className="w-3 h-3 text-yellow-400" />
                              <span>Show {msg.city} on Dashboard</span>
                            </button>
                          )}
                      </div>
                    )}

                    <span className="block text-[9px] text-gray-500 font-mono mt-1.5 text-right">
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
                  <span>Synthesizing live meteorological analysis...</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Context Action Pills Bar at bottom of drawer */}
          {messages.length > 0 && !isLoading && (
            <div className="px-4 py-2 border-t border-white/10 bg-black/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              <span className="text-[10px] font-mono text-gray-400 shrink-0">Quick follow-up:</span>
              <button
                onClick={() => handleSubmit("Will it rain in the next few hours?")}
                className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-gray-900 border border-white/10 hover:border-yellow-400/40 text-gray-200 hover:text-yellow-300 transition shrink-0 flex items-center gap-1"
              >
                <CloudRain className="w-3 h-3 text-cyan-400" />
                <span>Rain Forecast</span>
              </button>
              <button
                onClick={() => handleSubmit("What about the wind speed and direction?")}
                className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-gray-900 border border-white/10 hover:border-yellow-400/40 text-gray-200 hover:text-yellow-300 transition shrink-0 flex items-center gap-1"
              >
                <Wind className="w-3 h-3 text-yellow-400" />
                <span>Wind Details</span>
              </button>
              <button
                onClick={() => handleSubmit("Give me a 7-day weather trend summary")}
                className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-gray-900 border border-white/10 hover:border-yellow-400/40 text-gray-200 hover:text-yellow-300 transition shrink-0 flex items-center gap-1"
              >
                <Calendar className="w-3 h-3 text-emerald-400" />
                <span>7-Day Trend</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Pill Chat Input Bar */}
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
              : `Ask anything (e.g. 'Weather in Wayanad district', 'Will it rain tomorrow?')...`
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
          onClick={() => {
            window.speechSynthesis?.cancel();
            setSpeakingMessageId(null);
            setIsOpen(false);
          }}
          aria-label="Hide chat bar"
          className="text-gray-500 hover:text-white transition text-xs p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
