/**
 * Active AI provider.
 *
 * The abstraction (`AIProvider` in `types.ts`: `sendMessage(messages)` →
 * `AsyncGenerator<string>`) keeps call sites decoupled from any one vendor —
 * swap `GeminiProvider` for a future OpenAI/Claude provider here only.
 * Gemini streams directly from the app; no Cloud Functions.
 */

import { GeminiProvider } from './geminiProvider';
import type { AIProvider } from './types';

export type { AIProvider } from './types';

export const aiProvider: AIProvider = new GeminiProvider();
