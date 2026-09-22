/**
 * Projects store — realtime workspace state scoped to the signed-in owner.
 *
 * UI never talks to Firestore directly; it calls these actions, which delegate
 * to the project services. `subscribe` attaches the owner-filtered listener
 * and `reset` tears it down (logout / uid change).
 */

import { create } from 'zustand';

import { createProject, deleteProject, updateProject, watchProjects } from '@/services';
import { useAuthStore } from '@/store';
import type { Project } from '@/types';

import { PROJECT_TITLE_MAX } from '../constants';

export type CreateProjectValues = {
  title: string;
  emoji: string;
  color: string;
  description: string;
};

export type ProjectsState = {
  projects: Project[];
  loading: boolean;
  searchQuery: string;
  subscribe: (ownerId: string) => void;
  create: (values: CreateProjectValues) => Promise<void>;
  rename: (projectId: string, title: string) => Promise<void>;
  remove: (projectId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  reset: () => void;
};

let unsubscribeProjects: (() => void) | null = null;

function requireTitle(title: string): string {
  const trimmed = title.trim();
  if (!trimmed) throw new Error('Project title is required.');
  if (trimmed.length > PROJECT_TITLE_MAX) {
    throw new Error(`Project title must be ${PROJECT_TITLE_MAX} characters or fewer.`);
  }
  return trimmed;
}

export const useProjectsStore = create<ProjectsState>((set) => ({
  projects: [],
  loading: false,
  searchQuery: '',

  subscribe: (ownerId) => {
    unsubscribeProjects?.();
    set({ loading: true });
    unsubscribeProjects = watchProjects(
      ownerId,
      (projects) => set({ projects, loading: false }),
      () => set({ loading: false }),
    );
  },

  create: async (values) => {
    const uid = useAuthStore.getState().user?.uid;
    if (!uid) throw new Error('You need to sign in first.');

    const title = requireTitle(values.title);
    await createProject({
      ownerId: uid,
      title,
      emoji: values.emoji,
      color: values.color,
      description: values.description.trim(),
    });
  },

  rename: async (projectId, title) => {
    const trimmed = requireTitle(title);
    await updateProject(projectId, { title: trimmed });
  },

  remove: async (projectId) => {
    await deleteProject(projectId);
  },

  setSearchQuery: (query) => set({ searchQuery: query }),

  reset: () => {
    unsubscribeProjects?.();
    unsubscribeProjects = null;
    set({ projects: [], loading: false, searchQuery: '' });
  },
}));
