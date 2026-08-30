# WeatherGPT Design System

## Overview

The WeatherGPT design system is built with accessibility-first principles, following WCAG 2.1 AA guidelines. It provides a consistent, scalable foundation for all UI components.

## Core Principles

1. **Accessibility First**: Every component meets WCAG 2.1 AA standards
2. **Semantic Color**: Colors convey meaning through multiple channels (icon + text + color)
3. **Responsive**: Mobile-first design that scales elegantly
4. **Dark Mode Native**: Both themes validated independently
5. **Performance**: Optimized for low-bandwidth scenarios

## Color System

### Status Colors (Reserved)

Status colors are **never** used for generic UI elements or series identification. They are reserved exclusively for severity levels and system states.

```typescript
// Severity Mapping
normal → good (emerald)
warning → warning (amber)
severe → serious (orange)
extreme → critical (red)
```

#### Usage Rules

- **Always** pair with an icon (CheckCircle, AlertTriangle, AlertCircle)
- **Always** include text label (not color-only)
- **Never** use for series/category differentiation
- Validated for colorblind safety (CVD Delta E ≥ 8)

### Light Mode Palette

```
Good:      Emerald-50 bg, Emerald-500 border, Emerald-900 text
Warning:   Amber-50 bg, Amber-500 border, Amber-900 text
Serious:   Orange-50 bg, Orange-600 border, Orange-900 text
Critical:  Red-50 bg, Red-600 border, Red-900 text
```

### Dark Mode Palette

```
Good:      Emerald-950/30 bg, Emerald-500 border, Emerald-50 text
Warning:   Amber-950/30 bg, Amber-500 border, Amber-50 text
Serious:   Orange-950/30 bg, Orange-500 border, Orange-50 text
Critical:  Red-950/30 bg, Red-600 border, Red-50 text
```

## Typography Scale

All type uses a consistent scale with proper line heights for readability:

```typescript
display:    text-7xl font-bold       // Hero numbers (72°)
h1:         text-4xl font-bold       // Page titles
h2:         text-2xl font-semibold   // Section headers
h3:         text-xl font-semibold    // Card titles
h4:         text-lg font-semibold    // Subsection headers
body:       text-base                // Body text (16px)
bodySmall:  text-sm                  // Secondary text (14px)
caption:    text-xs                  // Meta info (12px)
label:      text-sm font-medium      // Form labels
```

## Spacing System

8px grid system for consistent rhythm:

```
xs:   8px    (0.5rem)
sm:   12px   (0.75rem)
md:   16px   (1rem)
lg:   24px   (1.5rem)
xl:   32px   (2rem)
2xl:  48px   (3rem)
3xl:  64px   (4rem)
```

## Border Radius

Consistent rounding creates visual harmony:

```
sm:   rounded-lg    (8px)   // Small elements, badges
md:   rounded-xl    (12px)  // Inputs, buttons
lg:   rounded-2xl   (16px)  // Cards, panels
full: rounded-full          // Pills, voice buttons
```

## Interactive States

### Focus

All interactive elements use visible focus rings:

```css
focus:outline-none 
focus:ring-2 
focus:ring-blue-500 
focus:ring-offset-2
```

- Ring width: 2px
- Ring color: Blue-500 (both themes)
- Offset: 2px for clear separation

### Hover

Subtle background changes indicate interactivity:

```css
hover:bg-gray-100 
dark:hover:bg-gray-800
```

### Active

Scale feedback for button presses:

```css
active:scale-98
```

### Disabled

Reduced opacity + cursor change:

```css
disabled:opacity-50 
disabled:cursor-not-allowed
```

## Component Patterns

### Severity Banner

**Purpose**: Display weather alerts with appropriate urgency

**Accessibility Features**:
- `role="alert"` for critical/severe levels
- `aria-live="assertive"` for extreme
- `aria-live="polite"` for warnings
- Icon + text + color (redundant encoding)
- Responsive text sizing

