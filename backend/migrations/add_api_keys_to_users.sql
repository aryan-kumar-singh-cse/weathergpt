-- Migration: Add API key columns to auth_users table
-- Date: 2026-08-29
-- Description: Add groq_api_key and gemini_api_key columns for user-specific API keys

-- Add columns for encrypted API keys
ALTER TABLE auth_users
ADD COLUMN IF NOT EXISTS groq_api_key VARCHAR(512),
ADD COLUMN IF NOT EXISTS gemini_api_key VARCHAR(512);

-- Add comments for documentation
COMMENT ON COLUMN auth_users.groq_api_key IS 'Encrypted Groq API key (user-provided)';
COMMENT ON COLUMN auth_users.gemini_api_key IS 'Encrypted Gemini API key (user-provided)';

-- Note: Both columns are nullable because users need only ONE key minimum
-- Keys are encrypted using Fernet symmetric encryption before storage
