/**
 * Thread display helpers — pure functions shared by cards and lists.
 */

import type { Thread } from '@/types';

export { formatRelativeTime } from '@/features/projects';

/** Compact clock label for a message timestamp (`h:mm AM/PM`). */
export function formatClock(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/** Filter threads by title (case-insensitive) and sort by `updatedAt` desc. */
export function filterThreadsByTitle(threads: Thread[], query: string): Thread[] {
  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? threads.filter((thread) => thread.title.toLowerCase().includes(needle))
    : threads;
  return [...filtered].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
