/**
 * Thread domain types.
 *
 * Matches the Firestore `threads/{threadId}` document shape. Every query
 * must filter by `ownerId == current user uid` and `projectId`.
 */

import type { ID, ISOTimestamp } from '@/types';

export type Thread = {
  id: ID;
  projectId: ID;
  ownerId: string;
  title: string;
  createdAt: ISOTimestamp;
  updatedAt: ISOTimestamp;
  archived: boolean;
};
