/**
 * Auth service barrel — `import { signIn } from '@/services'`.
 */

export {
  authErrorMessage,
  observeAuthState,
  resetPassword,
  resetPasswordErrorMessage,
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
  deleteThreadMessage,
  fetchUserProfile,
  isUsernameAvailable,
  isValidUsername,
  normalizeUsername,
  patchNodeAIContent,
  sendThreadMessage,
  subscribeToUserProfile,
  updateProject,
  updateThread,
  watchProjects,
  watchThread,
  watchThreadMessages,
  watchThreadPreview,
  watchThreads,
  type CreateProjectInput,
  type CreateThreadInput,
  type ThreadPreview,
  type UserProfile,
} from './firebase/firestore';
