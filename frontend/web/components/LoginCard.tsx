'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { validateEmail, validateOccupation, validateApiKey } from '@/lib/validation';
import { mapErrorMessage } from '@/lib/error-messages';

interface LoginCardProps {
  onLoginSuccess: (email: string, occupation: string) => void;
}

export default function LoginCard({ onLoginSuccess }: LoginCardProps) {
  const [step, setStep] = useState<'email' | 'details'>('email');
  const [email, setEmail] = useState('');
  const [occupation, setOccupation] = useState('');
  const [groqApiKey, setGroqApiKey] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Invalid email');
      return;
    }

    setIsLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

      // Check if user exists in backend
      const response = await fetch(`${API_URL}/login/status?email=${encodeURIComponent(email.trim().toLowerCase())}`);

      if (response.ok) {
        // User exists - get their details and log them in directly
        const data = await response.json();

        // Store credentials AND API keys in localStorage
        localStorage.setItem('weathergpt_email', data.email);
        localStorage.setItem('weathergpt_occupation', data.occupation);

        // Store API keys if they exist
        if (data.groq_api_key) {
          localStorage.setItem('weathergpt_groq_key', data.groq_api_key);
        }
        if (data.gemini_api_key) {
          localStorage.setItem('weathergpt_gemini_key', data.gemini_api_key);
        }

        // Go directly to chat - skip registration form
        onLoginSuccess(data.email, data.occupation);
      } else if (response.status === 404) {
        // New user - show registration fields
        setStep('details');
      } else {
        // Other error (500, network, etc.)
        const errorData = await response.json().catch(() => ({ detail: 'Failed to check user status' }));
        throw new Error(errorData.detail || 'Failed to check user status');
      }
    } catch (err) {
      console.error('Email check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate occupation
    const occupationValidation = validateOccupation(occupation);
    if (!occupationValidation.isValid) {
      setError(occupationValidation.error || 'Invalid occupation');
      return;
    }

    // Validate at least one API key is provided
    if (!groqApiKey && !geminiApiKey) {
      setError('At least one API key is required');
      return;
    }

    // Validate API keys if provided
    if (groqApiKey) {
      const groqValidation = validateApiKey(groqApiKey, 'groq');
      if (!groqValidation.isValid) {
        setError(groqValidation.error || 'Invalid Groq API key');
        return;
      }
    }

    if (geminiApiKey) {
      const geminiValidation = validateApiKey(geminiApiKey, 'gemini');
      if (!geminiValidation.isValid) {
        setError(geminiValidation.error || 'Invalid Gemini API key');
        return;
      }
    }

    setIsLoading(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          occupation,
          groq_api_key: groqApiKey || undefined,
          gemini_api_key: geminiApiKey || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const errorMessage = typeof data.detail === 'string'
          ? data.detail
          : Array.isArray(data.detail)
            ? data.detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
            : 'Registration failed';
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Store credentials AND API keys in localStorage
      localStorage.setItem('weathergpt_email', email);
      localStorage.setItem('weathergpt_occupation', occupation);

      // Store API keys for future requests
      if (groqApiKey) {
        localStorage.setItem('weathergpt_groq_key', groqApiKey);
      }
      if (geminiApiKey) {
        localStorage.setItem('weathergpt_gemini_key', geminiApiKey);
      }

      onLoginSuccess(email, occupation);
    } catch (err) {
      console.error('Registration error:', err);
      setError(mapErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
      <Card className="w-full max-w-md mx-4 shadow-2xl border-gray-200 dark:border-yellow-500/20">
        <CardHeader className="space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-yellow-500/20">
              <svg className="w-9 h-9 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-black dark:text-white">
            Welcome to WeatherGPT
          </CardTitle>
          <CardDescription className="text-center text-gray-600 dark:text-gray-400">
            {step === 'email'
              ? 'Enter your email to get started'
              : 'Complete your profile to continue'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'email' ? (
            // Step 1: Email Check
            <form onSubmit={handleEmailCheck} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoFocus
                  aria-describedby={error ? "email-error" : undefined}
                  aria-invalid={error ? "true" : "false"}
                />
              </div>

              {error && (
                <div
                  id="email-error"
                  className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold shadow-lg hover:shadow-xl transition-all" disabled={isLoading}>
                {isLoading ? 'Checking...' : 'Continue'}
              </Button>
            </form>
          ) : (
            // Step 2: New User Registration
            <form onSubmit={handleRegistration} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-display">Email</Label>
                <Input
                  id="email-display"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                />
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-xs text-yellow-600 dark:text-yellow-400 hover:underline focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1 rounded"
                >
                  Change email
                </button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  type="text"
                  placeholder="e.g., Rice farmer in Punjab, Pilot, Student"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  required
                  disabled={isLoading}
                  autoFocus
                  aria-describedby="occupation-description"
                />
                <p id="occupation-description" className="text-xs text-gray-500 dark:text-gray-400">
                  We use this to personalize weather responses for your needs
                </p>
              </div>

              <div className="pt-2 pb-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Your API Keys (at least one required)
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  These are YOUR OWN free API keys that will be stored securely. WeatherGPT uses them to provide AI-powered responses.
                </p>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="groqApiKey">Groq API Key (Optional)</Label>
                    <Input
                      id="groqApiKey"
                      type="password"
                      placeholder="gsk_..."
                      value={groqApiKey}
                      onChange={(e) => setGroqApiKey(e.target.value)}
                      disabled={isLoading}
                      aria-describedby="groq-key-help"
                    />
                    <p id="groq-key-help" className="text-xs text-yellow-600 dark:text-yellow-400">
                      Get free key at{' '}
                      <a
                        href="https://console.groq.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-yellow-700 dark:hover:text-yellow-300"
                      >
                        console.groq.com
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="geminiApiKey">Gemini API Key (Optional)</Label>
                    <Input
                      id="geminiApiKey"
                      type="password"
                      placeholder="AIza... or AQ..."
                      value={geminiApiKey}
                      onChange={(e) => setGeminiApiKey(e.target.value)}
                      disabled={isLoading}
                      aria-describedby="gemini-key-help"
                    />
                    <p id="gemini-key-help" className="text-xs text-yellow-600 dark:text-yellow-400">
                      Get free key at{' '}
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-yellow-700 dark:hover:text-yellow-300"
                      >
                        aistudio.google.com/app/apikey
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div
                  id="registration-error"
                  className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-md"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold shadow-lg hover:shadow-xl transition-all" disabled={isLoading}>
                {isLoading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
