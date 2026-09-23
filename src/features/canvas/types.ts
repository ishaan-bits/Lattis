/**
 * Canvas feature types and geometry constants.
 */

import type { SharedValue } from 'react-native-reanimated';

export type CanvasNode = {
  id: string;
  type: 'text';
  title: string;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  createdAt: string;
  updatedAt: string;
  /** Local-only generation flag — never written to Firestore. */
  aiGenerating?: boolean;
};

export type CanvasNodePatch = Partial<Pick<CanvasNode, 'title' | 'content' | 'x' | 'y' | 'color'>>;

export type NodeAIAction = 'continue' | 'summarize' | 'rewrite' | 'bullets' | 'explain';

export type NodeAIToolbarPos = {
  left: number;
  top: number;
};

export type CanvasMenu = {
  nodeId: string;
  left: number;
  top: number;
};

export type EdgeType = 'supports' | 'depends' | 'contradicts' | 'reference' | 'inspiration';

export type CanvasEdge = {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  label?: string;
  createdAt: string;
};

export type CanvasEdgePatch = Partial<Pick<CanvasEdge, 'type' | 'label'>>;

export type EdgeMenu = {
  edgeId: string;
  left: number;
  top: number;
};

export type NodeXY = { x: number; y: number };

export type NodePositions = SharedValue<Record<string, NodeXY>>;

export const NODE_COLORS = {
  blue: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F97316',
  green: '#22C55E',
  pink: '#EC4899',
} as const;

export const EDGE_TYPES: readonly EdgeType[] = [
  'supports',
  'depends',
  'contradicts',
  'reference',
  'inspiration',
];

export const NODE_AI_ACTIONS: readonly NodeAIAction[] = [
  'continue',
  'summarize',
  'rewrite',
  'bullets',
  'explain',
];

export const NODE_AI_LABELS: Record<NodeAIAction, string> = {
  continue: 'Continue writing',
  summarize: 'Summarize',
  rewrite: 'Rewrite better',
  bullets: 'Bullet points',
  explain: 'Explain simply',
};

export const EDGE_TYPE_COLORS: Record<EdgeType, string> = {
  supports: '#22C55E',
  depends: '#3B82F6',
  contradicts: '#EF4444',
  reference: '#9AA6B8',
  inspiration: '#8B5CF6',
};

export const DEFAULT_NODE_COLOR = NODE_COLORS.blue;
export const NODE_WIDTH = 220;
export const NODE_ESTIMATED_HEIGHT = 128;
export const MIN_SCALE = 0.4;
export const MAX_SCALE = 3;
export const GRID_CELL = 32;
export const WRITE_DEBOUNCE_MS = 450;
export const MENU_WIDTH = 168;
export const MENU_HEIGHT = 132;
export const EDGE_MENU_HEIGHT = 152;
export const EDGE_TYPE_MENU_HEIGHT = 272;
export const EDGE_HIT_STROKE = 24;
export const EDGE_SVG_PAD = 480;
export const EDGE_LABEL_WIDTH = 112;
export const CONNECTION_HANDLE_SIZE = 20;
export const NODE_AI_TOOLBAR_WIDTH = 208;
export const NODE_AI_TOOLBAR_HEIGHT = 248;
