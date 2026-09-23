/**
 * AI feature — provider abstraction for chat replies.
 * Gemini streams directly from the app via `@google/genai`.
 */

export { aiProvider } from './provider';
export { GeminiProvider } from './geminiProvider';
export type { AIChatMessage, AIProvider } from './types';
