/**
 * Firebase app singleton.
 *
 * Credentials come only from Expo public env vars (inlined at bundle time).
 * Never hardcode secrets here — use `.env` / EAS secrets.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/** True when all required EXPO_PUBLIC_FIREBASE_* keys are present. */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

function createApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  if (!isFirebaseConfigured) {
    throw new Error(
      'Firebase is not configured. Set EXPO_PUBLIC_FIREBASE_* values in .env (see .env.example).',
    );
  }
  return initializeApp(firebaseConfig);
}

/** Default Firebase app (singleton). */
export const app: FirebaseApp = createApp();

function createAuth(firebaseApp: FirebaseApp): Auth {
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'auth/already-initialized'
    ) {
      return getAuth(firebaseApp);
    }
    throw error;
  }
}

/** Default Firebase Auth instance (singleton with AsyncStorage persistence). */
export const auth: Auth = createAuth(app);
