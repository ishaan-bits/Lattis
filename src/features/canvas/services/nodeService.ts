/**
 * Canvas node service — realtime CRUD for `projects/{projectId}/nodes/{nodeId}`.
 *
 * Feature-local Firestore access per the canvas spec: timestamps map to ISO
 * strings on the way out, positions/patch fields are written raw, and reads
 * are sorted client-side so no composite index is required.
 */

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

import { app } from '@/services';

import {
  DEFAULT_NODE_COLOR,
  NODE_ESTIMATED_HEIGHT,
  NODE_WIDTH,
  type CanvasNode,
  type CanvasNodePatch,
} from '../types';

const db = getFirestore(app);

type CanvasNodeDoc = Omit<CanvasNode, 'createdAt' | 'updatedAt'> & {
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

function toISOClock(value: unknown): string {
  if (value === null || value === undefined) return new Date().toISOString();
  return toISO(value);
}

function mapNode(id: string, data: CanvasNodeDoc): CanvasNode {
  return {
    id,
    type: 'text',
    title: typeof data.title === 'string' ? data.title : '',
    content: typeof data.content === 'string' ? data.content : '',
    x: typeof data.x === 'number' ? data.x : 0,
    y: typeof data.y === 'number' ? data.y : 0,
    width: typeof data.width === 'number' ? data.width : NODE_WIDTH,
    height: typeof data.height === 'number' ? data.height : NODE_ESTIMATED_HEIGHT,
    color: typeof data.color === 'string' ? data.color : DEFAULT_NODE_COLOR,
    createdAt: toISOClock(data.createdAt),
    updatedAt: toISOClock(data.updatedAt),
  };
}

export function watchCanvasNodes(
  projectId: string,
  onChange: (nodes: CanvasNode[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'projects', projectId, 'nodes'),
    (snapshot) => {
      const nodes = snapshot.docs
        .map((document) => mapNode(document.id, document.data() as CanvasNodeDoc))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
      onChange(nodes);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function createCanvasNode(projectId: string, input: { x: number; y: number }): string {
  const ref = doc(collection(db, 'projects', projectId, 'nodes'));
  void setDoc(ref, {
    id: ref.id,
    type: 'text',
    title: '',
    content: '',
    x: input.x,
    y: input.y,
    width: NODE_WIDTH,
    height: NODE_ESTIMATED_HEIGHT,
    color: DEFAULT_NODE_COLOR,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }).catch(() => undefined);
  return ref.id;
}

export function patchCanvasNode(projectId: string, nodeId: string, patch: CanvasNodePatch): void {
  if (Object.keys(patch).length === 0) return;
  void updateDoc(doc(db, 'projects', projectId, 'nodes', nodeId), {
    ...patch,
    updatedAt: serverTimestamp(),
  }).catch(() => undefined);
}

export function deleteCanvasNode(projectId: string, nodeId: string): void {
  void deleteDoc(doc(db, 'projects', projectId, 'nodes', nodeId)).catch(() => undefined);
}
