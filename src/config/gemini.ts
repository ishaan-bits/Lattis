/**
 * Gemini API configuration.
 *
 * EXPO_PUBLIC_* vars are inlined at bundle time by Expo — the key lives only
 * in `.env` (gitignored) / `.env.example`. Never hardcode it in source.
 */

export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;

/**
 * Returns the Gemini key, throwing when `.env` is missing it.
 *
 * Thrown at request time (not module load) so a missing key can never crash
 * app startup — the chat screen catches it and shows the fallback reply.
 */
export function requireGeminiApiKey(): string {
  if (!GEMINI_API_KEY) {
    throw new Error('Missing EXPO_PUBLIC_GEMINI_API_KEY in .env');
  }
  return GEMINI_API_KEY;
}
