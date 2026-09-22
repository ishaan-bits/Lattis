/**
 * Message domain types.
 *
 * Matches the Firestore `threads/{threadId}/messages/{messageId}` document
 * shape. Authorization is enforced via the parent thread's `ownerId`.
 */

import type { ID, ISOTimestamp } from '@/types';

export type MessageRole = 'user' | 'assistant';

export type Message = {
  id: ID;
  /** Parent thread — mirrors the `threads/{threadId}` path segment. */
  threadId: ID;
  role: MessageRole;
  content: string;
  createdAt: ISOTimestamp;
};
