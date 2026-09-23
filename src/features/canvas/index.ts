/**
 * Canvas feature — infinite canvas workspace for spatial note-taking.
 * Screen composition lives under `app/`; this folder owns the state hook,
 * gestures, components, and the feature-local Firestore service.
 */

export { InfiniteCanvas, type InfiniteCanvasProps } from './components/InfiniteCanvas';
export { useCanvas, type UseCanvasResult } from './hooks/useCanvas';
export { useEdges, type UseEdgesResult } from './hooks/useEdges';
export {
  createCanvasEdge,
  deleteCanvasEdge,
  patchCanvasEdge,
  watchCanvasEdges,
} from './services/edgeService';
export {
  createCanvasNode,
  deleteCanvasNode,
  patchCanvasNode,
  watchCanvasNodes,
} from './services/nodeService';
export {
  CONNECTION_HANDLE_SIZE,
  DEFAULT_NODE_COLOR,
  EDGE_HIT_STROKE,
  EDGE_MENU_HEIGHT,
  EDGE_SVG_PAD,
  EDGE_TYPE_COLORS,
  EDGE_TYPES,
  EDGE_TYPE_MENU_HEIGHT,
  GRID_CELL,
  MAX_SCALE,
  MENU_HEIGHT,
  MENU_WIDTH,
  MIN_SCALE,
  NODE_COLORS,
  NODE_ESTIMATED_HEIGHT,
  NODE_WIDTH,
  WRITE_DEBOUNCE_MS,
  type CanvasEdge,
  type CanvasEdgePatch,
  type CanvasMenu,
  type CanvasNode,
  type CanvasNodePatch,
  type EdgeMenu,
  type EdgeType,
  type NodePositions,
  type NodeXY,
} from './types';
