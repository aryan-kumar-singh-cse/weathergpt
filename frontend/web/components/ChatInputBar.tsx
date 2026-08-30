"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, X, Mic, Loader2, Sparkles } from "lucide-react";

type Props = {
  onSend: (message: string) => void;
  isLoading?: boolean;
  latestResponse?: string;
  role?: string;
};

export default function ChatInputBar({
  onSend,
  isLoading = false,
  latestResponse,
  role = "General Public",
}: Props) {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-open response card when a new AI response arrives
  useEffect(() => {
    if (latestResponse) {
      setShowResponseModal(true);
    }
  }, [latestResponse]);

  const handleSubmit = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
  };

  // Browser Speech-to-Text Support
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
        setValue(transcript);
        setIsListening(false);
        if (transcript.trim()) {
          onSend(transcript.trim());
          setValue("");
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
    } catch (e) {
      setIsListening(false);
    }
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center gap-2">
        {latestResponse && (
          <button
            onClick={() => setShowResponseModal(true)}
            className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-xs font-mono text-white/90 shadow-xl hover:bg-white/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
            <span>View AI Response</span>
          </button>
        )}
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          aria-label="Open chat"
          className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-xl
                     border border-white/20 flex items-center justify-center
                     text-white/80 hover:text-white hover:scale-105 active:scale-95 transition-all shadow-2xl cursor-pointer"
        >
          <MessageSquare className="w-5 h-5 text-yellow-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center gap-3">
      {/* Expanded AI Response Bubble (if visible) */}
      {showResponseModal && latestResponse && (
        <div
          className="w-full max-h-48 md:max-h-60 overflow-y-auto rounded-2xl
                     bg-white/10 backdrop-blur-xl border border-white/20
                     p-4 md:p-5 text-white font-sans text-xs md:text-sm
                     shadow-2xl animate-fade-in relative scrollbar-thin scrollbar-thumb-white/20"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-2 text-yellow-400 text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>WeatherGPT Intelligence • {role}</span>
            </div>
            <button
              onClick={() => setShowResponseModal(false)}
              className="text-white/50 hover:text-white text-xs cursor-pointer p-1"
            >
              ✕
            </button>
          </div>

          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
            {latestResponse}
          </div>
        </div>
      )}

      {/* Main Floating Pill Input Bar */}
      <div
        className="flex items-center gap-3 rounded-full
                   bg-white/10 backdrop-blur-xl border border-white/20
                   px-5 py-3 md:py-3.5 shadow-2xl w-full transition-all focus-within:border-white/40 focus-within:bg-white/[0.14]"
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
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder={
            isListening
              ? "Listening to voice..."
              : `Ask WeatherGPT (e.g., 'Will it rain this weekend in Mumbai?')...`
          }
          className="flex-1 bg-transparent text-white placeholder-white/45
                     outline-none font-sans text-xs md:text-sm"
        />

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!value.trim() || isLoading}
          aria-label="Send query"
          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-40 disabled:hover:bg-white/20 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Collapse Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Collapse chat input"
          className="text-white/40 hover:text-white transition text-xs p-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
