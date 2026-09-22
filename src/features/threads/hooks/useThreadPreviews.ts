/**
 * useThreadPreviews — latest-message previews for a list of threads.
 *
 * Attaches one `limit(1)` listener per thread (capped so a long list can't
 * fan out into unbounded subscriptions) and returns a `threadId → preview`
 * map for thread cards.
 */

import { useEffect, useState } from 'react';

import { watchThreadPreview } from '@/services';

/** Maximum simultaneous preview listeners (rest simply stay blank). */
const PREVIEW_LISTENER_LIMIT = 40;

export function useThreadPreviews(threadIds: readonly string[]): Record<string, string> {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const idsKey = threadIds.join('|');

  useEffect(() => {
    const ids = idsKey ? idsKey.split('|').slice(0, PREVIEW_LISTENER_LIMIT) : [];

    const unsubscribes = ids.map((threadId) =>
      watchThreadPreview(threadId, (preview) => {
        setPreviews((previous) => {
          if (!preview) {
            if (!(threadId in previous)) return previous;
            const next = { ...previous };
            delete next[threadId];
            return next;
          }
          const content = preview.content.replace(/\s+/g, ' ').trim();
          if (previous[threadId] === content) return previous;
          return { ...previous, [threadId]: content };
        });
      }),
    );

    return () => {
      for (const unsubscribe of unsubscribes) unsubscribe();
    };
  }, [idsKey]);

  return previews;
}
