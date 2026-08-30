/**
 * User-friendly error message mapping
 * Converts technical error messages into helpful, actionable messages
 */

export interface ErrorMapping {
  pattern: RegExp
  message: string
  category: 'auth' | 'rate-limit' | 'network' | 'validation' | 'server' | 'unknown'
}

const errorMappings: ErrorMapping[] = [
  // Authentication errors
  {
    pattern: /email is required|user not found|please login|not authenticated/i,
    message: 'Your session has expired. Please log in again.',
    category: 'auth'
  },
  {
    pattern: /invalid email|email.*invalid/i,
    message: 'The email address you entered is invalid. Please check and try again.',
    category: 'validation'
  },
  {
    pattern: /invalid credentials|wrong password|authentication failed/i,
    message: 'The credentials you entered are incorrect. Please try again.',
    category: 'auth'
  },

  // Rate limiting errors
  {
    pattern: /daily question limit reached|daily limit|rate limit exceeded/i,
    message: 'You\'ve reached your daily question limit. Please try again in 24 hours.',
    category: 'rate-limit'
  },
  {
    pattern: /too many requests|rate limit/i,
    message: 'Too many requests. Please wait a moment and try again.',
    category: 'rate-limit'
  },

  // Network errors
  {
    pattern: /network error|failed to fetch|network request failed/i,
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    category: 'network'
  },
  {
    pattern: /timeout|timed out/i,
    message: 'The request took too long. Please try again.',
    category: 'network'
  },

  // Validation errors
  {
    pattern: /occupation.*required|occupation.*invalid/i,
    message: 'Please enter your occupation to personalize weather responses.',
    category: 'validation'
  },
  {
    pattern: /api key.*required|api key.*invalid/i,
    message: 'At least one valid API key is required. Please check your keys and try again.',
    category: 'validation'
  },
  {
    pattern: /invalid input|validation error|field.*required/i,
    message: 'Some information is missing or invalid. Please check your input and try again.',
    category: 'validation'
  },

  // Server errors
  {
    pattern: /internal server error|500/i,
    message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
    category: 'server'
  },
  {
    pattern: /service unavailable|503/i,
    message: 'The service is temporarily unavailable. Please try again later.',
    category: 'server'
  },
  {
    pattern: /bad gateway|502/i,
    message: 'We\'re having trouble reaching our servers. Please try again.',
    category: 'server'
  },

  // Weather/Location errors
  {
    pattern: /location not found|city not found|geocoding failed/i,
    message: 'We couldn\'t find that location. Please try a different city or check the spelling.',
    category: 'validation'
  },
  {
    pattern: /weather data.*unavailable|failed to fetch weather/i,
    message: 'Weather data is temporarily unavailable for this location. Please try another location.',
    category: 'server'
  },
]

/**
 * Maps a technical error message to a user-friendly message
 */
export function mapErrorMessage(error: unknown): string {
  let errorMessage: string

  // Extract message from different error types
  if (error instanceof Error) {
    errorMessage = error.message
  } else if (typeof error === 'string') {
    errorMessage = error
  } else if (error && typeof error === 'object' && 'detail' in error) {
    const detail = (error as any).detail
    errorMessage = typeof detail === 'string' ? detail : JSON.stringify(detail)
  } else {
    errorMessage = 'An unexpected error occurred'
  }

  // Try to match against known error patterns
  for (const mapping of errorMappings) {
    if (mapping.pattern.test(errorMessage)) {
      return mapping.message
    }
  }

  // If no match found, clean up the technical message slightly
  return errorMessage
    .replace(/^\[.*?\]\s*/, '') // Remove prefix like [Error]
    .replace(/\n.*/s, '') // Keep only first line
    .trim()
}

/**
 * Gets the error category for analytics or logging
 */
export function getErrorCategory(error: unknown): ErrorMapping['category'] {
  const errorMessage = error instanceof Error ? error.message : String(error)

  for (const mapping of errorMappings) {
    if (mapping.pattern.test(errorMessage)) {
      return mapping.category
    }
  }

  return 'unknown'
}

/**
 * Checks if an error is recoverable (user can retry)
 */
export function isRecoverableError(error: unknown): boolean {
  const category = getErrorCategory(error)
  return ['network', 'server', 'rate-limit'].includes(category)
}
