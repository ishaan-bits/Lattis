/**
 * Threads feature — domain logic, store, and threads UI.
 * Screen composition lives under `app/`; this folder owns the store, sheets,
 * cards, and helpers. Firestore access only happens via `@/services`.
 */

export { ChatComposer, type ChatComposerProps } from './components/ChatComposer';
export { CreateThreadSheet } from './components/CreateThreadSheet';
export { EmptyThreads } from './components/EmptyThreads';
export { MessageBubble, type MessageBubbleProps } from './components/MessageBubble';
export { RenameThreadSheet } from './components/RenameThreadSheet';
export { ThreadActionsSheet } from './components/ThreadActionsSheet';
export { ThreadCard, type ThreadCardProps } from './components/ThreadCard';
export { TypingIndicator } from './components/TypingIndicator';
export { DEFAULT_THREAD_TITLE, THREAD_TITLE_MAX } from './constants';
export { useThread, type ThreadResult } from './hooks/useThread';
export { useThreadMessages, type ThreadMessagesResult } from './hooks/useThreadMessages';
export { useThreadPreviews } from './hooks/useThreadPreviews';
export { useThreadsStore, type ThreadsState } from './store/threadsStore';
export { filterThreadsByTitle, formatClock, formatRelativeTime } from './utils';
