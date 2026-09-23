/**
 * useEdges — realtime edge state for one project's knowledge graph.
 *
 * Identity-preserving reconciliation keeps memoized EdgePath components from
 * re-rendering on no-op snapshots; selection and the floating menu are
 * derived against the live edge list so orphaned state disappears on delete.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createCanvasEdge,
  deleteCanvasEdge,
  patchCanvasEdge,
  watchCanvasEdges,
} from '../services/edgeService';
import type { CanvasEdge, CanvasEdgePatch, EdgeMenu, EdgeType } from '../types';

export function useEdges(projectId: string) {
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [snapshotReceived, setSnapshotReceived] = useState(false);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [edgeMenu, setEdgeMenu] = useState<EdgeMenu | null>(null);

  const projectIdRef = useRef(projectId);
  const edgesRef = useRef(edges);

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const reconcile = useCallback((incoming: CanvasEdge[]) => {
    setEdges((prev) => {
      const prevById = new Map(prev.map((edge) => [edge.id, edge]));
      return incoming.map((edge) => {
        const previous = prevById.get(edge.id);
        if (
          previous &&
          previous.from === edge.from &&
          previous.to === edge.to &&
          previous.type === edge.type &&
          previous.label === edge.label &&
          previous.createdAt === edge.createdAt
        ) {
          return previous;
        }
        return edge;
      });
    });
  }, []);

  useEffect(() => {
    if (!projectId) return undefined;
    return watchCanvasEdges(
      projectId,
      (next) => {
        reconcile(next);
        setSnapshotReceived(true);
      },
      () => {
        setSnapshotReceived(true);
      },
    );
  }, [projectId, reconcile]);

  const openEdgeMenu = useCallback((edgeId: string, left: number, top: number) => {
    setSelectedEdgeId(edgeId);
    setEdgeMenu({ edgeId, left, top });
  }, []);

  const closeEdgeMenu = useCallback(() => {
    setSelectedEdgeId(null);
    setEdgeMenu(null);
  }, []);

  const createEdge = useCallback(
    (from: string, to: string, type: EdgeType = 'reference'): boolean => {
      if (!projectIdRef.current || from === to || from === '' || to === '') return false;
      const duplicate = edgesRef.current.some((edge) => edge.from === from && edge.to === to);
      if (duplicate) return false;
      createCanvasEdge(projectIdRef.current, { from, to, type });
      return true;
    },
    [],
  );

  const patchEdge = useCallback((edgeId: string, patch: CanvasEdgePatch) => {
    if (projectIdRef.current) patchCanvasEdge(projectIdRef.current, edgeId, patch);
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    if (projectIdRef.current) deleteCanvasEdge(projectIdRef.current, edgeId);
    setSelectedEdgeId((current) => (current === edgeId ? null : current));
    setEdgeMenu((current) => (current?.edgeId === edgeId ? null : current));
  }, []);

  const activeSelectedEdgeId =
    selectedEdgeId !== null && edges.some((edge) => edge.id === selectedEdgeId)
      ? selectedEdgeId
      : null;
  const activeEdgeMenu =
    edgeMenu !== null && edges.some((edge) => edge.id === edgeMenu.edgeId) ? edgeMenu : null;
  const loading = projectId !== '' && !snapshotReceived;

  return {
    edges,
    loading,
    selectedEdgeId: activeSelectedEdgeId,
    edgeMenu: activeEdgeMenu,
    openEdgeMenu,
    closeEdgeMenu,
    createEdge,
    patchEdge,
    removeEdge,
  };
}

export type UseEdgesResult = ReturnType<typeof useEdges>;
