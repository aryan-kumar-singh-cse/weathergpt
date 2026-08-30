"use client"

import { AlertTriangle, AlertCircle, Info, CheckCircle } from "lucide-react"
import { getStatusClasses, typography, radius, type SeverityLevel } from "@/lib/design-system"

interface SeverityBannerProps {
  severity: SeverityLevel
  alerts: string[]
}

const severityConfig = {
  normal: {
    label: "Normal Conditions",
    icon: CheckCircle,
    show: false,
    ariaLevel: "polite" as const
  },
  watch: {
    label: "Weather Watch",
    icon: Info,
    show: true,
    ariaLevel: "polite" as const
  },
  warning: {
    label: "Weather Warning",
    icon: AlertTriangle,
    show: true,
    ariaLevel: "polite" as const
  },
  severe: {
    label: "Severe Weather Alert",
    icon: AlertTriangle,
    show: true,
    ariaLevel: "assertive" as const
  },
  extreme: {
    label: "Extreme Weather Alert",
    icon: AlertCircle,
    show: true,
    ariaLevel: "assertive" as const
  }
}

export default function SeverityBanner({ severity, alerts }: SeverityBannerProps) {
  const config = severityConfig[severity] || severityConfig.normal
  const colors = getStatusClasses(severity)

  if (!config.show || alerts.length === 0) {
    return null
  }

  const Icon = config.icon

  return (
    <div
      role="alert"
      aria-live={config.ariaLevel}
      aria-atomic="true"
      className={`
        border-l-4 p-4 sm:p-6 ${radius.lg}
        ${colors.bg} ${colors.border} ${colors.text}
        shadow-md
      `}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <Icon
          className={`w-6 h-6 mt-0.5 flex-shrink-0 ${colors.icon}`}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-3">
            <h2 className={`${typography.h4} ${colors.text}`}>
              {config.label}
            </h2>
            <span
              className={`
                inline-flex items-center ${typography.caption}
                px-2.5 py-1 ${radius.sm}
                bg-white/60 dark:bg-black/20
                border ${colors.border}
                font-medium
              `}
              aria-label={`${alerts.length} active alert${alerts.length > 1 ? 's' : ''}`}
            >
              {alerts.length} alert{alerts.length > 1 ? 's' : ''}
            </span>
          </div>
          <ul className="space-y-2" role="list">
            {alerts.map((alert, index) => (
              <li
                key={index}
                className={`${typography.bodySmall} flex items-start gap-2`}
              >
                <span
                  className={`w-1.5 h-1.5 ${radius.full} mt-2 flex-shrink-0 ${colors.icon} bg-current`}
                  aria-hidden="true"
                />
                <span className="flex-1">{alert}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}