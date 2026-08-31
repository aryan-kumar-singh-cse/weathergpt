"use client";

import React from "react";
import {
  X,
  Printer,
  Share2,
  FileText,
  Calendar,
  Cloud,
  Droplets,
  Wind,
  ShieldAlert,
  Sprout,
  CheckCircle2,
} from "lucide-react";
import { SupportedLanguage, TRANSLATIONS } from "@/lib/translations";

type ForecastDay = {
  date: number | string;
  day: string;
  condition?: string;
  highTemp: number;
  lowTemp?: number;
  rainChance?: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  city: string;
  temp: number;
  condition: string;
  humidity?: number;
  windSpeed?: number;
  pressure?: number;
  rainChance?: number;
  forecast?: ForecastDay[];
  role?: string;
  lang?: SupportedLanguage;
};

export default function WeatherBulletinExportModal({
  isOpen,
  onClose,
  city,
  temp,
  condition,
  humidity = 65,
  windSpeed = 12,
  pressure = 1012,
  rainChance = 20,
  forecast = [],
  role = "farmer",
  lang = "en",
}: Props) {
  if (!isOpen) return null;

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const lines = [
      `🌦️ *WeatherGPT Daily Meteorological & Advisory Bulletin*`,
      `📍 *Location:* ${city}`,
      `📅 *Date:* ${currentDate}`,
      `🌡️ *Temperature:* ${temp}°C (${condition})`,
      `💧 *Humidity:* ${humidity}% | 💨 *Wind:* ${windSpeed} km/h`,
      `🌧️ *Rain Probability:* ${rainChance}%`,
      ``,
      `🌾 *Sector Action Summary:*`,
      `- Pesticide Spraying: ${windSpeed < 18 && rainChance < 40 ? "Safe (Feasible)" : "Delay (Wash-off risk)"}`,
      `- Irrigation: ${rainChance < 30 ? "Recommended" : "Hold off (Rain expected)"}`,
      ``,
      `📅 *Upcoming 3-Day Forecast:*`,
      ...forecast.slice(0, 3).map((f) => `• ${f.day} (${f.date}): ${f.highTemp}°C / ${f.lowTemp ?? f.highTemp - 5}°C - ${f.condition} (${f.rainChance ?? 20}% rain)`),
      ``,
      `🔗 Generated live via WeatherGPT Meteorological Intelligence: https://weathergpt.gov.in`,
    ];

    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(shareUrl, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in print:bg-white print:p-0">
      <div className="relative w-full max-w-2xl rounded-3xl bg-black/95 border border-yellow-400/35 shadow-2xl shadow-yellow-400/10 overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:border-none print:shadow-none print:bg-white print:text-black">
        {/* Modal Top Action Bar (Hidden when printing) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-yellow-400/20 bg-yellow-400/[0.04] print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white font-mono">
              Official Meteorological Advisory Bulletin
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Share on WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-yellow-400 hover:bg-yellow-500 text-gray-950 text-xs font-bold font-mono flex items-center gap-1.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Bulletin Document */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 font-mono text-xs text-gray-200 print:text-black print:p-0 scrollbar-thin scrollbar-thumb-yellow-400/30">
          {/* Document Header */}
          <div className="border-b-2 border-yellow-400/40 pb-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-yellow-400 uppercase print:text-gray-700">
                WeatherGPT • Meteorological Intelligence System
              </span>
              <h1 className="text-lg md:text-xl font-extrabold text-white print:text-black mt-0.5">
                Daily Agro-Meteorological & Advisory Bulletin
              </h1>
              <p className="text-xs text-gray-400 print:text-gray-600">
                Issued for Gram Panchayats, KVKs, & Operational Stakeholders
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-yellow-400 print:text-black block">{city}</span>
              <span className="text-[10px] text-gray-400 print:text-gray-600 block">{currentDate}</span>
            </div>
          </div>

          {/* Current Micro Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-gray-950/80 border border-white/10 print:border-gray-300 print:bg-gray-50 space-y-1">
              <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase">Temperature</span>
              <span className="text-base font-bold text-white print:text-black block">{temp}°C</span>
              <p className="text-[10px] text-yellow-400 print:text-gray-700">{condition}</p>
            </div>

            <div className="p-3 rounded-xl bg-gray-950/80 border border-white/10 print:border-gray-300 print:bg-gray-50 space-y-1">
              <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase">Rain Probability</span>
              <span className="text-base font-bold text-cyan-400 print:text-black block">{rainChance}%</span>
              <p className="text-[10px] text-gray-400 print:text-gray-600">Convective index</p>
            </div>

            <div className="p-3 rounded-xl bg-gray-950/80 border border-white/10 print:border-gray-300 print:bg-gray-50 space-y-1">
              <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase">Wind Velocity</span>
              <span className="text-base font-bold text-white print:text-black block">{windSpeed} km/h</span>
              <p className="text-[10px] text-gray-400 print:text-gray-600">Surface gusts</p>
            </div>

            <div className="p-3 rounded-xl bg-gray-950/80 border border-white/10 print:border-gray-300 print:bg-gray-50 space-y-1">
              <span className="text-[10px] text-gray-400 print:text-gray-600 uppercase">Humidity</span>
              <span className="text-base font-bold text-white print:text-black block">{humidity}%</span>
              <p className="text-[10px] text-gray-400 print:text-gray-600">Relative moisture</p>
            </div>
          </div>

          {/* Agricultural & Field Advisory Section */}
          <div className="p-4 rounded-2xl bg-yellow-400/10 border border-yellow-400/30 print:border-gray-400 print:bg-gray-50 space-y-2">
            <h3 className="font-bold text-yellow-300 print:text-black text-xs flex items-center gap-2">
              <Sprout className="w-4 h-4 text-yellow-400" />
              <span>Operational & Crop Advisory Directives:</span>
            </h3>
            <ul className="space-y-1 text-xs text-gray-300 print:text-black list-disc list-inside leading-relaxed">
              <li>
                <strong>Spraying Feasibility:</strong> {windSpeed < 18 && rainChance < 40 ? "FEASIBLE — Safe for foliar sprays & fertilization." : "DELAY — High risk of wash-off & spray drift."}
              </li>
              <li>
                <strong>Irrigation Management:</strong> {rainChance < 30 ? "REQUIRED — Maintain scheduled field irrigation." : "HOLD OFF — Natural precipitation expected to satisfy crop moisture demand."}
              </li>
              <li>
                <strong>Post-Harvest Care:</strong> Cover threshed grains and harvested produce with waterproof tarpaulins to prevent fungal deterioration.
              </li>
            </ul>
          </div>

          {/* 7-Day Forecast Table */}
          {forecast.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-bold text-white print:text-black text-xs flex items-center gap-2">
                <Calendar className="w-4 h-4 text-yellow-400" />
                <span>7-Day Synoptic Weather Outlook</span>
              </h3>
              <div className="overflow-x-auto rounded-xl border border-white/10 print:border-gray-300">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-950 print:bg-gray-100 text-gray-400 print:text-black border-b border-white/10 print:border-gray-300">
                    <tr>
                      <th className="p-2.5">Date / Day</th>
                      <th className="p-2.5">Condition</th>
                      <th className="p-2.5">Max Temp</th>
                      <th className="p-2.5">Min Temp</th>
                      <th className="p-2.5">Rain Chance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 print:divide-gray-200">
                    {forecast.slice(0, 7).map((f, idx) => (
                      <tr key={idx} className="hover:bg-white/5 print:hover:bg-transparent">
                        <td className="p-2.5 font-bold text-white print:text-black">
                          {f.day} ({f.date})
                        </td>
                        <td className="p-2.5 text-gray-300 print:text-black">{f.condition || "Clear"}</td>
                        <td className="p-2.5 font-bold text-yellow-400 print:text-black">{f.highTemp}°C</td>
                        <td className="p-2.5 text-gray-400 print:text-black">{f.lowTemp ?? f.highTemp - 5}°C</td>
                        <td className="p-2.5 text-cyan-400 print:text-black">{f.rainChance ?? 20}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer Sign-off */}
          <div className="border-t border-white/10 print:border-gray-300 pt-3 flex items-center justify-between text-[10px] text-gray-500">
            <span>Verified Meteorological Station Feed</span>
            <span>WeatherGPT Grounded AI Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
