/**
 * useThread — realtime subscription to one `threads/{threadId}` doc.
 *
 * Returns `null` until a `threadId` is provided (or once the doc is
 * deleted); the chat screen uses the live title and redirects home when
 * the thread disappears.
 */

import { useEffect, useState } from 'react';

import { watchThread } from '@/services';
import type { Thread } from '@/types';

export type ThreadResult = {
  thread: Thread | null;
  loading: boolean;
};

export function useThread(threadId: string | null): ThreadResult {
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(threadId != null);

  useEffect(() => {
    if (!threadId) {
      return undefined;
    }

    const unsubscribe = watchThread(
      threadId,
      (next) => {
        setThread(next);
        setLoading(false);
      },
      () => setLoading(false),
    );
    return () => unsubscribe();
  }, [threadId]);

  return { thread, loading };
}
