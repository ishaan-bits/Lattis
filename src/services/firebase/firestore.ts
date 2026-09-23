/**
 * Firestore data layer — users, usernames, and projects.
 *
 * Framework-agnostic wrappers so features never import `firebase/*` directly.
 * Every projects query is scoped to `ownerId == uid` for multi-user isolation.
 */

import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  collection,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

import type { Message, MessageRole, Project, Thread } from '@/types';

import { app } from './config';

const db = getFirestore(app);

/** Firestore user profile document (`users/{uid}`). */
export type UserProfile = {
  uid: string;
  username: string;
  fullName: string;
  /** ISO date `YYYY-MM-DD`. */
  dateOfBirth: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
};

type UserProfileDoc = Omit<UserProfile, 'createdAt' | 'updatedAt'> & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

function toISO(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (
    value !== null &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return new Date(0).toISOString();
}

function mapProfile(uid: string, data: UserProfileDoc): UserProfile {
  return {
    uid,
    username: data.username,
    fullName: data.fullName,
    dateOfBirth: data.dateOfBirth,
    email: data.email,
    createdAt: data.createdAt !== undefined ? toISO(data.createdAt) : undefined,
    updatedAt: data.updatedAt !== undefined ? toISO(data.updatedAt) : undefined,
  };
}

/** Normalize username for uniqueness checks and storage. */
export function normalizeUsername(username: string): string {
  return username.trim();
}

/** True when username is 3–20 chars of `[A-Za-z0-9_]`. */
export function isValidUsername(username: string): boolean {
  return /^[A-Za-z0-9_]{3,20}$/.test(username);
}

/** True when no `usernames/{username}` doc exists (public-read index). */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  const normalized = normalizeUsername(username);
  const snapshot = await getDoc(doc(db, 'usernames', normalized));
  return !snapshot.exists();
}

/**
 * Create `users/{uid}` and reserve `usernames/{username}` for a freshly
 * signed-up account. Username is checked last so the rule `!exists(...)`
 * is the authoritative uniqueness gate under races.
 */
export async function createUserProfile(
  profile: Omit<UserProfile, 'createdAt' | 'updatedAt'>,
): Promise<UserProfile> {
  const normalized = normalizeUsername(profile.username);
  const usernameRef = doc(db, 'usernames', normalized);
  const existingUsername = await getDoc(usernameRef);
  if (existingUsername.exists()) {
    throw new Error('That username is already taken.');
  }

  const ref = doc(db, 'users', profile.uid);
  const payload: UserProfileDoc = {
    uid: profile.uid,
    username: normalized,
    fullName: profile.fullName.trim(),
    dateOfBirth: profile.dateOfBirth,
    email: profile.email.trim().toLowerCase(),
  };

  await setDoc(ref, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await setDoc(usernameRef, {
      uid: profile.uid,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    // Lost the race (or rules not published) — roll back the profile doc.
    await deleteDoc(ref).catch(() => undefined);
    if (error instanceof Error && 'code' in error) {
      throw new Error('That username is already taken.');
    }
    throw error;
  }

  return {
    ...payload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** One-shot fetch of `users/{uid}`; `null` when missing. */
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) return null;
  return mapProfile(uid, snapshot.data() as UserProfileDoc);
}

/** Realtime subscription to `users/{uid}`; emits `null` when deleted. */
export function subscribeToUserProfile(
  uid: string,
  onChange: (profile: UserProfile | null) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'users', uid),
    (snapshot) => {
      onChange(snapshot.exists() ? mapProfile(uid, snapshot.data() as UserProfileDoc) : null);
    },
    () => {
      onChange(null);
    },
  );
}

type ProjectDoc = Omit<Project, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

function toISOClock(value: unknown): string {
  // Pending `serverTimestamp()` reads back as null until the write acks —
  // treat that as "now" so sorting and relative labels stay sane.
  if (value === null || value === undefined) return new Date().toISOString();
  return toISO(value);
}

function mapProject(id: string, data: ProjectDoc): Project {
  return {
    id,
    ownerId: data.ownerId,
    title: data.title,
    emoji: data.emoji,
    color: data.color,
    description: typeof data.description === 'string' ? data.description : '',
    createdAt: toISOClock(data.createdAt),
    updatedAt: toISOClock(data.updatedAt),
    archived: data.archived === true,
  };
}

/**
 * Realtime projects for one owner only (`where('ownerId', '==', uid)`).
 * Sorted client-side so no composite index is required.
 */
