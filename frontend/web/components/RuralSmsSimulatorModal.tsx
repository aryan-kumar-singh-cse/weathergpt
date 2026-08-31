"use client";

import React, { useState } from "react";
import {
  X,
  Smartphone,
  Send,
  Volume2,
  CheckCircle2,
  Radio,
  Globe,
  Share2,
  Copy,
  MessageSquare,
  PhoneCall,
} from "lucide-react";
import { SupportedLanguage, LANGUAGE_OPTIONS, TRANSLATIONS } from "@/lib/translations";
import { toast } from "react-hot-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  temp: number;
  condition: string;
  rainChance?: number;
  windSpeed?: number;
  lang?: SupportedLanguage;
};

export default function RuralSmsSimulatorModal({
  isOpen,
  onClose,
  city,
  temp,
  condition,
  rainChance = 20,
  windSpeed = 10,
  lang = "hi",
}: Props) {
  const [phoneLanguage, setPhoneLanguage] = useState<SupportedLanguage>(lang === "en" ? "hi" : lang);
  const [phoneNumber, setPhoneNumber] = useState("+91 98765 43210");
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const smsTexts: Record<SupportedLanguage, string> = {
    en: `[WeatherGPT Alert - ${city}]\nTemp: ${temp}°C, ${condition}\nRain: ${rainChance}%, Wind: ${windSpeed}km/h\nAdvisory: ${windSpeed < 18 ? "Safe to spray pesticide." : "Delay spraying due to wind."} - IMD/MoES`,
    hi: `[वेदर जीपीटी मौसम अलर्ट - ${city}]\nतापमान: ${temp}°C, ${condition}\nबारिश: ${rainChance}%, हवा: ${windSpeed}किमी/घंटा\nसलाह: ${windSpeed < 18 ? "कीटनाशक छिड़काव सुरक्षित है।" : "हवा के कारण छिड़काव टालें।"} - भारत मौसम विभाग`,
    mr: `[वेदर जीपीटी हवामान सूचना - ${city}]\nतापमान: ${temp}°C, पाऊस: ${rainChance}%\nफवारणी सल्ला: ${windSpeed < 18 ? "फवारणीसाठी अनुकूल वेळ." : "फवारणी टाळा."} - कृषी विभाग`,
    ta: `[வானிலை எச்சரிக்கை - ${city}]\nவெப்பநிலை: ${temp}°C, மழை: ${rainChance}%\nமருந்து தெளிக்க: ${windSpeed < 18 ? "ஏற்ற நேரம்." : "தவிர்க்கவும்."} - IMD`,
    te: `[వాతావరణ హెచ్చరిక - ${city}]\nఉష్ణోగ్రత: ${temp}°C, వర్షం: ${rainChance}%\nసలహా: పురుగుమందుల పిచికారీకి ${windSpeed < 18 ? "అనుకూల సమయం." : "వాయిదా వేయండి."}`,
    bn: `[আবহাওয়া সতর্কতা - ${city}]\nতাপমাত্রা: ${temp}°C, বৃষ্টি: ${rainChance}%\nপরামর্শ: কীটনাশক স্প্রে ${windSpeed < 18 ? "করার উপযুক্ত সময়।" : "স্থগিত রাখুন।"}`,
    gu: `[હવામાન ચેતવણી - ${city}]\nતાપમાન: ${temp}°C, વરસાદ: ${rainChance}%\nસલાહ: દવા છંટકાવ ${windSpeed < 18 ? "માટે યોગ્ય સમય." : "મોકૂફ રાખો."}`,
  };

  const currentSms = smsTexts[phoneLanguage] || smsTexts.hi;

  // Clean phone number (remove spaces, plus, hyphens for URL schemes)
  const cleanPhone = phoneNumber.replace(/[^\d]/g, "");

  // Real WhatsApp direct delivery to user's phone number
  const handleRealWhatsAppSend = () => {
    const waUrl = cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(currentSms)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(currentSms)}`;
    window.open(waUrl, "_blank");
    toast.success(`Opening WhatsApp alert for ${phoneNumber}!`);
  };

  // Real native SMS app direct trigger
  const handleNativeSmsSend = () => {
    const smsUrl = `sms:${cleanPhone || ""}?body=${encodeURIComponent(currentSms)}`;
    window.location.href = smsUrl;
    toast.success("Opening native SMS app on device!");
  };

  // Copy SMS content
  const handleCopyText = () => {
    navigator.clipboard.writeText(currentSms);
    setIsCopied(true);
    toast.success("Alert text copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Spoken voice call simulation in vernacular
  const handleSpeakVoiceAlert = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentSms.replace(/\[.*?\]/g, ""));
      const localeMap: Record<SupportedLanguage, string> = {
        en: "en-IN",
        hi: "hi-IN",
        mr: "mr-IN",
        ta: "ta-IN",
        te: "te-IN",
        bn: "bn-IN",
        gu: "gu-IN",
      };
      utterance.lang = localeMap[phoneLanguage] || "hi-IN";
      window.speechSynthesis.speak(utterance);
      toast.success("Playing vernacular voice bulletin audio!");
    } else {
      toast.error("Audio synthesis not supported by this browser");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-xl rounded-3xl bg-black/95 border border-yellow-400/40 shadow-2xl shadow-yellow-400/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/20 bg-yellow-400/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center text-yellow-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>Rural 2G/3G SMS & Automated IVR Voice Broadcast</span>
              </h2>
              <p className="text-xs text-yellow-400 font-mono">
                Real-Time Dispatch to Farmer Mobile Numbers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 font-mono text-xs text-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/30">
          {/* Vernacular Language Selector */}
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1.5">
              Select Farmer&apos;s Native Language for Alert:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGE_OPTIONS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setPhoneLanguage(l.code)}
                  className={`px-3 py-1 rounded-xl border transition cursor-pointer text-xs ${
                    phoneLanguage === l.code
                      ? "bg-yellow-400 text-gray-950 font-bold border-yellow-400 shadow-md"
                      : "bg-gray-900 border-white/10 text-gray-300 hover:text-white"
                  }`}
                >
                  {l.flag} {l.nativeName}
                </button>
              ))}
            </div>
          </div>

          {/* Nokia / Feature Phone Mockup Screen */}
          <div className="w-full max-w-sm mx-auto p-4 rounded-3xl bg-gray-900 border-4 border-gray-700 shadow-2xl space-y-3">
            <div className="flex items-center justify-between text-[10px] text-emerald-400 border-b border-gray-800 pb-1.5 font-bold">
              <span>BSNL 2G 📶</span>
              <span>12:00 PM 🔋</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-200 text-xs whitespace-pre-line leading-relaxed shadow-inner font-sans">
              {currentSms}
            </div>

            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
              <span>Chars: {currentSms.length}/160</span>
              <button
                onClick={handleSpeakVoiceAlert}
                className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 transition cursor-pointer font-bold"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Hear Voice Alert</span>
              </button>
            </div>
          </div>

          {/* User Mobile Number Input */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider block">
              Enter Your Real 10-Digit Mobile Number (or Farmer Number):
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-900 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-yellow-400 placeholder:text-gray-600"
              placeholder="+91 98765 43210"
            />
          </div>

          {/* Real Dispatch Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
            <button
              onClick={handleRealWhatsAppSend}
              className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-gray-950 font-extrabold font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-emerald-500/20"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Send WhatsApp</span>
            </button>

            <button
              onClick={handleNativeSmsSend}
              className="p-2.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-950 font-extrabold font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg shadow-yellow-400/20"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Send Native SMS</span>
            </button>

            <button
              onClick={handleCopyText}
              className="p-2.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-white/10 text-gray-200 font-mono text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied!" : "Copy SMS"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
