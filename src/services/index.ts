/**
 * Auth service barrel — `import { signIn } from '@/services'`.
 */

export {
  authErrorMessage,
  createAccount,
  getFirebaseAuth,
  observeAuthState,
  resetPassword,
  signIn,
  signOut,
  type AuthUser,
} from './firebase/auth';
export { getFirebaseApp, isFirebaseConfigured } from './firebase/config';
