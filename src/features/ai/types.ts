/**
 * AI provider contract.
 *
 * The chat screen depends only on this interface — concrete providers
 * (Gemini live, mock for offline) are wired in `provider.ts`.
 */

import type { MessageRole } from '@/types';

export type AIChatMessage = {
  role: MessageRole;
  content: string;
};

export type AIProvider = {
  /** Stream an assistant reply as successive plain-text (markdown) chunks. */
  sendMessage(messages: AIChatMessage[]): AsyncGenerator<string, void, unknown>;
};
