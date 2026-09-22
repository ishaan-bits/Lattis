/**
 * Auth service barrel — `import { signIn } from '@/services'`.
 */

export {
  authErrorMessage,
  observeAuthState,
  resetPassword,
  signIn,
  signUp,
  signOutUser,
  type AuthUser,
} from './firebase/auth';
export { app, auth, isFirebaseConfigured } from './firebase/config';
