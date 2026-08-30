"use client"

import React from "react"
import { User, Tractor, Plane, AlertTriangle } from "lucide-react"
import { useTranslation } from "@/lib/i18n"

interface RoleSelectorProps {
  value: string
  onChange: (role: string) => void
}

export default function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const { t } = useTranslation()

  const roles = [
    {
      id: "citizen",
      label: t("role_citizen"),
      icon: User,
      desc: t("role_citizen_desc"),
    },
    {
      id: "farmer",
      label: t("role_farmer"),
      icon: Tractor,
      desc: t("role_farmer_desc"),
    },
    {
      id: "pilot",
      label: t("role_pilot"),
      icon: Plane,
      desc: t("role_pilot_desc"),
    },
    {
      id: "disaster-manager",
      label: t("role_emergency"),
      icon: AlertTriangle,
      desc: t("role_emergency_desc"),
    },
  ]

  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-4 border border-gray-200 dark:border-yellow-500/20 shadow-xl space-y-3">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
        Response Mode
      </div>
      <div className="grid grid-cols-2 gap-2">
        {roles.map((role) => {
          const Icon = role.icon
          const isActive = value === role.id

          return (
            <button
              key={role.id}
              type="button"
              onClick={() => onChange(role.id)}
              className={`p-3 rounded-2xl text-left transition-all border ${
                isActive
                  ? "bg-yellow-400 border-yellow-500 text-black shadow-lg font-bold scale-[1.02]"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60"
              }`}
              title={role.desc}
            >
              <Icon className="w-5 h-5 mb-1 text-inherit" />
              <div className="text-xs">{role.label}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
