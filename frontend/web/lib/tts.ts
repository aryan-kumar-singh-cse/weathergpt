"use client";

import { SupportedLanguage, LANGUAGE_OPTIONS } from "./translations";

export const LANGUAGE_LOCALE_MAP: Record<SupportedLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
  ta: "ta-IN",
  te: "te-IN",
  bn: "bn-IN",
  gu: "gu-IN",
  kn: "kn-IN",
  pa: "pa-IN",
  ml: "ml-IN",
};

/**
 * Clean markdown symbols, bullets, URLs, emojis and special characters for natural voice synthesis.
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return "";
  return text
    .replace(/[*#_`~>]/g, "") // Markdown formatting
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Links
    .replace(/https?:\/\/\S+/g, "") // URLs
    .replace(/[|\\/-]{2,}/g, " ") // Table separators
    .replace(/[^\p{L}\p{N}\s.,!?;:°%()\-–—]/gu, "") // Strip weird symbols/emojis while preserving all Unicode regional characters
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Speaks text in the chosen regional Indian language using the browser's Web Speech API.
 */
export function speakText(
  text: string,
  lang: SupportedLanguage = "en",
  onStart?: () => void,
  onEnd?: () => void,
  onError?: () => void
): () => void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    console.warn("[TTS] Web SpeechSynthesis not supported in this browser.");
    onError?.();
    return () => {};
  }

  // Cancel any active speech
  window.speechSynthesis.cancel();

  const clean = cleanTextForSpeech(text);
  if (!clean) {
    onEnd?.();
    return () => {};
  }

  const utterance = new SpeechSynthesisUtterance(clean);
  const targetLocale = LANGUAGE_LOCALE_MAP[lang] || "en-IN";
  utterance.lang = targetLocale;
  utterance.rate = 0.95; // Slightly measured rate for clear pronunciation
  utterance.pitch = 1.0;

  // Find the best voice matching language
  const voices = window.speechSynthesis.getVoices();
  if (voices.length > 0) {
    const matchedVoice =
      voices.find((v) => v.lang.toLowerCase() === targetLocale.toLowerCase()) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase())) ||
      voices.find((v) => v.lang.toLowerCase().includes("in"));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
  }

  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => {
    onEnd?.();
    onError?.();
  };

  window.speechSynthesis.speak(utterance);

  return () => {
    window.speechSynthesis.cancel();
    onEnd?.();
  };
}

/**
 * Stops all ongoing speech synthesis immediately.
 */
export function stopSpeech(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
