"use client"

import { AlertCircle, Clock, TrendingUp } from "lucide-react"
import { typography, radius } from "@/lib/design-system"

interface RateLimitBannerProps {
  remaining: number
  total: number
  resetTime?: string
  email?: string
}

export default function RateLimitBanner({
  remaining,
  total,
  resetTime,
  email
}: RateLimitBannerProps) {
  const percentage = (remaining / total) * 100
  const isLow = percentage <= 20
  const isCritical = remaining === 0

  return (
    <div
      className={`
        p-4 ${radius.lg}
        ${isCritical
          ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
          : isLow
          ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800'
          : 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800'
        }
      `}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div
          className={`
            w-10 h-10 ${radius.lg} flex items-center justify-center flex-shrink-0
            ${isCritical
              ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
              : isLow
              ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
              : 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
            }
          `}
        >
          {isCritical ? (
            <AlertCircle className="w-5 h-5" aria-hidden="true" />
          ) : (
            <TrendingUp className="w-5 h-5" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className={`
              ${typography.h4}
              ${isCritical
                ? 'text-red-900 dark:text-red-100'
                : isLow
                ? 'text-amber-900 dark:text-amber-100'
                : 'text-blue-900 dark:text-blue-100'
              }
              mb-2
            `}
          >
            {isCritical ? 'Daily Limit Reached' : 'API Usage'}
          </h3>

          <div className="space-y-2">
            {/* Progress Bar */}
            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`
                  absolute top-0 left-0 h-full transition-all duration-500
                  ${isCritical
                    ? 'bg-red-500'
                    : isLow
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                  }
                `}
                style={{ width: `${percentage}%` }}
                role="progressbar"
                aria-valuenow={remaining}
                aria-valuemin={0}
                aria-valuemax={total}
                aria-label={`${remaining} of ${total} requests remaining`}
              />
            </div>

            <div className="flex items-center justify-between">
              <p
                className={`
                  ${typography.bodySmall}
                  ${isCritical
                    ? 'text-red-800 dark:text-red-200'
                    : isLow
                    ? 'text-amber-800 dark:text-amber-200'
                    : 'text-blue-800 dark:text-blue-200'
                  }
                `}
              >
                <span className="font-semibold">{remaining}</span> of {total} questions remaining
              </p>

              {resetTime && (
                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                  <Clock className="w-3 h-3" aria-hidden="true" />
                  <span className={typography.caption}>Resets {resetTime}</span>
                </div>
              )}
            </div>

            {isCritical && (
              <p className={`${typography.caption} text-red-700 dark:text-red-300 mt-2`}>
                You've used all your questions for today. Please try again after {resetTime || 'midnight'}.
              </p>
            )}

            {!email && isLow && (
              <p className={`${typography.caption} text-amber-700 dark:text-amber-300 mt-2`}>
                💡 Sign in to track your usage across devices and sessions
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
