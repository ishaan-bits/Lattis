/**
 * Auth store (Zustand + SecureStore).
 *
 * Holds the signed-in user, loading/initialized flags, and actions that wrap
 * the Firebase auth service. Only a minimal session snapshot is written to
 * SecureStore so cold starts can render immediately while Firebase restores
 * the real session.
 */

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import {
  authErrorMessage,
  observeAuthState,
  signIn as firebaseSignIn,
  signOutUser,
  signUp,
  type AuthUser,
} from '@/services';

const SESSION_KEY = 'lattis.auth.session';
const SESSION_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
};

async function readSession(): Promise<AuthUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(SESSION_KEY, SESSION_OPTIONS);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'uid' in parsed &&
      typeof (parsed as AuthUser).uid === 'string'
    ) {
      return parsed as AuthUser;
    }
    return null;
  } catch {
    return null;
  }
}

async function writeSession(user: AuthUser | null): Promise<void> {
  try {
    if (user) {
      await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(user), SESSION_OPTIONS);
    } else {
      await SecureStore.deleteItemAsync(SESSION_KEY, SESSION_OPTIONS);
    }
  } catch {
    // SecureStore unavailable (e.g. web) — session simply won't persist.
  }
}

export type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

let unsubscribeAuth: (() => void) | null = null;
let initializePromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      set({ loading: true });
      try {
        const cached = await readSession();
        if (cached) set({ user: cached });

        unsubscribeAuth?.();
        unsubscribeAuth = observeAuthState((user) => {
          set({ user, loading: false, initialized: true });
          void writeSession(user);
        });

        // Observe fires asynchronously; mark initialized even if Firebase
        // config is missing so splash can route (login will surface errors).
        if (!get().initialized) {
          set({ initialized: true, loading: false });
        }
      } catch {
        set({ user: null, loading: false, initialized: true });
      }
    })();

    return initializePromise;
  },

  login: async (email, password) => {
    set({ loading: true });
    try {
      const user = await firebaseSignIn(email.trim(), password);
      set({ user, loading: false, initialized: true });
      await writeSession(user);
    } catch (error) {
      set({ loading: false });
      throw new Error(authErrorMessage(error));
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const user = await signUp(email.trim(), password, name.trim());
      set({ user, loading: false, initialized: true });
      await writeSession(user);
    } catch (error) {
      set({ loading: false });
      throw new Error(authErrorMessage(error));
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await signOutUser();
      set({ user: null, loading: false });
      await writeSession(null);
    } catch (error) {
      set({ loading: false });
      throw new Error(authErrorMessage(error));
    }
  },
}));
