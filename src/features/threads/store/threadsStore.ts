/**
 * Threads store — realtime thread state for one project, scoped to the owner.
 *
 * UI never talks to Firestore directly; it calls these actions, which delegate
 * to the thread services. `subscribe` attaches the owner + project filtered
 * listener and `reset` tears it down (logout / project change).
 */

import { create } from 'zustand';

import { createThread, deleteThread, updateThread, watchThreads } from '@/services';
import { useAuthStore } from '@/store';
import type { Thread } from '@/types';

import { DEFAULT_THREAD_TITLE, THREAD_TITLE_MAX } from '../constants';

export type ThreadsState = {
  threads: Thread[];
  loading: boolean;
  searchQuery: string;
  projectId: string | null;
  subscribe: (ownerId: string, projectId: string) => void;
  create: (title: string) => Promise<void>;
  rename: (threadId: string, title: string) => Promise<void>;
  setArchived: (threadId: string, archived: boolean) => Promise<void>;
  remove: (threadId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  reset: () => void;
};

let unsubscribeThreads: (() => void) | null = null;

function requireTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) throw new Error('Thread title is required.');
  if (trimmed.length > THREAD_TITLE_MAX) {
    throw new Error(`Thread title must be ${THREAD_TITLE_MAX} characters or fewer.`);
  }
  return trimmed;
}

export const useThreadsStore = create<ThreadsState>((set, get) => ({
  threads: [],
  loading: true,
  searchQuery: '',
  projectId: null,

  subscribe: (ownerId, projectId) => {
    unsubscribeThreads?.();
    set({ loading: true, projectId });
    unsubscribeThreads = watchThreads(
      ownerId,
      projectId,
      (threads) => set({ threads, loading: false }),
      () => set({ loading: false }),
    );
  },

  create: async (title) => {
    const uid = useAuthStore.getState().user?.uid;
    if (!uid) throw new Error('You need to sign in first.');
    const { projectId } = get();
    if (!projectId) throw new Error('No project selected.');

    await createThread({
      ownerId: uid,
      projectId,
      title: requireTitle(title) || DEFAULT_THREAD_TITLE,
    });
  },

  rename: async (threadId, title) => {
    await updateThread(threadId, { title: requireTitle(title) });
  },

  setArchived: async (threadId, archived) => {
    await updateThread(threadId, { archived });
  },

  remove: async (threadId) => {
    await deleteThread(threadId);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  reset: () => {
    unsubscribeThreads?.();
    unsubscribeThreads = null;
    set({ threads: [], loading: true, searchQuery: '', projectId: null });
  },
}));
