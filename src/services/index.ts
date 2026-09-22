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
export {
  createProject,
  createThread,
  createUserProfile,
  deleteProject,
  deleteThread,
  fetchUserProfile,
  isUsernameAvailable,
  isValidUsername,
  normalizeUsername,
  subscribeToUserProfile,
  updateProject,
  updateThread,
  watchProjects,
  watchThreads,
  type CreateProjectInput,
  type CreateThreadInput,
  type UserProfile,
} from './firebase/firestore';
