/**
 * Global app store (Zustand).
 *
 * UI-level state that is not owned by a single feature. Feature-specific
 * stores live under `src/features/<name>/store`.
 */

import { create } from 'zustand';

export type AppState = {
  /** True once first-run bootstrapping (fonts, persistence rehydration) completes. */
  isBootstrapped: boolean;
  setBootstrapped: (value: boolean) => void;
};

export const useAppStore = create<AppState>((set) => ({
  isBootstrapped: false,
  setBootstrapped: (value) => set({ isBootstrapped: value }),
}));
