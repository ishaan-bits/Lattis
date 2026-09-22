/**
 * MockProvider — local stand-in for a real AI backend.
 *
 * Streams a fixed sentence character-by-character so the chat UI can be
 * exercised end-to-end without any network calls or SDKs.
 */

import type { AIChatMessage, AIProvider } from './types';

const MOCK_REPLY = 'AI is offline right now — replies will resume shortly.';
const CHAR_DELAY_MS = 30;

export class MockProvider implements AIProvider {
  async *sendMessage(messages: AIChatMessage[]): AsyncGenerator<string, void, unknown> {
    void messages;
    for (const char of MOCK_REPLY) {
      await new Promise((resolve) => setTimeout(resolve, CHAR_DELAY_MS));
      yield char;
    }
  }
}
