/**
 * useThreadMessages — realtime subscription to one thread's messages.
 *
 * Returns an empty list until a `threadId` is provided; the snapshot listener
 * emits sorted messages (createdAt asc) and tears down on unmount.
 */

import { useEffect, useState } from 'react';

import { watchThreadMessages } from '@/services';
import type { Message } from '@/types';

export type ThreadMessagesResult = {
  messages: Message[];
  loading: boolean;
};

export function useThreadMessages(threadId: string | null): ThreadMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(threadId != null);

  useEffect(() => {
    if (!threadId) {
      return undefined;
    }

    const unsubscribe = watchThreadMessages(
      threadId,
      (next) => {
        setMessages(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsubscribe();
  }, [threadId]);

  return { messages, loading };
}
