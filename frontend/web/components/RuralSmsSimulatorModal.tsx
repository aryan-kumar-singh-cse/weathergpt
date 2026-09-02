"use client";

import React, { useState, useEffect } from "react";
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
  VolumeX,
} from "lucide-react";
import { SupportedLanguage, LANGUAGE_OPTIONS, TRANSLATIONS, translateCondition } from "@/lib/translations";
import { speakText, stopSpeech } from "@/lib/tts";
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
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (lang) setPhoneLanguage(lang === "en" ? "hi" : lang);
  }, [lang]);

  if (!isOpen) return null;

  const t = TRANSLATIONS[phoneLanguage] || TRANSLATIONS.hi;
  const translatedCond = translateCondition(condition, phoneLanguage);

  const smsTexts: Record<SupportedLanguage, string> = {
    en: `[WeatherGPT Alert - ${city}]\nTemp: ${temp}°C, ${condition}\nRain: ${rainChance}%, Wind: ${windSpeed}km/h\nAdvisory: ${windSpeed < 18 ? "Safe to spray pesticide." : "Delay spraying due to wind."} - IMD/MoES`,
    hi: `[वेदर जीपीटी मौसम अलर्ट - ${city}]\nतापमान: ${temp}°C, ${translatedCond}\nबारिश: ${rainChance}%, हवा: ${windSpeed}किमी/घंटा\nसलाह: ${windSpeed < 18 ? "कीटनाशक छिड़काव सुरक्षित है।" : "हवा के कारण छिड़काव टालें।"} - भारत मौसम विभाग`,
    mr: `[वेदर जीपीटी हवामान सूचना - ${city}]\nतापमान: ${temp}°C, ${translatedCond}\nपाऊस: ${rainChance}%, वारा: ${windSpeed}किमी/तास\nफवारणी सल्ला: ${windSpeed < 18 ? "फवारणीसाठी अनुकूल वेळ." : "फवारणी टाळा."} - कृषी विभाग`,
    ta: `[வானிலை எச்சரிக்கை - ${city}]\nவெப்பநிலை: ${temp}°C, ${translatedCond}\nமழை: ${rainChance}%, காற்று: ${windSpeed}கி.மீ/மணி\nமருந்து தெளிக்க: ${windSpeed < 18 ? "ஏற்ற நேரம்." : "தவிர்க்கவும்."} - IMD`,
    te: `[వాతావరణ హెచ్చరిక - ${city}]\nఉష్ణోగ్రత: ${temp}°C, ${translatedCond}\nవర్షం: ${rainChance}%, గాలి: ${windSpeed}కి.మీ/గం\nసలహా: పురుగుమందుల పిచికారీకి ${windSpeed < 18 ? "అనుకూల సమయం." : "వాయిదా వేయండి."} - IMD`,
    bn: `[আবহাওয়া সতর্কতা - ${city}]\nতাপমাত্রা: ${temp}°C, ${translatedCond}\nবৃষ্টি: ${rainChance}%, বাতাস: ${windSpeed}কিমি/ঘন্টা\nপরামর্শ: কীটনাশক স্প্রে ${windSpeed < 18 ? "করার উপযুক্ত সময়।" : "স্থগিত রাখুন।"} - IMD`,
    gu: `[હવામાન ચેતવણી - ${city}]\nતાપમાન: ${temp}°C, ${translatedCond}\nવરસાદ: ${rainChance}%, પવન: ${windSpeed}કિમી/કલાક\nસલાહ: દવા છંટકાવ ${windSpeed < 18 ? "માટે યોગ્ય સમય." : "મોકૂફ રાખો."} - IMD`,
    kn: `[ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ - ${city}]\nತಾಪಮಾನ: ${temp}°C, ${translatedCond}\nಮಳೆ: ${rainChance}%, ಗಾಳಿ: ${windSpeed}ಕಿ.ಮೀ/ಗಂ\nಸಲಹೆ: ಔಷಧ ಸಿಂಪಡಣೆಗೆ ${windSpeed < 18 ? "ಸೂಕ್ತ ಸಮಯ." : "ಮುಂದೂಡಿ."} - IMD`,
    pa: `[ਮੌਸਮ ਚੇਤਾਵਨੀ - ${city}]\nਤਾਪਮਾਨ: ${temp}°C, ${translatedCond}\nਮੀਂਹ: ${rainChance}%, ਹਵਾ: ${windSpeed}ਕਿਮੀ/ਘੰਟਾ\nਸਲਾਹ: ਸਪਰੇਅ ਕਰਨ ਲਈ ${windSpeed < 18 ? "ਅਨੁਕੂਲ ਸਮਾਂ।" : "ਟਾਲੋ।"} - IMD`,
    ml: `[കാലാവസ്ഥാ മുന്നറിയിപ്പ് - ${city}]\nതാപനില: ${temp}°C, ${translatedCond}\nമഴ: ${rainChance}%, കാറ്റ്: ${windSpeed}കി.മീ/മണിക്കൂർ\nഉപദേശം: മരുന്ന് തളിക്കാൻ ${windSpeed < 18 ? "അനുയോജ്യമായ സമയം." : "ഒഴിവാക്കുക."} - IMD`,
  };

  const currentSms = smsTexts[phoneLanguage] || smsTexts.hi;
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
    toast.success(t.copied || "Alert text copied!");
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Spoken voice call simulation in vernacular
  const handleSpeakVoiceAlert = () => {
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    speakText(
      currentSms.replace(/\[.*?\]/g, ""),
      phoneLanguage,
      () => setIsSpeaking(true),
      () => setIsSpeaking(false),
      () => setIsSpeaking(false)
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-mono">
      <div className="relative w-full max-w-xl rounded-3xl bg-black/95 border border-yellow-400/40 shadow-2xl shadow-yellow-400/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/20 bg-yellow-400/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-yellow-400/20 border border-yellow-400/50 flex items-center justify-center text-yellow-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
                <span>{t.ruralSms}</span>
              </h2>
              <p className="text-xs text-yellow-400 font-mono">
                {city} • 2G/3G Cellular & WhatsApp Gateway
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopSpeech();
              onClose();
            }}
            className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 font-mono text-xs text-gray-200 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400/30">
          {/* Language Selector Chips */}
          <div>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-yellow-400" />
              <span>Select Vernacular Language:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => {
                    stopSpeech();
                    setIsSpeaking(false);
                    setPhoneLanguage(opt.code);
                  }}
                  className={`px-3 py-1 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    phoneLanguage === opt.code
                      ? "bg-yellow-400/25 border-yellow-400 text-yellow-300 shadow-md shadow-yellow-400/10"
                      : "bg-gray-950 border-white/10 text-gray-400 hover:text-white"
                  }`}
                >
                  <span>{opt.flag}</span>
                  <span>{opt.nativeName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Phone Input */}
          <div className="p-3.5 rounded-2xl bg-gray-950 border border-white/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <PhoneCall className="w-4 h-4 text-emerald-400 shrink-0" />
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+91 98765 43210"
                className="bg-transparent text-white font-mono text-xs outline-none w-full placeholder-gray-500"
              />
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0 font-bold">
              100% Free
            </span>
          </div>

          {/* Mockup Feature Phone SMS Display Screen */}
          <div className="rounded-2xl border border-yellow-400/30 bg-black/90 p-4 space-y-2 shadow-inner">
            <div className="flex items-center justify-between text-[10px] text-gray-400 pb-2 border-b border-white/10">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>IN-DOT-MET-ALERT</span>
              </span>
              <span>160/160 GSM 7-Bit</span>
            </div>

            <pre className="font-mono text-xs text-yellow-200 whitespace-pre-wrap leading-relaxed py-1">
              {currentSms}
            </pre>
          </div>

          {/* Action Buttons: WhatsApp Real Trigger, Native SMS Trigger, IVR Call Voice, Copy */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button
              onClick={handleRealWhatsAppSend}
              className="p-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              <Share2 className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleNativeSmsSend}
              className="p-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/50 text-cyan-300 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              <MessageSquare className="w-4 h-4 text-cyan-400" />
              <span>Cellular SMS</span>
            </button>

            <button
              onClick={handleSpeakVoiceAlert}
              className={`p-2.5 rounded-xl border font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                isSpeaking
                  ? "bg-yellow-400 text-gray-950 border-yellow-400 animate-pulse"
                  : "bg-yellow-400/20 hover:bg-yellow-400/30 border-yellow-400/50 text-yellow-300"
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-yellow-400" />}
              <span>{isSpeaking ? t.stopAudio : t.listenAudio}</span>
            </button>

            <button
              onClick={handleCopyText}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
            >
              {isCopied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? t.copied : t.copy}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
