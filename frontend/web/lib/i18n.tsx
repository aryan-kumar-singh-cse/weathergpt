"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface LanguageOption {
  code: string
  name: string
  nativeName: string
  flag: string
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", nativeName: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
]

export type TranslationKey =
  | "app_title"
  | "app_subtitle"
  | "welcome"
  | "logout"
  | "profile"
  | "edit_profile"
  | "location"
  | "language"
  | "select_location"
  | "select_language"
  | "state"
  | "city"
  | "search_state"
  | "search_city"
  | "back_to_states"
  | "save_changes"
  | "saving"
  | "saved_success"
  | "current_weather"
  | "temperature"
  | "feels_like"
  | "humidity"
  | "wind_speed"
  | "pressure"
  | "uv_index"
  | "visibility"
  | "precipitation"
  | "rain_probability"
  | "forecast_7day"
  | "outlook_30day"
  | "outlook_disclaimer"
  | "ask_weathergpt"
  | "ask_placeholder"
  | "send"
  | "role_citizen"
  | "role_farmer"
  | "role_pilot"
  | "role_emergency"
  | "role_citizen_desc"
  | "role_farmer_desc"
  | "role_pilot_desc"
  | "role_emergency_desc"
  | "severity_normal"
  | "severity_watch"
  | "severity_warning"
  | "severity_severe"
  | "severity_extreme"
  | "rate_limit_alert"
  | "loading"