export function watchProjects(
  ownerId: string,
  onChange: (projects: Project[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const projectsQuery = query(collection(db, 'projects'), where('ownerId', '==', ownerId));
  return onSnapshot(
    projectsQuery,
    (snapshot) => {
      const projects = snapshot.docs
        .map((document) => mapProject(document.id, document.data() as ProjectDoc))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      onChange(projects);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export type CreateProjectInput = {
  ownerId: string;
  title: string;
  emoji: string;
  color: string;
  description: string;
};

/**
 * Create `projects/{projectId}` with owner, timestamps, and `archived: false`.
 * Returns the new document id; the realtime listener picks it up immediately.
 */
export async function createProject(input: CreateProjectInput): Promise<string> {
  const ref = await addDoc(collection(db, 'projects'), {
    ownerId: input.ownerId,
    title: input.title,
    emoji: input.emoji,
    color: input.color,
    description: input.description,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    archived: false,
  });
  return ref.id;
}

/** Patch editable project fields and bump `updatedAt` to `serverTimestamp()`. */
export async function updateProject(
  projectId: string,
  patch: Partial<Pick<Project, 'title' | 'emoji' | 'color' | 'description'>>,
): Promise<void> {
  if (Object.keys(patch).length === 0) return;
  await updateDoc(doc(db, 'projects', projectId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/** Delete `projects/{projectId}`. Authorization is enforced by security rules. */
export async function deleteProject(projectId: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', projectId));
}

type ThreadDoc = Omit<Thread, 'id' | 'createdAt' | 'updatedAt'> & {
  createdAt?: unknown;
  updatedAt?: unknown;
};

function mapThread(id: string, data: ThreadDoc): Thread {
  return {
    id,
    projectId: data.projectId,
    ownerId: data.ownerId,
    title: data.title,
    createdAt: toISOClock(data.createdAt),
    updatedAt: toISOClock(data.updatedAt),
    archived: data.archived === true,
  };
}

/**
 * Realtime threads for one owner + project
 * (`where('ownerId', '==', uid)` + `where('projectId', '==', projectId)`).
 * Sorted client-side so no composite index is required.
 */
export function watchThreads(
  ownerId: string,
  projectId: string,
  onChange: (threads: Thread[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const threadsQuery = query(
    collection(db, 'threads'),
    where('ownerId', '==', ownerId),
    where('projectId', '==', projectId),
  );
  return onSnapshot(
    threadsQuery,
    (snapshot) => {
      const threads = snapshot.docs
        .map((document) => mapThread(document.id, document.data() as ThreadDoc))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      onChange(threads);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export type CreateThreadInput = {
  projectId: string;
  ownerId: string;
  title: string;
};

/**
 * Create `threads/{threadId}` with owner, project, timestamps, and
 * `archived: false`. Returns the new document id; the realtime listener
 * picks it up immediately.
 */
export async function createThread(input: CreateThreadInput): Promise<string> {
  const ref = await addDoc(collection(db, 'threads'), {
    projectId: input.projectId,
    ownerId: input.ownerId,
    title: input.title,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    archived: false,
  });
  return ref.id;
}

/** Patch editable thread fields and bump `updatedAt` to `serverTimestamp()`. */
export async function updateThread(
  threadId: string,
  patch: Partial<Pick<Thread, 'title' | 'archived'>>,
): Promise<void> {
  if (Object.keys(patch).length === 0) return;
  await updateDoc(doc(db, 'threads', threadId), {
    ...patch,
    updatedAt: serverTimestamp(),
  });
}

/** Delete `threads/{threadId}`. Authorization is enforced by security rules. */
export async function deleteThread(threadId: string): Promise<void> {
  await deleteDoc(doc(db, 'threads', threadId));
}

/** Realtime `threads/{threadId}` doc; emits `null` when missing. */
export function watchThread(
  threadId: string,
  onChange: (thread: Thread | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(db, 'threads', threadId),
    (snapshot) => {
      onChange(snapshot.exists() ? mapThread(snapshot.id, snapshot.data() as ThreadDoc) : null);
    },
    (error) => {
      onError?.(error);
    },
  );
}

type MessageDoc = {
  role: MessageRole;
  content: string;
  createdAt?: unknown;
};

function mapMessage(id: string, threadId: string, data: MessageDoc): Message {
  return {
    id,
    threadId,
    role: data.role,
    content: data.content,
    createdAt: toISOClock(data.createdAt),
  };
}

/**
 * Realtime messages for one thread (`threads/{threadId}/messages`), sorted
 * client-side by `createdAt` asc. Ownership is enforced by security rules on
 * the parent thread doc.
 */
export function watchThreadMessages(
  threadId: string,
  onChange: (messages: Message[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'threads', threadId, 'messages'),
    (snapshot) => {
      const messages = snapshot.docs
        .map((document) => mapMessage(document.id, threadId, document.data() as MessageDoc))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      onChange(messages);
    },
    (error) => {
      onError?.(error);
    },
  );
}

/**
 * Append `threads/{threadId}/messages/{messageId}` with the full schema
 * `{ id, threadId, role, content, createdAt }` and a server timestamp.
 * The id is pre-generated so it can be stored alongside the document id.
 */
export async function sendThreadMessage(
  threadId: string,
  input: { role: MessageRole; content: string },
): Promise<string> {
  const ref = doc(collection(db, 'threads', threadId, 'messages'));
  await setDoc(ref, {
    id: ref.id,
    threadId,
    role: input.role,
    content: input.content,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

/** Latest message snapshot used for thread-list previews. */
export type ThreadPreview = {
  content: string;
  role: MessageRole;
  createdAt: string;
};

/**
 * Realtime latest message for one thread (`orderBy createdAt desc`, `limit 1`)
 * so list screens can show a preview without loading full histories.
 */
export function watchThreadPreview(
  threadId: string,
  onChange: (preview: ThreadPreview | null) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  const previewQuery = query(
    collection(db, 'threads', threadId, 'messages'),
    orderBy('createdAt', 'desc'),
    limit(1),
  );
  return onSnapshot(
    previewQuery,
    (snapshot) => {
      const latest = snapshot.docs[0];
      if (!latest) {
        onChange(null);
        return;
      }
      const data = latest.data() as MessageDoc;
      onChange({
        content: data.content,
        role: data.role,
        createdAt: toISOClock(data.createdAt),
      });
    },
    (error) => {
      onError?.(error);
    },
  );
}

/** Delete `threads/{threadId}/messages/{messageId}` (delete / regenerate). */
export async function deleteThreadMessage(threadId: string, messageId: string): Promise<void> {
  await deleteDoc(doc(db, 'threads', threadId, 'messages', messageId));
}
