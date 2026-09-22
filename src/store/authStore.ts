/**
 * Auth store (Zustand + SecureStore).
 *
 * Holds the signed-in user, Firestore profile, loading/initialized flags, and
 * actions that wrap the Firebase auth service. Only a minimal session snapshot
 * is written to SecureStore so cold starts can render immediately while
 * Firebase restores the real session.
 */

import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import {
  authErrorMessage,
  createUserProfile,
  fetchUserProfile,
  isUsernameAvailable,
  isValidUsername,
  normalizeUsername,
  observeAuthState,
  signIn as firebaseSignIn,
  signOutUser,
  signUp,
  subscribeToUserProfile,
  type AuthUser,
  type UserProfile,
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

export type RegisterInput = {
  fullName: string;
  username: string;
  /** ISO date `YYYY-MM-DD`. */
  dateOfBirth: string;
  email: string;
  password: string;
};

export type AuthState = {
  user: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
};

let unsubscribeAuth: (() => void) | null = null;
let unsubscribeProfile: (() => void) | null = null;
let initializePromise: Promise<void> | null = null;

function toUiError(error: unknown): Error {
  if (error instanceof Error && !('code' in error)) {
    return error;
  }
  return new Error(authErrorMessage(error));
}

export const useAuthStore = create<AuthState>((set, get) => {
  function attachProfile(uid: string): void {
    unsubscribeProfile?.();
    unsubscribeProfile = subscribeToUserProfile(uid, (profile) => {
      if (get().user?.uid === uid) {
        set({ userProfile: profile });
      }
    });
  }

  function detachProfile(): void {
    unsubscribeProfile?.();
    unsubscribeProfile = null;
    set({ userProfile: null });
  }

  async function loadProfileOnce(uid: string): Promise<void> {
    try {
      const profile = await fetchUserProfile(uid);
      if (get().user?.uid === uid) {
        set({ userProfile: profile });
      }
    } catch {
      // Realtime listener will fill this in if the network recovers.
    }
  }

  return {
    user: null,
    userProfile: null,
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
            if (user) {
              attachProfile(user.uid);
              void loadProfileOnce(user.uid);
            } else {
              detachProfile();
            }
          });

          // Observe fires asynchronously; mark initialized even if Firebase
          // config is missing so splash can route (login will surface errors).
          if (!get().initialized) {
            set({ initialized: true, loading: false });
          }
        } catch {
          set({ user: null, userProfile: null, loading: false, initialized: true });
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
        attachProfile(user.uid);
        await loadProfileOnce(user.uid);
      } catch (error) {
        set({ loading: false });
        throw toUiError(error);
      }
    },

    register: async ({ fullName, username, dateOfBirth, email, password }) => {
      set({ loading: true });
      try {
        const normalizedUsername = normalizeUsername(username);
        if (!isValidUsername(normalizedUsername)) {
          throw new Error('Username must be 3–20 characters (letters, numbers, or underscores).');
        }

        const available = await isUsernameAvailable(normalizedUsername);
        if (!available) {
          throw new Error('That username is already taken.');
        }

        const user = await signUp(email.trim(), password, fullName.trim());
        const profile = await createUserProfile({
          uid: user.uid,
          username: normalizedUsername,
          fullName: fullName.trim(),
          dateOfBirth,
          email: email.trim(),
        });

        set({ user, userProfile: profile, loading: false, initialized: true });
        await writeSession(user);
        attachProfile(user.uid);
      } catch (error) {
        set({ loading: false });
        throw toUiError(error);
      }
    },

    logout: async () => {
      set({ loading: true });
      try {
        await signOutUser();
        detachProfile();
        set({ user: null, loading: false });
        await writeSession(null);
      } catch (error) {
        set({ loading: false });
        throw toUiError(error);
      }
    },
  };
});
