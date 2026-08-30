# Component Implementation Guide

## Overview

This guide covers the enhanced WeatherGPT components built with accessibility-first design principles.

## Component Architecture

### New Components

1. **LoginCard** - User authentication with email + occupation
2. **EnhancedWeatherCard** - Redesigned weather display with better data visualization
3. **EnhancedChatInterface** - Chat with voice integration and rate limiting
4. **RateLimitBanner** - API usage visualization
5. **SeverityBanner** - Enhanced alert display with proper ARIA

### Updated Components

1. **VoiceInput** - Improved accessibility and error handling
2. **VoiceOutput** - Text-to-speech with proper ARIA labels

## Component Details

### LoginCard

**Location**: `/components/LoginCard.tsx`

**Purpose**: Collect user email and occupation for personalized weather insights.

**Props**:
```typescript
interface LoginCardProps {
  onLoginSuccess: (email: string, occupation: string) => void
}
```

**Features**:
- Form validation (email format, required fields)
- Occupation selection with predefined options
- Error handling with visual + ARIA feedback
- Loading states
- LocalStorage persistence
- Privacy messaging

**Accessibility**:
- Proper label associations
- Error announcements via aria-describedby
- aria-invalid on error states
- Disabled state handling
- Focus management

**Usage**:
```tsx
<LoginCard onLoginSuccess={(email, occupation) => {
  // Handle successful login
  console.log(`Logged in: ${email} as ${occupation}`)
}} />
```

---

### EnhancedWeatherCard

**Location**: `/components/EnhancedWeatherCard.tsx`

**Purpose**: Display current weather with prominent metrics and visual hierarchy.

**Props**:
```typescript
interface WeatherCardProps {
  weather: Weather | null
  isLoading: boolean
}
```

**Features**:
- Hero temperature display with gradient background
- 6 metric cards with color-coded categories
- UV index with severity labels
- Responsive grid (2 cols mobile, 3 cols tablet+)
- Loading and empty states
- Last updated timestamp

**Accessibility**:
- Semantic regions (role="region")
- Group labels for metrics (role="group")
- Icon aria-hidden with text labels
- Screen reader optimized structure
- Time element for timestamps

**Data Visualization**:
- Each metric has dedicated color gradient
- Icons paired with every value
- No color-only information
- Clear hierarchy (hero → metrics)

---

### EnhancedChatInterface

**Location**: `/components/EnhancedChatInterface.tsx`

**Purpose**: Conversational weather queries with voice support and rate limiting.

**Props**:
```typescript
interface EnhancedChatInterfaceProps {
  location: string
  role: string
  language: string
  email?: string
}
```

**Features**:
- Message history with user/assistant distinction
- Voice input integration (VoiceInput component)
- Voice output for responses (VoiceOutput component)
- Rate limit display and enforcement
- Error handling with retry logic
- Metadata display (LLM tier, intent, severity)
- Auto-scroll to latest message
- Loading indicator (typing animation)

**Accessibility**:
- Message log with role="log"
- aria-live regions for dynamic updates
- Focus management (returns to input after send)
- Keyboard shortcuts (Enter to send)
- Screen reader announcements for state changes
- Disabled state for rate-limited users

**Rate Limiting**:
- Displays remaining questions
- Warning at ≤ 5 remaining
- Error state at 0 remaining
- Reset time display
- Prevents sending when limited

---

### RateLimitBanner

**Location**: `/components/RateLimitBanner.tsx`

**Purpose**: Visual representation of API usage quota.

**Props**:
```typescript
interface RateLimitBannerProps {
  remaining: number
  total: number
  resetTime?: string
  email?: string
}
```

**Features**:
- Progress bar visualization
- Three states: normal, low (≤20%), critical (0)
- Color-coded by urgency
- Reset time display
- Sign-in prompt for anonymous users

**Accessibility**:
- role="status" with aria-live="polite"
- Progress bar with proper ARIA attributes
- Icon + text + color redundancy
- Clear messaging for each state

**Visual States**:
```
Normal (>20%):    Blue, TrendingUp icon
Low (≤20%):       Amber, AlertCircle icon
Critical (0):     Red, AlertCircle icon
```

---

### SeverityBanner (Enhanced)

**Location**: `/components/SeverityBanner.tsx`

**Purpose**: Display weather alerts with appropriate urgency.

**Props**:
```typescript
interface SeverityBannerProps {
  severity: SeverityLevel  // 'normal' | 'warning' | 'severe' | 'extreme'
  alerts: string[]
}
```

**Improvements**:
- Uses design system colors (getStatusClasses)
- Different aria-live levels per severity
  - normal: hidden
  - warning: polite
  - severe: assertive
  - extreme: assertive
- Responsive layout (stacked on mobile)
- Alert count badge
- List semantics for multiple alerts

**Accessibility**:
- role="alert" with aria-live
- aria-atomic="true" for complete announcements
- Icon aria-hidden with text label
- role="list" for alerts
- Proper heading hierarchy

---

### VoiceInput (Enhanced)

**Location**: `/components/VoiceInput.tsx`

**Purpose**: Speech-to-text input for accessibility and convenience.

**Props**:
```typescript
interface VoiceInputProps {
  onTranscription: (text: string) => void
  language?: string
  disabled?: boolean
}
```