**Visual Structure**:
```
┌─ [Icon] ────────────────────┐
│  [Severity Label] [N alerts]│
│  • Alert message 1          │
│  • Alert message 2          │
└─────────────────────────────┘
```

### Voice Input

**Purpose**: Enable speech-to-text input

**Accessibility Features**:
- `aria-label` describes current state
- `aria-pressed` for recording state
- Visual + text + aria-live feedback
- Error messages in accessible alerts

**States**:
1. Idle: Mic icon, gray
2. Recording: MicOff icon, red, pulsing, with ping indicator
3. Processing: Loader, animation
4. Error: Alert with icon + message
5. Unsupported: MicOff, disabled, tooltip

### Rate Limit Banner

**Purpose**: Show API usage without disrupting flow

**Accessibility Features**:
- `role="status"` with `aria-live="polite"`
- Progress bar with `role="progressbar"` + aria values
- Icon changes based on severity
- Color + icon + text redundancy

**Thresholds**:
- Normal: > 20% remaining (blue)
- Low: ≤ 20% remaining (amber)
- Critical: 0 remaining (red)

### Enhanced Chat Interface

**Purpose**: Conversational weather queries

**Accessibility Features**:
- `role="log"` for message container
- Each message has proper heading structure
- Voice output available for all responses
- Keyboard shortcuts (Enter to send)
- Focus management (returns to input after send)
- Status announcements via aria-live

## Responsive Breakpoints

```
sm:   640px   // Small tablets
md:   768px   // Tablets
lg:   1024px  // Laptops
xl:   1280px  // Desktops
2xl:  1536px  // Large screens
```

### Mobile-First Approach

- Touch targets ≥ 44×44px
- One-handed reach zones
- Horizontal scrolling avoided
- Collapsible navigation
- Stacked layouts on mobile

## Dark Mode

Both themes are designed and validated independently:

1. Color palettes validated for contrast in each theme
2. Different surface colors (not inverted)
3. Icon colors adjusted per theme
4. Shadows reduced in dark mode
5. Border opacity lowered in dark mode

## Accessibility Checklist

### Every Component Must Have:

- [ ] Proper ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Focus indicators (2px ring)
- [ ] Color + icon/text redundancy
- [ ] Appropriate heading hierarchy
- [ ] Touch targets ≥ 44×44px
- [ ] Error messages with icons
- [ ] Loading states announced
- [ ] Dark mode support

### Testing Requirements:

- [ ] Keyboard-only navigation
- [ ] Screen reader testing (VoiceOver/NVDA)
- [ ] Color contrast validation (4.5:1 minimum)
- [ ] Mobile device testing
- [ ] Reduced motion preferences
- [ ] Browser zoom to 200%

## Performance Guidelines

1. **Bundle Optimization**: Code splitting for routes
2. **Image Optimization**: WebP with fallbacks
3. **Critical CSS**: Inline above-the-fold styles
4. **Lazy Loading**: Below-fold components
5. **Font Loading**: Subset fonts, font-display: swap

## Usage Example

```tsx
import { typography, interactive, radius, getStatusClasses } from '@/lib/design-system'

function MyComponent({ severity }) {
  const colors = getStatusClasses(severity)
  
  return (
    <div className={`
      ${colors.bg} ${colors.border} ${colors.text}
      ${radius.lg} p-4
      ${interactive.focus}
    `}>
      <h2 className={typography.h2}>Alert</h2>
      <p className={typography.body}>Message</p>
    </div>
  )
}
```

## Design System Utilities

Located in `/lib/design-system.ts`:

- `getStatusClasses(severity)` - Returns color classes for severity level
- `severityToStatus` - Maps severity to status color
- `statusColors` - Complete color palette
- `typography` - Text styles
- `interactive` - Interactive states
- `radius`, `spacing`, `shadows` - Layout utilities

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

---

**Last Updated**: 2026-08-29  
**Version**: 1.0.0  
**Maintainer**: Frontend Development Team
