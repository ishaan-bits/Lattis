/**
 * Canvas edge service — realtime CRUD for `projects/{projectId}/edges/{edgeId}`.
 *
 * Mirrors the node service: timestamps map to ISO strings on the way out,
 * reads are sorted client-side so no composite index is required, and writes
 * fire-and-forget with the caller owning UX feedback.
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

import { EDGE_TYPES, type CanvasEdge, type CanvasEdgePatch, type EdgeType } from '../types';

const db = getFirestore(app);

type CanvasEdgeDoc = Omit<CanvasEdge, 'createdAt'> & {
  createdAt?: unknown;
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

function mapEdge(id: string, data: CanvasEdgeDoc): CanvasEdge {
  const type: EdgeType =
    typeof data.type === 'string' && (EDGE_TYPES as readonly string[]).includes(data.type)
      ? (data.type as EdgeType)
      : 'reference';
  const label = typeof data.label === 'string' && data.label.length > 0 ? data.label : undefined;
  return {
    id,
    from: typeof data.from === 'string' ? data.from : '',
    to: typeof data.to === 'string' ? data.to : '',
    type,
    ...(label !== undefined ? { label } : {}),
    createdAt: toISO(data.createdAt),
  };
}

export function watchCanvasEdges(
  projectId: string,
  onChange: (edges: CanvasEdge[]) => void,
  onError?: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    collection(db, 'projects', projectId, 'edges'),
    (snapshot) => {
      const edges = snapshot.docs
        .map((document) => mapEdge(document.id, document.data() as CanvasEdgeDoc))
        .filter((edge) => edge.from !== '' && edge.to !== '')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
      onChange(edges);
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function createCanvasEdge(
  projectId: string,
  input: { from: string; to: string; type: EdgeType; label?: string },
): string {
  const ref = doc(collection(db, 'projects', projectId, 'edges'));
  void setDoc(ref, {
    id: ref.id,
    from: input.from,
    to: input.to,
    type: input.type,
    ...(input.label !== undefined ? { label: input.label } : {}),
    createdAt: serverTimestamp(),
  }).catch(() => undefined);
  return ref.id;
}

export function patchCanvasEdge(projectId: string, edgeId: string, patch: CanvasEdgePatch): void {
  const data = Object.fromEntries(
    Object.entries(patch).filter(([, value]) => value !== undefined),
  ) as CanvasEdgePatch;
  if (Object.keys(data).length === 0) return;
  void updateDoc(doc(db, 'projects', projectId, 'edges', edgeId), data).catch(() => undefined);
}

export function deleteCanvasEdge(projectId: string, edgeId: string): void {
  void deleteDoc(doc(db, 'projects', projectId, 'edges', edgeId)).catch(() => undefined);
}
