/**
 * Input validation utilities for production-ready forms
 */

export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validates email address format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' }
  }

  const trimmedEmail = email.trim()

  // Basic length check
  if (trimmedEmail.length < 3 || trimmedEmail.length > 254) {
    return { isValid: false, error: 'Email must be between 3 and 254 characters' }
  }

  // RFC 5322 simplified email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }

  // Check for common typos
  const commonTypos = ['@gmial.com', '@gmai.com', '@yahooo.com', '@hotmial.com']
  if (commonTypos.some(typo => trimmedEmail.endsWith(typo))) {
    return { isValid: false, error: 'Email domain appears to be misspelled' }
  }

  return { isValid: true }
}

/**
 * Validates occupation field
 */
export function validateOccupation(occupation: string): ValidationResult {
  if (!occupation || occupation.trim().length === 0) {
    return { isValid: false, error: 'Occupation is required' }
  }

  const trimmedOccupation = occupation.trim()

  if (trimmedOccupation.length < 2) {
    return { isValid: false, error: 'Occupation must be at least 2 characters' }
  }

  if (trimmedOccupation.length > 100) {
    return { isValid: false, error: 'Occupation must be less than 100 characters' }
  }

  // Check for obvious spam/invalid input
  const hasOnlySpecialChars = /^[^a-zA-Z0-9\s]+$/.test(trimmedOccupation)
  if (hasOnlySpecialChars) {
    return { isValid: false, error: 'Please enter a valid occupation' }
  }

  return { isValid: true }
}

/**
 * Validates API key format (basic check)
 */
export function validateApiKey(key: string, provider: 'groq' | 'gemini'): ValidationResult {
  if (!key || key.trim().length === 0) {
    return { isValid: true } // API keys are optional
  }

  const trimmedKey = key.trim()

  // Provider-specific validation
  if (provider === 'groq') {
    if (!trimmedKey.startsWith('gsk_')) {
      return { isValid: false, error: 'Groq API key should start with "gsk_"' }
    }
    if (trimmedKey.length < 20) {
      return { isValid: false, error: 'Groq API key appears to be too short' }
    }
  }

  if (provider === 'gemini') {
    if (!trimmedKey.startsWith('AIza') && !trimmedKey.startsWith('AQ')) {
      return { isValid: false, error: 'Gemini API key should start with "AIza" or "AQ"' }
    }
    if (trimmedKey.length < 30) {
      return { isValid: false, error: 'Gemini API key appears to be too short' }
    }
  }

  return { isValid: true }
}
