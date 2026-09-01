"use client";

import React from "react";
import { Sun, Moon } from "lucide-react";

type Props = {
  sunrise?: string;
  sunset?: string;
  moonrise?: string;
  moonset?: string;
  moonPhase?: string;
};

export default function SunMoonArcCard({
  sunrise = "05:58",
  sunset = "18:43",
  moonrise = "21:00",
  moonset = "09:49",
  moonPhase = "Waxing Gibbous",
}: Props) {
  // Compute current solar progress across 0-100% arc
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Approximate 05:58 to 18:43 in minutes
  const sunriseMin = 5 * 60 + 58;
  const sunsetMin = 18 * 60 + 43;
  const dayLength = sunsetMin - sunriseMin;
  
  let sunProgressPercent = 0.5;
  if (currentMinutes >= sunriseMin && currentMinutes <= sunsetMin) {
    sunProgressPercent = (currentMinutes - sunriseMin) / dayLength;
  } else if (currentMinutes > sunsetMin) {
    sunProgressPercent = 1;
  }

  // Calculate sun dot on SVG semi-circle (radius = 50, center = 60, 55)
  const angle = Math.PI * (1 - sunProgressPercent);
  const sunX = 60 + 45 * Math.cos(angle);
  const sunY = 55 - 45 * Math.sin(angle);

  // Lunar progress
  const moonProgressPercent = 0.75;
  const moonAngle = Math.PI * (1 - moonProgressPercent);
  const moonX = 60 + 45 * Math.cos(moonAngle);
  const moonY = 55 - 45 * Math.sin(moonAngle);

  return (
    <div className="grid grid-cols-2 gap-2 mt-3 font-mono">
      {/* ☀️ Sun Arc Card */}
      <div className="p-3 rounded-2xl bg-black/60 border border-yellow-400/20 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-semibold">
          <Sun className="w-3.5 h-3.5" />
          <span>Sun</span>
        </div>

        {/* Curved Solar Arc SVG */}
        <div className="my-1 flex justify-center items-center">
          <svg viewBox="0 0 120 65" className="w-full h-16">
            {/* Background dashed/colored arc */}
            <path
              d="M 15 55 A 45 45 0 0 1 105 55"
              fill="none"
              stroke="#ca8a04"
              strokeWidth="2.5"
              strokeDasharray="2 2"
              opacity="0.4"
            />
            {/* Active Sun glow path */}
            <path
              d="M 15 55 A 45 45 0 0 1 105 55"
              fill="none"
              stroke="url(#sunGradient)"
              strokeWidth="3"
            />
            {/* Sun position marker */}
            <circle cx={sunX} cy={sunY} r="4.5" fill="#facc15" className="animate-pulse" />
            <circle cx={sunX} cy={sunY} r="7" fill="none" stroke="#facc15" strokeWidth="1" opacity="0.6" />

            <defs>
              <linearGradient id="sunGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#eab308" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[10px] text-gray-300 font-mono">
          <div>
            <span className="text-white font-bold block">{sunrise}</span>
            <span className="text-[8px] text-gray-500">IST (Rise)</span>
          </div>
          <div className="text-right">
            <span className="text-white font-bold block">{sunset}</span>
            <span className="text-[8px] text-gray-500">IST (Set)</span>
          </div>
        </div>
      </div>

      {/* 🌙 Moon Arc Card */}
      <div className="p-3 rounded-2xl bg-black/60 border border-cyan-400/20 flex flex-col justify-between relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-cyan-300 font-semibold">
          <div className="flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5" />
            <span>Moon</span>
          </div>
        </div>

        {/* Curved Lunar Arc SVG */}
        <div className="my-1 flex justify-center items-center">
          <svg viewBox="0 0 120 65" className="w-full h-16">
            <path
              d="M 15 55 A 45 45 0 0 1 105 55"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="2 2"
              opacity="0.3"
            />
            <path
              d="M 15 55 A 45 45 0 0 1 105 55"
              fill="none"
              stroke="url(#moonGradient)"
              strokeWidth="3"
            />
            {/* Moon position marker */}
            <circle cx={moonX} cy={moonY} r="4.5" fill="#38bdf8" className="animate-pulse" />
            <circle cx={moonX} cy={moonY} r="7" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />

            <defs>
              <linearGradient id="moonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="50%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[10px] text-gray-300 font-mono">
          <div>
            <span className="text-white font-bold block">{moonrise}</span>
            <span className="text-[8px] text-gray-500">IST (Rise)</span>
          </div>
          <div className="text-right">
            <span className="text-white font-bold block">{moonset}</span>
            <span className="text-[8px] text-gray-500">IST (Set)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
