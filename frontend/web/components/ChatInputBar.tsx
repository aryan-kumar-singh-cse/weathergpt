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
import { SupportedLanguage, TRANSLATIONS, translateRole } from "@/lib/translations";
import { speakText, stopSpeech, LANGUAGE_LOCALE_MAP } from "@/lib/tts";

export function stripInternalThinking(text: string): string {
  if (!text) return "";
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/\[think(?:ing)?\][\s\S]*?\[\/think(?:ing)?\]/gi, "")
    .replace(/\[think(?:ing)?\][\s\S]*$/gi, "")
    .replace(/^Thinking Process:[\s\S]*?(?=\n\n|\n[#A-Z])/gi, "")
    .trim();
}

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
  lang?: SupportedLanguage;
};

function getRoleBasedPrompts(role: string, lang: SupportedLanguage = "en"): string[] {
  const r = (role || "").toLowerCase();

  const prompts: Record<string, Record<string, string[]>> = {
    farmer: {
      en: [
        "Next 5 days rainfall & soil moisture",
        "Is it safe to spray pesticides tomorrow?",
        "Irrigation scheduling & dry spell forecast",
        "Temperature risk for sowing crops",
      ],
      hi: [
        "अगले 5 दिनों की वर्षा और मिट्टी में नमी",
        "क्या कल कीटनाशक का छिड़काव करना सुरक्षित है?",
        "सिंचाई का समय और सूखे का पूर्वानुमान",
        "फसल बुवाई के लिए तापमान जोखिम",
      ],
      mr: [
        "पुढील ५ दिवसांचा पाऊस व जमिनीतील ओलावा",
        "उद्या कीटकनाशक फवारणी करणे सुरक्षित आहे का?",
        "पाणी देण्याचे नियोजन व पावसाचा अंदाज",
        "पेरणीसाठी योग्य तापमान सल्ला",
      ],
      ta: [
        "அடுத்த 5 நாட்கள் மழை மற்றும் மண் ஈரப்பதம்",
        "நாளை பூச்சிக்கொல்லி தெளிப்பது பாதுகாப்பானதா?",
        "பாசன அட்டவணை மற்றும் உலர் கால முன்னறிவிப்பு",
        "விதைப்புக்கான வெப்பநிலை ஆபத்து",
      ],
      te: [
        "రాబోయే 5 రోజుల వర్షపాతం & నేల తేమ",
        "రేపు పురుగుమందులు పిచಿಕారీ చేయడం సురక్షితమేనా?",
        "నీటి పారుదల ప్రణాళిక & వర్ష సూచన",
        "విత్తనాలు నాటడానికి ఉష్ణోగ్రత ప్రమాదం",
      ],
      bn: [
        "আগামী ৫ দিনের বৃষ্টিপাত ও মাটির আর্দ্রতা",
        "কাল কি কীটনাশক স্প্রে করা নিরাপদ?",
        "সেচের সময়সূচী ও খরা পূর্বাভাস",
        "বীজ বোনার জন্য তাপমাত্রার ঝুঁকি",
      ],
      gu: [
        "આગામી ૫ દિવસનો વરસાદ અને જમીનનો ભેજ",
        "શું કાલે જંતુનાશક દવા છાંટવી સુરક્ષિત છે?",
        "પિયતનું આયોજન અને વરસાદની આગાહી",
        "વાવણી માટે તાપમાનનું જોખમ",
      ],
      kn: [
        "ಮುಂದಿನ ೫ ದಿನಗಳ ಮಳೆ ಮತ್ತು ಮಣ್ಣಿನ ತೇವಾಂಶ",
        "ನಾಳೆ ಕೀಟನಾಶಕ ಸಿಂಪಡಿಸುವುದು ಸುರಕ್ಷಿತವೇ?",
        "ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿ ಮತ್ತು ಮಳೆ ಮುನ್ಸೂಚನೆ",
        "ಬಿತ್ತನೆಗೆ ತಾಪಮಾನದ ಅಪಾಯ",
      ],
      pa: [
        "ਅਗਲੇ ੫ ਦਿਨਾਂ ਦੀ ਬਾਰਸ਼ ਅਤੇ ਜ਼ਮੀਨ ਦੀ ਨਮੀ",
        "ਕੀ ਕੱਲ੍ਹ ਕੀਟਨਾਸ਼ਕ ਸਪਰੇਅ ਕਰਨਾ ਸੁਰੱਖਿਅਤ ਹੈ?",
        "ਸਿੰਚਾਈ ਦਾ ਸਮਾਂ ਅਤੇ ਮੌਸਮ ਦਾ ਅਨੁਮਾਨ",
        "ਬਿਜਾਈ ਲਈ ਤਾਪਮਾਨ ਦਾ ਖ਼ਤਰਾ",
      ],
      ml: [
        "അടുത്ത 5 ദിവസത്തെ മഴയും മണ്ണിന്റെ ഈർപ്പവും",
        "നാളെ കീടനാശിനി തളിക്കുന്നത് സുരക്ഷിതമാണോ?",
        "നനയ്ക്കൽ സമയക്രമവും വരൾച്ചാ പ്രവചനവും",
        "വിത്ത് വിതയ്ക്കുന്നതിനുള്ള താപനില അപകടസാധ്യത",
      ],
    },
    pilot: {
      en: [
        "Wind shear, turbulence & cloud ceiling",
        "Aviation visibility & crosswind runway status",
        "Thunderstorm & icing alert along flight paths",
        "METAR & pressure altimeter briefing",
      ],
      hi: [
        "हवा का बहाव, टर्बुलेंस और बादलों की ऊंचाई",
        "विमानन दृश्यता और रनवे क्रॉसविंड स्थिति",
        "उड़ान मार्ग पर आंधी व बर्फबारी चेतावनी",
        "METAR व बैरोमीटर दबाव ब्रीफिंग",
      ],
    },
    disaster: {
      en: [
        "Flash flood & inundation risk analysis",
        "Cyclone path, wind speed & surge alert",
        "Heavy rainfall danger zones",
        "Emergency evacuation advisory",
      ],
      hi: [
        "अचानक बाढ़ और जलभराव का जोखिम विश्लेषण",
        "चक्रवात मार्ग, हवा की गति व तूफानी लहरें",
        "अतिवृष्टि के खतरे वाले संवेदनशील क्षेत्र",
        "आपातकालीन निकासी और सुरक्षा निर्देश",
      ],
    },
    default: {
      en: [
        "Will it rain in the next 3 hours?",
        "Hourly temperature & humidity trend",
        "Should I carry an umbrella today?",
        "What should I wear for this weather?",
      ],
      hi: [
        "क्या अगले 3 घंटों में बारिश होगी?",
        "प्रति घंटे तापमान और नमी का रुझान",
        "क्या आज मुझे छाता साथ रखना चाहिए?",
        "आज के मौसम के अनुसार क्या पहनना चाहिए?",
      ],
      mr: [
        "पुढील ३ तासांत पाऊस पडेल का?",
        "तासनिहाय तापमान व आर्द्रतेचा कल",
        "आज छत्री सोबत ठेवावी का?",
        "आजच्या हवामानानुसार काय कपडे घालावेत?",
      ],
      ta: [
        "அடுத்த 3 மணி நேரத்தில் மழை பெய்யுமா?",
        "மணிநேர வெப்பநிலை மற்றும் ஈரப்பதம்",
        "இன்று நான் குடை எடுத்துச் செல்ல வேண்டுமா?",
        "இந்த வானிலைக்கு என்ன உடை அணிய வேண்டும்?",
      ],
      te: [
        "రాబోయే 3 గంటల్లో వర్షం పడుతుందా?",
        "గంటల వారీగా ఉష్ణోగ్రత మరియు తేమ",
        "ఈరోజు నేను గొడుగు తీసుకెళ్లాలా?",
        "ఈ వాతావరణానికి ఎలాంటి దుస్తులు ధరించాలి?",
      ],
      bn: [
        "আগামী ৩ ঘণ্টায় কি বৃষ্টি হবে?",
        "ঘণ্টাভিত্তিক তাপমাত্রা ও আর্দ্রতা",
        "আজ কি ছাতা সাথে রাখা উচিত?",
        "এই আবহাওয়ায় কী ধরনের পোশাক পরা উচিত?",
      ],
      gu: [
        "શું આગામી ૩ કલાકમાં વરસાદ પડશે?",
        "કલાક મુજબ તાપમાન અને ભેજ",
        "શું આજે છત્રી સાથે રાખવી જોઈએ?",
        "આજના હવામાન માટે શું પહેરવું?",
      ],
      kn: [
        "ಮುಂದಿನ ೩ ಗಂಟೆಗಳಲ್ಲಿ ಮಳೆಯಾಗುವುದೇ?",
        "ಗಂಟೆಯವಾರು ತಾಪಮಾನ ಮತ್ತು ತೇವಾಂಶ",
        "ಇಂದು ನಾನು ಛತ್ರಿ ತೆಗೆದುಕೊಂಡು ಹೋಗಬೇಕೆ?",
        "ಈ ಹವಾಮಾನಕ್ಕೆ ಯಾವ ಬಟ್ಟೆ ಧರಿಸಬೇಕು?",
      ],
      pa: [
        "ਕੀ ਅਗਲੇ ੩ ਘੰਟਿਆਂ ਵਿੱਚ ਮੀਂਹ ਪਵੇਗਾ?",
        "ਘੰਟੇਵਾਰ ਤਾਪਮਾਨ ਅਤੇ ਨਮੀ ਦਾ ਰੁਝਾਨ",
        "ਕੀ ਅੱਜ ਛੱਤਰੀ ਨਾਲ ਰੱਖਣੀ ਚਾਹੀਦੀ ਹੈ?",
        "ਅੱਜ ਦੇ ਮੌਸਮ ਅਨੁਸਾਰ ਕੀ ਪਹਿਨਣਾ ਚਾਹੀਦਾ ਹੈ?",
      ],
      ml: [
        "അടുത്ത 3 മണിക്കൂറിനുള്ളിൽ മഴ പെയ്യുമോ?",
        "മണിക്കൂർ തോറുമുള്ള താപനില പ്രവണത",
        "ഇന്ന് ഞാൻ കുട കരുതേണ്ടതുണ്ടോ?",
        "ഈ കാലാവസ്ഥയ്ക്ക് എന്ത് വസ്ത്രം ധരിക്കണം?",
      ],
    },
  };

  const category = r.includes("farmer") ? "farmer" : r.includes("pilot") ? "pilot" : r.includes("disaster") ? "disaster" : "default";
  const catPrompts = prompts[category] || prompts.default;
  return catPrompts[lang] || catPrompts.en || prompts.default.en;
}

export default function ChatInputBar({
  onSend,
  isLoading = false,
  latestResponse,
  latestResponseCity,
  role = "Citizen",
  currentDashboardCity = "Ghaziabad",
  isExpanded = false,
  onToggleExpanded,
  onSwitchDashboardCity,
  lang = "en",
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [expanded, setExpanded] = useState(isExpanded);
  const [value, setValue] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const stopSpeechRef = useRef<(() => void) | null>(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const translatedRole = translateRole(role, lang);

  // Sync external expansion trigger
  useEffect(() => {
    setExpanded(isExpanded);
  }, [isExpanded]);

  const setDrawerExpanded = (val: boolean) => {
    setExpanded(val);
    if (onToggleExpanded) onToggleExpanded(val);
  };

  // Sync latestResponse into chat stream
  useEffect(() => {
    if (!latestResponse) return;
    const cleanResponse = stripInternalThinking(latestResponse);
    if (!cleanResponse) return;

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last && last.sender === "assistant" && last.text === cleanResponse) {
        return prev;
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "assistant",
          text: cleanResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          role,
          city: latestResponseCity || currentDashboardCity,
        },
      ];
    });
  }, [latestResponse, latestResponseCity, role, currentDashboardCity]);

  // Auto-scroll chat history to bottom
  useEffect(() => {
    if (expanded && chatScrollRef.current) {
      const scrollEl = chatScrollRef.current;
      const scrollTimer = setTimeout(() => {
        if (scrollEl) {
          scrollEl.scrollTo({
            top: scrollEl.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 50);
      return () => clearTimeout(scrollTimer);
    }
  }, [messages, expanded, isLoading]);

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Text-To-Speech (TTS) Voice Reader with Native Regional Language
  const toggleSpeech = useCallback(
    (msgId: string, text: string) => {
      if (speakingMessageId === msgId) {
        stopSpeech();
        setSpeakingMessageId(null);
        return;
      }

      stopSpeech();
      setSpeakingMessageId(msgId);

      const cancelFn = speakText(
        text,
        lang,
        () => setSpeakingMessageId(msgId),
        () => setSpeakingMessageId(null),
        () => setSpeakingMessageId(null)
      );

      stopSpeechRef.current = cancelFn;
    },
    [speakingMessageId, lang]
  );

  // Copy message to clipboard
  const handleCopy = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const isSubmittingRef = useRef(false);

  const handleSubmit = async (textToSend?: string) => {
    const query = (textToSend || value).trim();
    if (!query || isLoading || isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setDrawerExpanded(true);
    setValue("");

    try {
      const rawResponse = await onSend(query, newMessages);
      const responseText = stripInternalThinking(rawResponse || "");
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
    } catch {} finally {
      isSubmittingRef.current = false;
    }
  };

  const handleClearChat = (e: React.MouseEvent) => {
    e.stopPropagation();
    stopSpeech();
    setSpeakingMessageId(null);
    setMessages([]);
  };

  // Speech-to-Text Voice Recognition in Selected Language
  const handleVoiceInput = () => {
    if (typeof window === "undefined" || !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert(t.speechNotSupported || "Speech recognition is not supported in this browser.");
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = LANGUAGE_LOCALE_MAP[lang] || "en-IN";
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

  const dynamicPrompts = getRoleBasedPrompts(role, lang);

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center gap-2">
        <button
          onClick={() => {
            setIsOpen(true);
            setDrawerExpanded(true);
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
      {expanded && (
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
                  <span>{t.askWeatherGpt}</span>
                </h3>
                <p className="text-[10px] text-gray-400 font-mono">
                  {t.activeLocation}: <span className="text-yellow-400 font-semibold">{currentDashboardCity}</span> • {translatedRole}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  title={t.clearChat}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/10 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => {
                  stopSpeech();
                  setSpeakingMessageId(null);
                  setDrawerExpanded(false);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div
            ref={chatScrollRef}
            className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 max-h-[300px] md:max-h-[380px] scrollbar-thin scrollbar-thumb-yellow-400/20"
          >
            {messages.length === 0 ? (
              <div className="py-6 text-center text-gray-400 space-y-3 font-mono">
                <div className="w-12 h-12 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 flex items-center justify-center mx-auto text-yellow-400 animate-pulse">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs md:text-sm font-bold text-white">
                    {t.appTitle} — {t.appSubtitle}
                  </p>
                  <p className="text-[11px] text-gray-400 max-w-md mx-auto">
                    {t.chatPlaceholder}
                  </p>
                </div>

                {/* Role Specific Dynamic Suggestion Chips */}
                <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5">
                  {dynamicPrompts.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSubmit(p)}
                      className="px-2.5 py-1 rounded-xl bg-gray-950/80 hover:bg-yellow-400/20 border border-white/10 hover:border-yellow-400/40 text-[10px] text-gray-300 hover:text-yellow-300 transition cursor-pointer text-left"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                >
                  {/* Sender Badge */}
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono mb-1 px-1">
                    {msg.sender === "user" ? (
                      <>
                        <span>{t.roleCitizen}</span>
                        <User className="w-3 h-3 text-yellow-400" />
                      </>
                    ) : (
                      <>
                        <Bot className="w-3 h-3 text-yellow-400" />
                        <span className="text-yellow-400 font-bold">{t.appTitle} AI</span>
                        {msg.city && (
                          <span className="text-gray-400">• 📍 {msg.city}</span>
                        )}
                      </>
                    )}
                    <span>• {msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-[88%] rounded-2xl p-3.5 md:p-4 text-white shadow-md ${
                      msg.sender === "user"
                        ? "bg-yellow-400/20 border border-yellow-400/40 text-yellow-50 rounded-br-none ml-auto"
                        : "bg-gray-950/90 border border-white/15 rounded-bl-none"
                    }`}
                  >
                    {msg.sender === "assistant" ? (
                      <div className="prose prose-invert prose-xs md:prose-sm max-w-none leading-relaxed space-y-2 text-gray-200">
                        <ReactMarkdown>{stripInternalThinking(msg.text)}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="font-mono text-xs md:text-sm font-medium text-white">{msg.text}</p>
                    )}

                    {/* Bot Message Toolbar: Read Aloud in Native Language, Copy, Action Chips */}
                    {msg.sender === "assistant" && (
                      <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* TTS Audio Speak Button */}
                          <button
                            onClick={() => toggleSpeech(msg.id, stripInternalThinking(msg.text))}
                            title={speakingMessageId === msg.id ? t.stopAudio : t.listenAudio}
                            aria-label={speakingMessageId === msg.id ? "Stop voice audio" : "Listen voice audio"}
                            className={`p-1.5 rounded-lg border transition cursor-pointer flex items-center gap-1 text-[10px] font-mono ${
                              speakingMessageId === msg.id
                                ? "bg-yellow-400 text-gray-950 border-yellow-400 font-bold"
                                : "bg-black/40 border-white/10 text-gray-300 hover:text-yellow-400 hover:border-yellow-400/40"
                            }`}
                          >
                            {speakingMessageId === msg.id ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5" />
                                <span>{t.stopAudio}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-yellow-400" />
                                <span>{t.listenAudio}</span>
                              </>
                            )}
                          </button>

                          {/* Copy Button */}
                          <button
                            onClick={() => handleCopy(msg.id, stripInternalThinking(msg.text))}
                            title={t.copy}
                            aria-label="Copy response"
                            className="p-1.5 rounded-lg bg-black/40 border border-white/10 text-gray-300 hover:text-yellow-400 hover:border-yellow-400/40 transition cursor-pointer flex items-center gap-1 text-[10px] font-mono"
                          >
                            {copiedMessageId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-green-400">{t.copied}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{t.copy}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Action chip if response discusses another location */}
                        {msg.city &&
                          currentDashboardCity &&
                          msg.city.trim().toLowerCase() !== currentDashboardCity.trim().toLowerCase() &&
                          onSwitchDashboardCity && (
                            <button
                              onClick={() => onSwitchDashboardCity(msg.city!)}
                              aria-label={`Switch dashboard to ${msg.city}`}
                              className="px-2 py-0.5 rounded-md bg-yellow-400/15 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 hover:text-yellow-200 text-[10px] font-mono flex items-center gap-1 transition cursor-pointer"
                            >
                              <MapPin className="w-2.5 h-2.5 text-yellow-400" />
                              <span>{t.overview}: {msg.city}</span>
                            </button>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-yellow-400 font-mono text-xs p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-2xl w-fit">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t.appTitle} is thinking...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Persistent Bottom Modern Search / Query Input Bar */}
      <div
        className="w-full flex items-center gap-2 p-1.5 md:p-2 rounded-full
                   bg-black/90 backdrop-blur-3xl border border-yellow-400/35
                   shadow-2xl shadow-black/90 hover:border-yellow-400/50 transition-all font-mono"
      >
        <button
          onClick={() => setDrawerExpanded(!expanded)}
          title={expanded ? t.minimize : t.expand}
          aria-label={expanded ? "Minimize chat drawer" : "Expand chat drawer"}
          className="p-2 md:p-2.5 rounded-full text-yellow-400 hover:bg-yellow-400/15 transition cursor-pointer shrink-0"
        >
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!isLoading && !isSubmittingRef.current && value.trim()) {
                handleSubmit();
              }
            }
          }}
          placeholder={isLoading ? "Generating response..." : isListening ? t.listening : t.chatPlaceholder}
          disabled={isLoading}
          className="flex-1 bg-transparent text-xs md:text-sm text-white placeholder-gray-400
                     outline-none px-2 font-mono disabled:opacity-50"
        />

        {/* Voice Input Mic Button */}
        <button
          onClick={handleVoiceInput}
          disabled={isLoading}
          title={isListening ? t.listening : "Voice input"}
          aria-label="Voice input"
          className={`p-2 md:p-2.5 rounded-full transition cursor-pointer shrink-0 ${
            isListening
              ? "bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse"
              : "text-gray-400 hover:text-yellow-400 hover:bg-white/10"
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>

        {/* Send Button */}
        <button
          onClick={() => handleSubmit()}
          disabled={!value.trim() || isLoading}
          aria-label="Send message"
          className="p-2 md:p-2.5 rounded-full bg-yellow-400 text-gray-950
                     hover:bg-yellow-300 disabled:opacity-30 disabled:cursor-not-allowed
                     transition-all cursor-pointer shrink-0 font-bold"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
