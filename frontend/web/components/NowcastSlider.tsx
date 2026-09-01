"use client";

import React from "react";
import { Cloud, CloudRain, Sun, CloudLightning, Clock, ChevronRight } from "lucide-react";

export type NowcastSlot = {
  time: string;
  condition: string;
  temp: number;
  humidity: number;
  rainChance?: number;
};

type Props = {
  slots?: NowcastSlot[];
};

function renderSlotIcon(condition: string) {
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("lightning") || c.includes("storm")) {
    return <CloudLightning className="w-4 h-4 text-yellow-400" />;
  }
  if (c.includes("rain") || c.includes("drizzle")) {
    return <CloudRain className="w-4 h-4 text-sky-400" />;
  }
  if (c.includes("cloud") || c.includes("overcast")) {
    return <Cloud className="w-4 h-4 text-gray-300" />;
  }
  return <Sun className="w-4 h-4 text-yellow-400" />;
}

export default function NowcastSlider({
  slots = [
    { time: "17:30", condition: "Overcast Sky", temp: 34.7, humidity: 34 },
    { time: "20:30", condition: "Overcast Sky", temp: 33.2, humidity: 40 },
    { time: "23:30", condition: "Overcast Sky", temp: 31.7, humidity: 44 },
    { time: "02:30", condition: "Light Rain", temp: 29.5, humidity: 58, rainChance: 45 },
    { time: "05:30", condition: "Partly Cloudy", temp: 27.2, humidity: 68 },
    { time: "08:30", condition: "Mainly Clear", temp: 29.8, humidity: 55 },
  ],
}: Props) {
  return (
    <div className="mt-2.5 p-3 rounded-2xl bg-black/60 border border-white/10 font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-white/10 text-[11px] text-gray-300 font-semibold">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-yellow-400" />
          <span>3-Hourly IMD Nowcast</span>
        </div>
        <span className="text-[9px] text-yellow-400/80 uppercase">Ground Telemetry</span>
      </div>

      {/* Horizontal Scrollable Timeline */}
      <div className="mt-2 flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {slots.map((slot, idx) => (
          <div
            key={idx}
            className="flex-1 min-w-[85px] p-2 rounded-xl bg-gray-950/80 border border-white/5 flex flex-col items-center text-center text-white"
          >
            <span className="text-[10px] text-gray-400 font-bold">{slot.time}</span>
            <div className="my-1">{renderSlotIcon(slot.condition)}</div>
            <span className="text-[9px] text-gray-300 line-clamp-1 truncate max-w-[75px]">
              {slot.condition}
            </span>
            <span className="text-xs font-bold text-white mt-0.5">
              {slot.temp.toFixed(1)}°C
            </span>
            <span className="text-[9px] text-sky-300 mt-0.5">
              💧 {slot.humidity}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
