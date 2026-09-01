"use client";

import React from "react";
import { AlertTriangle, MapPin, ShieldAlert, CheckCircle2 } from "lucide-react";

type Props = {
  city: string;
  warning?: string;
  severity?: "yellow" | "orange" | "red" | "green";
  issueDate?: string;
  validUntil?: string;
  onDismiss?: () => void;
};

export default function ImdNowcastBanner({
  city,
  warning = "Thunder with Lightning and Light to Moderate Rain",
  severity = "yellow",
  issueDate = "01 Sep 2026, 05:30 PM",
  validUntil = "08:30 PM IST",
  onDismiss,
}: Props) {
  if (!warning || severity === "green") {
    return null;
  }

  const isYellow = severity === "yellow";
  const isOrange = severity === "orange";
  const isRed = severity === "red";

  const borderColor = isRed
    ? "border-red-500/50 bg-red-950/80"
    : isOrange
    ? "border-amber-500/50 bg-amber-950/80"
    : "border-yellow-400/50 bg-yellow-950/70";

  const titleColor = isRed
    ? "text-red-400"
    : isOrange
    ? "text-amber-400"
    : "text-yellow-400";

  const badgeColor = isRed
    ? "bg-red-500 text-white"
    : isOrange
    ? "bg-amber-500 text-black"
    : "bg-yellow-400 text-black font-bold";

  return (
    <div
      className={`mt-2.5 p-3 rounded-2xl border ${borderColor} backdrop-blur-xl text-white shadow-xl animate-fade-in font-mono`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <MapPin className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
            {city.split(",")[0] || "Active District"}
          </span>
        </div>
        <span className={`text-[9px] px-2 py-0.5 rounded-full ${badgeColor} uppercase tracking-wider`}>
          IMD Nowcast
        </span>
      </div>

      <div className="mt-1.5 flex items-start gap-2">
        <AlertTriangle className={`w-4 h-4 ${titleColor} shrink-0 mt-0.5`} />
        <p className="text-xs font-semibold text-gray-100 leading-snug">
          {warning}
        </p>
      </div>

      <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[9px] text-gray-400">
        <span>Issued: {issueDate}</span>
        <span className="font-semibold text-yellow-300">Valid: {validUntil}</span>
      </div>
    </div>
  );
}
