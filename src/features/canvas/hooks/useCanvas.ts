/**
 * useCanvas — all canvas state.
 *
 * Realtime nodes with identity-preserving reconciliation (so memoized notes
 * skip re-renders), selection/editing/menu state derived against the live
 * node list, viewport shared values for the UI thread, hit-testing against
 * measured note bounds, and per-note 450ms debounced Firestore writes
 * flushed on unmount. Loading and validity live in render-time derivations
 * rather than effects.
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useSharedValue } from 'react-native-reanimated';

import { spacing } from '@/theme';

import {
  createCanvasNode,
  deleteCanvasNode,
  patchCanvasNode,
  watchCanvasNodes,
} from '../services/nodeService';
import {
  MENU_HEIGHT,
  MENU_WIDTH,
  NODE_ESTIMATED_HEIGHT,
  NODE_WIDTH,
  WRITE_DEBOUNCE_MS,
  type CanvasMenu,
  type CanvasNode,
  type CanvasNodePatch,
  type NodeXY,
} from '../types';

export function useCanvas(projectId: string) {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [snapshotReceived, setSnapshotReceived] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [menu, setMenu] = useState<CanvasMenu | null>(null);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [size, setSize] = useState({ width: 0, height: 0 });

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const positions = useSharedValue<Record<string, NodeXY>>({});

  const nodesRef = useRef(nodes);
  const heightsRef = useRef(heights);
  const sizeRef = useRef(size);
  const projectIdRef = useRef(projectId);
  const pendingRef = useRef(new Map<string, CanvasNodePatch>());
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    projectIdRef.current = projectId;
  }, [projectId]);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    heightsRef.current = heights;
  }, [heights]);

  useEffect(() => {
    sizeRef.current = size;
  }, [size]);

  useLayoutEffect(() => {
    const next: Record<string, NodeXY> = {};
    for (const node of nodes) {
      next[node.id] = { x: node.x, y: node.y };
    }
    positions.value = next;
  }, [nodes, positions]);

  const reconcile = useCallback((incoming: CanvasNode[]) => {
    setNodes((prev) => {
      const prevById = new Map(prev.map((node) => [node.id, node]));
      return incoming.map((node) => {
        const previous = prevById.get(node.id);
        if (
          previous &&
          previous.title === node.title &&
          previous.content === node.content &&
          previous.x === node.x &&
          previous.y === node.y &&
          previous.width === node.width &&
          previous.height === node.height &&
          previous.color === node.color &&
          previous.createdAt === node.createdAt &&
          previous.updatedAt === node.updatedAt
        ) {
          return previous;
        }
        return node;
      });
    });
  }, []);

  useEffect(() => {
    if (!projectId) return undefined;
    return watchCanvasNodes(
      projectId,
      (next) => {
        reconcile(next);
        setSnapshotReceived(true);
        setHeights((prev) => {
          const live = new Set(next.map((node) => node.id));
          let changed = false;
          const pruned: Record<string, number> = {};
          for (const [id, height] of Object.entries(prev)) {
            if (live.has(id)) pruned[id] = height;
            else changed = true;
          }
          return changed ? pruned : prev;
        });
      },
      () => {
        setSnapshotReceived(true);
      },
    );
  }, [projectId, reconcile]);

  const flushNode = useCallback((nodeId: string) => {
    const timer = timersRef.current.get(nodeId);
    if (timer !== undefined) {
      clearTimeout(timer);
      timersRef.current.delete(nodeId);
    }
    const patch = pendingRef.current.get(nodeId);
    pendingRef.current.delete(nodeId);
    if (patch && Object.keys(patch).length > 0 && projectIdRef.current) {
      patchCanvasNode(projectIdRef.current, nodeId, patch);
    }
  }, []);

  const patchNode = useCallback(
    (nodeId: string, patch: CanvasNodePatch) => {
      const merged = { ...(pendingRef.current.get(nodeId) ?? {}), ...patch };
      pendingRef.current.set(nodeId, merged);
      const existing = timersRef.current.get(nodeId);
      if (existing !== undefined) clearTimeout(existing);
      timersRef.current.set(
        nodeId,
        setTimeout(() => flushNode(nodeId), WRITE_DEBOUNCE_MS),
      );
    },
    [flushNode],
  );

  useEffect(() => {
    const timers = timersRef.current;
    const pending = pendingRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
      for (const [nodeId, patch] of pending) {
        if (Object.keys(patch).length > 0 && projectIdRef.current) {
          patchCanvasNode(projectIdRef.current, nodeId, patch);
        }
      }
      pending.clear();
    };
  }, []);

  const select = useCallback((nodeId: string | null) => {
    setSelectedId(nodeId);
    setMenu(null);
  }, []);

  const createAt = useCallback((worldX: number, worldY: number): string | null => {
    if (!projectIdRef.current) return null;
    const x = Math.round(worldX - NODE_WIDTH / 2);
    const y = Math.round(worldY - NODE_ESTIMATED_HEIGHT / 2);
    const id = createCanvasNode(projectIdRef.current, { x, y });
    setSelectedId(id);
    setMenu(null);
    return id;
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    if (projectIdRef.current) deleteCanvasNode(projectIdRef.current, nodeId);
    setSelectedId((current) => (current === nodeId ? null : current));
    setEditingId((current) => (current === nodeId ? null : current));
    setMenu((current) => (current?.nodeId === nodeId ? null : current));
  }, []);

  const onMeasure = useCallback((nodeId: string, height: number) => {
    setHeights((prev) => {
      const current = prev[nodeId];
      if (current !== undefined && Math.abs(current - height) < 0.5) return prev;
      return { ...prev, [nodeId]: height };
    });
  }, []);

  const hitNodeAt = useCallback((worldX: number, worldY: number): string | null => {
    const list = nodesRef.current;
    for (let index = list.length - 1; index >= 0; index -= 1) {
      const node = list[index];
      if (!node) continue;
      const height = heightsRef.current[node.id] ?? NODE_ESTIMATED_HEIGHT;
      if (
        worldX >= node.x &&
        worldX <= node.x + NODE_WIDTH &&
        worldY >= node.y &&
        worldY <= node.y + height
      ) {
        return node.id;
      }
    }
    return null;
  }, []);

  const openMenu = useCallback(
    (nodeId: string) => {
      const node = nodesRef.current.find((item) => item.id === nodeId);
      if (!node) return;
      const height = heightsRef.current[nodeId] ?? NODE_ESTIMATED_HEIGHT;
      const { width, height: canvasHeight } = sizeRef.current;
      const screenX = node.x * scale.value + translateX.value;
      const screenY = (node.y + height) * scale.value + translateY.value;
      const maxLeft = Math.max(spacing.sm, width - MENU_WIDTH - spacing.sm);
      const maxTop = Math.max(spacing.sm, canvasHeight - MENU_HEIGHT - spacing.sm);
      const left = Math.min(Math.max(screenX, spacing.sm), maxLeft);
      const top = Math.min(Math.max(screenY + spacing.xs, spacing.sm), maxTop);
      setMenu({ nodeId, left, top });
    },
    [scale, translateX, translateY],
  );

  const closeMenu = useCallback(() => {
    setMenu(null);
  }, []);

  const activeSelectedId =
    selectedId !== null && nodes.some((node) => node.id === selectedId) ? selectedId : null;
  const activeEditingId =
    editingId !== null && nodes.some((node) => node.id === editingId) ? editingId : null;
  const activeMenu = menu !== null && nodes.some((node) => node.id === menu.nodeId) ? menu : null;
  const loading = projectId !== '' && !snapshotReceived;

  return {
    nodes,
    loading,
    selectedId: activeSelectedId,
    editingId: activeEditingId,
    menu: activeMenu,
    heights,
    size,
    translateX,
    translateY,
    scale,
    positions,
    setSize,
    select,
    setEditingId,
    createAt,
    patchNode,
    removeNode,
    onMeasure,
    hitNodeAt,
    openMenu,
    closeMenu,
  };
}

export type UseCanvasResult = ReturnType<typeof useCanvas>;
