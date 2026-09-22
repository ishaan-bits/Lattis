/**
 * Firebase Auth service.
 *
 * Framework-agnostic wrappers so features never import `firebase/*` directly.
 * Session snapshots are persisted by the auth store (SecureStore), not here.
 */

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type Unsubscribe,
  type User,
} from 'firebase/auth';

import { auth } from './config';

/** Serializable user profile shared with the UI/store. */
export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
};

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export async function signUp(email: string, password: string, name: string): Promise<AuthUser> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  if (name.trim()) {
    await updateProfile(credential.user, { displayName: name.trim() });
  }
  return toAuthUser(credential.user);
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return toAuthUser(credential.user);
}

export async function signOutUser(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Subscribe to Firebase auth state. Returns an unsubscribe function.
 * Emits `null` on sign-out.
 */
export function observeAuthState(onChange: (user: AuthUser | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, (user) => {
    onChange(user ? toAuthUser(user) : null);
  });
}

/** Map Firebase / unknown errors to short UI-friendly copy. */
export function authErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return 'Something went wrong. Please try again.';
  }

  const code = String((error as { code?: string }).code ?? '');

  switch (code) {
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is disabled in Firebase Console.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
