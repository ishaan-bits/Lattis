/**
 * Projects feature — domain logic, store, and workspace UI.
 * Screen composition lives under `app/`; this folder owns the store, sheets,
 * cards, and helpers. Firestore access only happens via `@/services`.
 */

export { watchProjects } from '@/services';

export { CreateProjectSheet } from './components/CreateProjectSheet';
export { EmptyProjects } from './components/EmptyProjects';
export { FabButton, type FabButtonProps } from './components/FabButton';
export { PressableScale, type PressableScaleProps } from './components/PressableScale';
export { ProjectActionsSheet } from './components/ProjectActionsSheet';
export { ProjectCard } from './components/ProjectCard';
export { RenameProjectSheet } from './components/RenameProjectSheet';
export { SearchBar } from './components/SearchBar';
export { SheetShell, type SheetShellProps } from './components/SheetShell';
export {
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_EMOJI,
  PROJECT_COLORS,
  PROJECT_EMOJIS,
  PROJECT_TITLE_MAX,
} from './constants';
export {
  useProjectsStore,
  type CreateProjectValues,
  type ProjectsState,
} from './store/projectsStore';
export { formatRelativeTime } from './utils';
