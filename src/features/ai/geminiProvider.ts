/**
 * GeminiProvider — streams Gemini 3.6 Flash directly from the app.
 *
 * No Cloud Functions intermediary: `@google/genai` is called in-process and
 * text chunks are yielded as they arrive. The API key comes only from
 * `src/config/gemini.ts` (EXPO_PUBLIC_GEMINI_API_KEY) — never logged.
 */

import { GoogleGenAI } from '@google/genai';

import { requireGeminiApiKey } from '@/config/gemini';

import type { AIChatMessage, AIProvider } from './types';

const MODEL = 'gemini-3.6-flash';
const TEMPERATURE = 0.7;
const MAX_OUTPUT_TOKENS = 1024;

export class GeminiProvider implements AIProvider {
  async *sendMessage(messages: AIChatMessage[]): AsyncGenerator<string, void, unknown> {
    try {
      const ai = new GoogleGenAI({ apiKey: requireGeminiApiKey() });
      const contents = messages.map((message) => ({
        role: message.role === 'assistant' ? ('model' as const) : ('user' as const),
        parts: [{ text: message.content }],
      }));

      const stream = await ai.models.generateContentStream({
        model: MODEL,
        contents,
        config: {
          temperature: TEMPERATURE,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          thinkingConfig: { thinkingBudget: 0 },
        },
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          yield chunk.text;
        }
      }
    } catch (error) {
      // Log only the message — never request config or the API key.
      console.warn('[gemini]', error instanceof Error ? error.message : 'request failed');
      throw error;
    }
  }
}