const translations: Record<string, Record<TranslationKey, string>> = {
  en: {
    app_title: "WeatherGPT",
    app_subtitle: "AI-Powered Weather Intelligence",
    welcome: "Welcome",
    logout: "Logout",
    profile: "Profile Settings",
    edit_profile: "Edit Profile",
    location: "Location",
    language: "Language",
    select_location: "Select Location",
    select_language: "Select Language",
    state: "State",
    city: "City",
    search_state: "Search Indian state...",
    search_city: "Search city in state...",
    back_to_states: "← Back to States",
    save_changes: "Save Changes",
    saving: "Saving...",
    saved_success: "Profile updated successfully!",
    current_weather: "Current Conditions",
    temperature: "Temperature",
    feels_like: "Feels Like",
    humidity: "Humidity",
    wind_speed: "Wind Speed",
    pressure: "Pressure",
    uv_index: "UV Index",
    visibility: "Visibility",
    precipitation: "Precipitation",
    rain_probability: "Rain Chance",
    forecast_7day: "7-Day Forecast",
    outlook_30day: "30-Day Climate Outlook",
    outlook_disclaimer: "Extended 30-day outlook is based on statistical climatological projections. Lower forecast accuracy beyond day 7; intended for broad seasonal planning purposes.",
    ask_weathergpt: "Ask WeatherGPT",
    ask_placeholder: "Ask about weather, crops, flying conditions...",
    send: "Send",
    role_citizen: "Citizen",
    role_farmer: "Farmer",
    role_pilot: "Pilot",
    role_emergency: "Emergency",
    role_citizen_desc: "General everyday weather advisory",
    role_farmer_desc: "Agricultural & crop risk insights",
    role_pilot_desc: "Aviation visibility & wind metrics",
    role_emergency_desc: "Disaster & extreme weather response",
    severity_normal: "Normal Conditions",
    severity_watch: "Weather Watch",
    severity_warning: "Weather Warning",
    severity_severe: "Severe Weather Alert",
    severity_extreme: "Extreme Danger Alert",
    rate_limit_alert: "Daily question limit reached (20/day). Please try again in 24 hours.",
    loading: "Loading WeatherGPT...",
  },
  hi: {
    app_title: "वेदरजीपीटी (WeatherGPT)",
    app_subtitle: "एआई-संचालित मौसम पूर्वानुमान",
    welcome: "स्वागत है",
    logout: "लॉग आउट",
    profile: "प्रोफ़ाइल सेटिंग्स",
    edit_profile: "प्रोफ़ाइल बदलें",
    location: "स्थान",
    language: "भाषा",
    select_location: "स्थान चुनें",
    select_language: "भाषा चुनें",
    state: "राज्य",
    city: "शहर",
    search_state: "राज्य खोजें...",
    search_city: "शहर खोजें...",
    back_to_states: "← राज्यों की सूची",
    save_changes: "सहेजें",
    saving: "सहेजा जा रहा है...",
    saved_success: "प्रोफ़ाइल सफलतापूर्वक अपडेट की गई!",
    current_weather: "वर्तमान मौसम",
    temperature: "तापमान",
    feels_like: "महसूस तापमान",
    humidity: "नमी",
    wind_speed: "हवा की गति",
    pressure: "वायुमंडलीय दबाव",
    uv_index: "यूवी इंडेक्स",
    visibility: "दृश्यता",
    precipitation: "वर्षा",
    rain_probability: "बारिश की संभावना",
    forecast_7day: "7-दिवसीय पूर्वानुमान",
    outlook_30day: "30-दिवसीय जलवायु आउटलुक",
    outlook_disclaimer: "30-दिवसीय पूर्वानुमान सांख्यिकीय जलवायु मॉडल पर आधारित है। 7 दिनों के बाद सटीकता कम होती है; यह केवल व्यापक मौसमी योजना के लिए है।",
    ask_weathergpt: "वेदरजीपीटी से पूछें",
    ask_placeholder: "मौसम, फसलों, वर्षा या उड़ान की स्थिति के बारे में पूछें...",
    send: "भेजें",
    role_citizen: "नागरिक",
    role_farmer: "किसान",
    role_pilot: "पायलट",
    role_emergency: "आपदा प्रबंधन",
    role_citizen_desc: "दैनिक जीवन मौसम जानकारी",
    role_farmer_desc: "कृषि, सिंचाई व फसल सलाह",
    role_pilot_desc: "विमानन मौसम व दृश्यता ब्रीफिंग",
    role_emergency_desc: "आपदा राहत व सुरक्षा अलर्ट",
    severity_normal: "सामान्य स्थिति",
    severity_watch: "मौसम निगरानी",
    severity_warning: "मौसम चेतावनी",
    severity_severe: "गंभीर मौसम चेतावनी",
    severity_extreme: "अत्यधिक खतरे की चेतावनी",
    rate_limit_alert: "दैनिक प्रश्न सीमा समाप्त (20/दिन)। कृपया 24 घंटे बाद पुनः प्रयास करें।",
    loading: "वेदरजीपीटी लोड हो रहा है...",
  },
  te: {
    app_title: "వెదర్ జిపిటి",
    app_subtitle: "AI ఆధారిత వాతావరణ సమాచారం",
    welcome: "స్వాగతం",
    logout: "లాగ్ అవుట్",
    profile: "ప్రొఫైల్ సెట్టింగ్‌లు",
    edit_profile: "ప్రొఫైల్ సవరించండి",
    location: "ప్రాంతం",
    language: "భాష",
    select_location: "ప్రాంతాన్ని ఎంచుకోండి",
    select_language: "భాషను ఎంచుకోండి",
    state: "రాష్ట్రం",
    city: "నగరం",
    search_state: "రాష్ట్రాన్ని వెతకండి...",
    search_city: "నగరాన్ని వెతకండి...",
    back_to_states: "← రాష్ట్రాల జాబితా",
    save_changes: "మార్పులను సేవ్ చేయండి",
    saving: "సేవ్ చేస్తోంది...",
    saved_success: "ప్రొఫైల్ విజయవంతంగా నవీకరించబడింది!",
    current_weather: "ప్రస్తుత వాతావరణం",
    temperature: "ఉష్ణోగ్రత",
    feels_like: "అనిపించే ఉష్ణోగ్రత",
    humidity: "తేమ",
    wind_speed: "గాలి వేగం",
    pressure: "పీడనం",
    uv_index: "UV సూచిక",
    visibility: "దృశ్యమానత",
    precipitation: "వర్షపాతం",
    rain_probability: "వర్షం పడే అవకాశం",
    forecast_7day: "7 రోజుల సూచన",
    outlook_30day: "30 రోజుల వాతావరణ ఔట్లుక్",
    outlook_disclaimer: "30 రోజుల ఔట్లుక్ గణాంక వాతావరణ నమూనాలపై ఆధారపడి ఉంటుంది. 7 రోజుల తర్వాత ఖచ్చితత్వం తగ్గుతుంది.",
    ask_weathergpt: "WeatherGPTని అడగండి",
    ask_placeholder: "వాతావరణం, పంటలు లేదా వర్షం గురించి అడగండి...",
    send: "పంపు",
    role_citizen: "పౌరుడు",
    role_farmer: "రైతు",
    role_pilot: "పైలట్",
    role_emergency: "అత్యవసర విభాగం",
    role_citizen_desc: "రోజువారీ వాతావరణ సలహాలు",
    role_farmer_desc: "వ్యవసాయం & పంట రక్షణ సలహాలు",
    role_pilot_desc: "విమానయాన వాతావరణ సమాచారం",
    role_emergency_desc: "విపత్తు నిర్వహణ హెచ్చరికలు",
    severity_normal: "సాధారణ పరిస్థితులు",
    severity_watch: "వాతావరణ గమనిక",
    severity_warning: "వాతావరణ హెచ్చరిక",
    severity_severe: "తీవ్రమైన హెచ్చరిక",
    severity_extreme: "అత్యంత ప్రమాదకర హెచ్చరిక",
    rate_limit_alert: "రోజువారీ పరిమితి ముగిసింది (20/రోజు).",
    loading: "లోడ్ అవుతోంది...",
  },
  ta: {
    app_title: "வெதர்ஜிபிடி (WeatherGPT)",
    app_subtitle: "AI வானிலை வழிகாட்டி",
    welcome: "வரவேற்கிறோம்",
    logout: "வெளியேறு",
    profile: "சுயவிவர அமைப்புகள்",
    edit_profile: "சுயவிவரத்தைத் திருத்து",
    location: "இடம்",
    language: "மொழி",
    select_location: "இடத்தைத் தேர்ந்தெடுக்கவும்",
    select_language: "மொழியைத் தேர்ந்தெடுக்கவும்",
    state: "மாநிலம்",
    city: "நகரம்",
    search_state: "மாநிலத்தைத் தேடுங்கள்...",
    search_city: "நகரத்தைத் தேடுங்கள்...",
    back_to_states: "← மாநிலங்கள் பட்டியல்",
    save_changes: "சேமிக்கவும்",
    saving: "சேமிக்கிறது...",
    saved_success: "சுயவிவரம் புதுப்பிக்கப்பட்டது!",
    current_weather: "தற்போதைய வானிலை",
    temperature: "வெப்பநிலை",
    feels_like: "உணரப்படும் வெப்பநிலை",
    humidity: "ஈரப்பதம்",
    wind_speed: "காற்றின் வேகம்",
    pressure: "காற்றழுத்தம்",
    uv_index: "UV குறியீடு",
    visibility: "பார்வைத்திறன்",
    precipitation: "மழைப்பொழிவு",
    rain_probability: "மழை வாய்ப்பு",
    forecast_7day: "7 நாள் வானிலை முன்னறிவிப்பு",
    outlook_30day: "30 நாள் கால நிலை பார்வை",
    outlook_disclaimer: "30 நாள் பார்வை புள்ளிவிவர வானிலை மாதிரிகளை அடிப்படையாகக் கொண்டது.",
    ask_weathergpt: "WeatherGPT இடம் கேளுங்கள்",
    ask_placeholder: "வானிலை, விவசாயம் அல்லது மழை பற்றி கேளுங்கள்...",
    send: "அனுப்பு",
    role_citizen: "குடிமகன்",
    role_farmer: "விவசாயி",
    role_pilot: "விமானி",
    role_emergency: "அவசர மேலாண்மை",
    role_citizen_desc: "தினசரி வானிலை தகவல்",
    role_farmer_desc: "பயிர் பாதுகாப்பு மற்றும் விவசாய ஆலோசனை",
    role_pilot_desc: "விமானப் பயண வானிலை தகவல்",
    role_emergency_desc: "பேரிடர் எச்சரிக்கைகள்",
    severity_normal: "சாதாரண நிலை",
    severity_watch: "வானிலை கண்காணிப்பு",
    severity_warning: "வானிலை எச்சரிக்கை",
    severity_severe: "கடுமையான எச்சரிக்கை",
    severity_extreme: "அதிதீவிர எச்சரிக்கை",
    rate_limit_alert: "தினசரி கேள்வி வரம்பு முடிந்தது (20/நாள்).",
    loading: "ஏற்றப்படுகிறது...",
  },
  mr: {
    app_title: "वेदरजीपीटी (WeatherGPT)",
    app_subtitle: "AI हवामान अंदाज प्रणाली",
    welcome: "स्वागत आहे",
    logout: "लॉगआउट",
    profile: "प्रोफाइल सेटिंग्ज",
    edit_profile: "प्रोफाइल बदला",
    location: "स्थान",
    language: "भाषा",
    select_location: "स्थान निवडा",
    select_language: "भाषा निवडा",
    state: "राज्य",
    city: "शहर",
    search_state: "राज्य शोधा...",
    search_city: "शहर शोधा...",
    back_to_states: "← राज्यांची यादी",
    save_changes: "बदल जतन करा",
    saving: "जतन करत आहे...",
    saved_success: "प्रोफाइल यशस्वीरित्या अद्यतनित झाली!",
    current_weather: "सध्याचे हवामान",
    temperature: "तापमान",
    feels_like: "जाणवणारे तापमान",
    humidity: "आर्द्रता",
    wind_speed: "वाऱ्याचा वेग",
    pressure: "हवेचा दाब",
    uv_index: "UV निर्देशांक",
    visibility: "दृश्यमानता",
    precipitation: "पाऊस",
    rain_probability: "पावसाची शक्यता",
    forecast_7day: "७ दिवसांचा अंदाज",
    outlook_30day: "३० दिवसांचा हवामान अंदाज",
    outlook_disclaimer: "३० दिवसांचा अंदाज सांख्यिकी हवामान मॉडेलवर आधारित आहे.",
    ask_weathergpt: "WeatherGPT ला विचारा",
    ask_placeholder: "हवामान, पिके किंवा पावसाविषयी विचारा...",
    send: "पाठवा",
    role_citizen: "नागरिक",
    role_farmer: "शेतकरी",
    role_pilot: "वैमानिक",
    role_emergency: "आपत्कालीन व्यवस्थापन",
    role_citizen_desc: "दैनंदिन हवामान माहिती",
    role_farmer_desc: "शेती व पीक सल्ला",
    role_pilot_desc: "विमान उड्डाण हवामान माहिती",
    role_emergency_desc: "आपत्ती निवारण अलर्ट",
    severity_normal: "सामान्य स्थिती",
    severity_watch: "हवामान निरीक्षण",
    severity_warning: "हवामान चेतावणी",
    severity_severe: "गंभीर हवामान अलर्ट",
    severity_extreme: "अति धोकादायक हवामान",
    rate_limit_alert: "दैनिक प्रश्न मर्यादा पूर्ण झाली (२०/दिवस).",
    loading: "लोड होत आहे...",
  },
  bn: {
    app_title: "ওয়েদারজিপিটি (WeatherGPT)",
    app_subtitle: "এআই আবহাওয়া পূর্বাভাস",
    welcome: "স্বাগতম",
    logout: "লগআউট",
    profile: "প্রোফাইল সেটিংস",
    edit_profile: "প্রোফাইল পরিবর্তন",
    location: "অবস্থান",
    language: "ভাষা",
    select_location: "অবস্থান নির্বাচন করুন",
    select_language: "ভাষা নির্বাচন করুন",
    state: "রাজ্য",
    city: "শহর",
    search_state: "রাজ্য খুঁজুন...",
    search_city: "শহর খুঁজুন...",
    back_to_states: "← রাজ্য তালিকা",
    save_changes: "সংরক্ষণ করুন",
    saving: "সংরক্ষণ হচ্ছে...",
    saved_success: "প্রোফাইল আপডেট হয়েছে!",
    current_weather: "বর্তমান আবহাওয়া",
    temperature: "তাপমাত্রা",
    feels_like: "অনুভূত তাপমাত্রা",
    humidity: "আর্দ্রতা",
    wind_speed: "বাতাসের গতি",
    pressure: "বায়ুর চাপ",
    uv_index: "ইউভি ইনডেক্স",
    visibility: "দৃশ্যমানতা",
    precipitation: "বৃষ্টিপাত",
    rain_probability: "বৃষ্টির সম্ভাবনা",
    forecast_7day: "৭ দিনের পূর্বাভাস",
    outlook_30day: "৩০ দিনের আবহাওয়া আউটলুক",
    outlook_disclaimer: "৩০ দিনের আউটলুক জলবায়ু মডেলের উপর ভিত্তি করে তৈরি।",
    ask_weathergpt: "WeatherGPT কে জিজ্ঞাসা করুন",
    ask_placeholder: "আবহাওয়া, ফসল বা বৃষ্টি সম্পর্কে জিজ্ঞাসা করুন...",
    send: "পাঠান",
    role_citizen: "নাগরিক",
    role_farmer: "কৃষক",
    role_pilot: "পাইলট",
    role_emergency: "জরুরি পরিষেবা",
    role_citizen_desc: "দৈনন্দিন আবহাওয়া তথ্য",
    role_farmer_desc: "কৃষি ও ফসল সুরক্ষা পরামর্শ",
    role_pilot_desc: "বিমান চলাচল আবহাওয়া ব্রিফিং",
    role_emergency_desc: "দুর্যোগ সতর্কতা ও তথ্য",
    severity_normal: "স্বাভাবিক অবস্থা",
    severity_watch: "আবহাওয়া পর্যবেক্ষণ",
    severity_warning: "আবহাওয়া সতর্কতা",
    severity_severe: "গুরুতর সতর্কতা",
    severity_extreme: "চরম বিপদ সতর্কতা",
    rate_limit_alert: "দৈনিক প্রশ্ন সীমা পূর্ণ (২০/দিন)।",
    loading: "লোড হচ্ছে...",
  },
}

// Fallback to English if translation is missing for other languages
SUPPORTED_LANGUAGES.forEach(lang => {
  if (!translations[lang.code]) {
    translations[lang.code] = translations.en
  }
})

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  t: (key: TranslationKey) => string
  languages: LanguageOption[]
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: TranslationKey) => key,
  languages: SUPPORTED_LANGUAGES,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>("en")

  useEffect(() => {
    const saved = localStorage.getItem("weathergpt_language")
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem("weathergpt_language", lang)
  }

  const t = (key: TranslationKey): string => {
    const langDict = translations[language] || translations.en
    return langDict[key] || translations.en[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  return useContext(LanguageContext)
}