**Improvements**:
- Enhanced ARIA labels describing current state
- aria-pressed for toggle state
- Error messages in proper alert role
- Design system integration (radius, interactive)
- Better visual feedback (ping indicator)
- Screen reader announcements

**States**:
1. **Idle**: Gray mic icon, hover effect
2. **Recording**: Red background, pulsing, mic-off icon, ping animation
3. **Processing**: Spinning loader
4. **Error**: Floating alert with icon + message
5. **Unsupported**: Disabled with explanation

**Browser Support**:
- Checks for MediaDevices API
- Graceful degradation
- Clear messaging for unsupported browsers

---

### VoiceOutput (Enhanced)

**Location**: `/components/VoiceOutput.tsx` (exported from VoiceInput)

**Purpose**: Text-to-speech for assistant responses.

**Props**:
```typescript
interface VoiceOutputProps {
  text: string
  language?: string
  autoPlay?: boolean
}
```

**Features**:
- Speech synthesis with language mapping
- Play/stop toggle
- Visual feedback (blue when speaking)
- Auto-play option (disabled by default)
- Rate and pitch control

**Accessibility**:
- aria-label describes action and state
- aria-pressed indicates active state
- Button semantics
- Keyboard accessible

**Language Support**:
```typescript
en → en-IN, hi → hi-IN, ta → ta-IN, etc.
```

---

## Integration Example

```tsx
"use client"

import { useState } from "react"
import LoginCard from "@/components/LoginCard"
import EnhancedWeatherCard from "@/components/EnhancedWeatherCard"
import EnhancedChatInterface from "@/components/EnhancedChatInterface"
import SeverityBanner from "@/components/SeverityBanner"
import RateLimitBanner from "@/components/RateLimitBanner"

export default function WeatherPage() {
  const [user, setUser] = useState<{email: string, occupation: string} | null>(null)
  const [weather, setWeather] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [severity, setSeverity] = useState('normal')
  const [rateLimit, setRateLimit] = useState({ remaining: 50, total: 50 })

  if (!user) {
    return <LoginCard onLoginSuccess={(email, occupation) => 
      setUser({ email, occupation })
    } />
  }

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SeverityBanner severity={severity} alerts={alerts} />
          <EnhancedWeatherCard weather={weather} isLoading={false} />
        </div>
        
        <div className="space-y-6">
          <RateLimitBanner 
            remaining={rateLimit.remaining} 
            total={rateLimit.total}
            email={user.email}
          />
          <EnhancedChatInterface
            location="Mumbai"
            role={user.occupation}
            language="en"
            email={user.email}
          />
        </div>
      </div>
    </div>
  )
}
```

## Testing Checklist

### For Each Component:

**Keyboard Navigation**:
- [ ] Tab order is logical
- [ ] Focus visible on all interactive elements
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dropdowns

**Screen Reader**:
- [ ] All content announced
- [ ] Images have alt text or aria-label
- [ ] Form fields have labels
- [ ] Errors announced
- [ ] Loading states announced

**Visual**:
- [ ] Color contrast ≥ 4.5:1
- [ ] Focus indicators visible
- [ ] Text resizable to 200%
- [ ] No horizontal scroll on mobile
- [ ] Touch targets ≥ 44×44px

**Responsive**:
- [ ] Mobile (320px+)
- [ ] Tablet (768px+)
- [ ] Desktop (1024px+)
- [ ] Portrait and landscape

**Dark Mode**:
- [ ] All colors have dark variants
- [ ] Contrast maintained
- [ ] No white backgrounds bleeding through

## Performance Optimization

### Code Splitting

```tsx
import dynamic from 'next/dynamic'

const VoiceInput = dynamic(() => import('@/components/VoiceInput'), {
  ssr: false,  // Voice APIs not available server-side
  loading: () => <div>Loading voice controls...</div>
})
```

### Lazy Loading

```tsx
import { lazy, Suspense } from 'react'

const EnhancedChatInterface = lazy(() => 
  import('@/components/EnhancedChatInterface')
)

<Suspense fallback={<ChatSkeleton />}>
  <EnhancedChatInterface {...props} />
</Suspense>
```

### Memoization

```tsx
import { memo } from 'react'

export default memo(EnhancedWeatherCard, (prev, next) => 
  prev.weather?.temperature === next.weather?.temperature &&
  prev.isLoading === next.isLoading
)
```

## Common Patterns

### Error Handling

```tsx
{error && (
  <div
    role="alert"
    aria-live="polite"
    className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200"
  >
    <div className="flex items-start gap-2">
      <AlertCircle className="w-4 h-4 text-red-600" aria-hidden="true" />
      <span className="text-sm text-red-800 dark:text-red-200">{error}</span>
    </div>
  </div>
)}
```

### Loading States

```tsx
{isLoading ? (
  <div role="status" aria-label="Loading">
    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    <span className="sr-only">Loading...</span>
  </div>
) : (
  <Content />
)}
```

### Empty States

```tsx
{!data && !isLoading && (
  <div className="text-center p-8">
    <Icon className="w-12 h-12 text-gray-400 mx-auto mb-3" aria-hidden="true" />
    <p className="text-gray-600 dark:text-gray-400">
      No data available. Select a location to begin.
    </p>
  </div>
)}
```

---

**Last Updated**: 2026-08-29  
**Version**: 1.0.0
