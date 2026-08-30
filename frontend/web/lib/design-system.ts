/**
 * WeatherGPT Design System
 * Accessibility-first design tokens and utilities
 */

// Status Colors - Reserved for severity levels (not used for series)
export const statusColors = {
  good: {
    light: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-500',
      text: 'text-emerald-900',
      icon: 'text-emerald-600'
    },
    dark: {
      bg: 'dark:bg-emerald-950/30',
      border: 'dark:border-emerald-500',
      text: 'dark:text-emerald-50',
      icon: 'dark:text-emerald-400'
    }
  },
  warning: {
    light: {
      bg: 'bg-amber-50',
      border: 'border-amber-500',
      text: 'text-amber-900',
      icon: 'text-amber-600'
    },
    dark: {
      bg: 'dark:bg-amber-950/30',
      border: 'dark:border-amber-500',
      text: 'dark:text-amber-50',
      icon: 'dark:text-amber-400'
    }
  },
  serious: {
    light: {
      bg: 'bg-orange-50',
      border: 'border-orange-600',
      text: 'text-orange-900',
      icon: 'text-orange-600'
    },
    dark: {
      bg: 'dark:bg-orange-950/30',
      border: 'dark:border-orange-500',
      text: 'dark:text-orange-50',
      icon: 'dark:text-orange-400'
    }
  },
  critical: {
    light: {
      bg: 'bg-red-50',
      border: 'border-red-600',
      text: 'text-red-900',
      icon: 'text-red-600'
    },
    dark: {
      bg: 'dark:bg-red-950/30',
      border: 'dark:border-red-600',
      text: 'dark:text-red-50',
      icon: 'dark:text-red-400'
    }
  }
} as const

// Severity level mapping
export type SeverityLevel = 'normal' | 'watch' | 'warning' | 'severe' | 'extreme'
export type StatusLevel = 'good' | 'warning' | 'serious' | 'critical'

export const severityToStatus: Record<SeverityLevel, StatusLevel> = {
  normal: 'good',
  watch: 'warning',
  warning: 'warning',
  severe: 'serious',
  extreme: 'critical'
}

// Typography Scale
export const typography = {
  display: 'text-7xl font-bold leading-none tracking-tight',
  h1: 'text-4xl font-bold leading-tight',
  h2: 'text-2xl font-semibold leading-tight',
  h3: 'text-xl font-semibold leading-snug',
  h4: 'text-lg font-semibold leading-snug',
  body: 'text-base leading-relaxed',
  bodySmall: 'text-sm leading-relaxed',
  caption: 'text-xs leading-normal',
  label: 'text-sm font-medium leading-none'
} as const

// Spacing Scale (consistent 8px grid)
export const spacing = {
  xs: '0.5rem',   // 8px
  sm: '0.75rem',  // 12px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
  '3xl': '4rem'   // 64px
} as const

// Border Radius
export const radius = {
  sm: 'rounded-lg',      // 8px
  md: 'rounded-xl',      // 12px
  lg: 'rounded-2xl',     // 16px
  full: 'rounded-full'
} as const

// Shadows
export const shadows = {
  sm: 'shadow-sm',
  md: 'shadow-md',
  lg: 'shadow-lg',
  xl: 'shadow-xl'
} as const

// Interactive States
export const interactive = {
  focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-blue-400 dark:focus:ring-offset-gray-900',
  hover: 'hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200',
  active: 'active:scale-98 transition-transform duration-100',
  disabled: 'disabled:opacity-50 disabled:cursor-not-allowed'
} as const

// Accessibility Utilities
export const a11y = {
  srOnly: 'sr-only',
  focusVisible: 'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
  ariaLive: {
    polite: 'aria-live="polite"',
    assertive: 'aria-live="assertive"'
  }
} as const

// Get status color classes by severity
export function getStatusColors(severity: SeverityLevel, mode: 'light' | 'dark' = 'light') {
  const status = severityToStatus[severity]
  return statusColors[status][mode]
}

// Get combined status classes (light + dark)
export function getStatusClasses(severity: SeverityLevel) {
  const status = severityToStatus[severity]
  const light = statusColors[status].light
  const dark = statusColors[status].dark

  return {
    bg: `${light.bg} ${dark.bg}`,
    border: `${light.border} ${dark.border}`,
    text: `${light.text} ${dark.text}`,
    icon: `${light.icon} ${dark.icon}`
  }
}

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
} as const

// Animation durations
export const durations = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms'
} as const

// Glass effect utility
export const glass = {
  light: 'bg-white/70 backdrop-blur-lg border border-gray-200/50',
  dark: 'dark:bg-gray-900/70 dark:backdrop-blur-lg dark:border-white/10'
} as const

export function getGlassClasses() {
  return `${glass.light} ${glass.dark}`
}
