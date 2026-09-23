/**
 * Minimap — read-only overview of canvas notes and edges with an animated viewport rect.
 *
 * Bounds come from the node bounding box (padded, or the opening viewport
 * when empty); edge lines are memoized plain SVG lines, note dots are memoized
 * plain views, and only the viewport rect animates on the UI thread.
 */

import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { colors, radius, spacing } from '@/theme';

import {
  EDGE_TYPE_COLORS,
  NODE_ESTIMATED_HEIGHT,
  NODE_WIDTH,
  type CanvasEdge,
  type CanvasNode,
} from '../types';

const MINIMAP_WIDTH = 116;
const MINIMAP_HEIGHT = 76;
const DOT_SIZE = 6;
const BOUNDS_PADDING = 240;

export type MinimapProps = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  viewportWidth: number;
  viewportHeight: number;
};

function MinimapComponent({
  nodes,
  edges,
  translateX,
  translateY,
  scale,
  viewportWidth,
  viewportHeight,
}: MinimapProps): React.JSX.Element | null {
  const bounds = useMemo(() => {
    if (viewportWidth <= 0 || viewportHeight <= 0) return null;
    if (nodes.length === 0) {
      return {
        x: -BOUNDS_PADDING,
        y: -BOUNDS_PADDING,
        width: viewportWidth + BOUNDS_PADDING * 2,
        height: viewportHeight + BOUNDS_PADDING * 2,
      };
    }
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const node of nodes) {
      minX = Math.min(minX, node.x);
      minY = Math.min(minY, node.y);
      maxX = Math.max(maxX, node.x + NODE_WIDTH);
      maxY = Math.max(maxY, node.y + NODE_ESTIMATED_HEIGHT);
    }
    return {
      x: minX - BOUNDS_PADDING,
      y: minY - BOUNDS_PADDING,
      width: maxX - minX + BOUNDS_PADDING * 2,
      height: maxY - minY + BOUNDS_PADDING * 2,
    };
  }, [nodes, viewportWidth, viewportHeight]);

  const fit = useMemo(() => {
    if (!bounds) return null;
    const k = Math.min(MINIMAP_WIDTH / bounds.width, MINIMAP_HEIGHT / bounds.height);
    return {
      k,
      offsetX: (MINIMAP_WIDTH - bounds.width * k) / 2,
      offsetY: (MINIMAP_HEIGHT - bounds.height * k) / 2,
    };
  }, [bounds]);

  const rectStyle = useAnimatedStyle(() => {
    if (!bounds || !fit) return {};
    const worldX = -translateX.value / scale.value;
    const worldY = -translateY.value / scale.value;
    const worldWidth = viewportWidth / scale.value;
    const worldHeight = viewportHeight / scale.value;
    const left = fit.offsetX + (worldX - bounds.x) * fit.k;
    const top = fit.offsetY + (worldY - bounds.y) * fit.k;
    const width = Math.min(worldWidth * fit.k, MINIMAP_WIDTH);
    const height = Math.min(worldHeight * fit.k, MINIMAP_HEIGHT);
    return {
      left: Math.min(Math.max(left, 0), MINIMAP_WIDTH - width),
      top: Math.min(Math.max(top, 0), MINIMAP_HEIGHT - height),
      width,
      height,
    };
  }, [bounds, fit, viewportWidth, viewportHeight]);

  const dots = useMemo(() => {
    if (!bounds || !fit) return [];
    return nodes.map((node) => ({
      id: node.id,
      color: node.color,
      left: fit.offsetX + (node.x + NODE_WIDTH / 2 - bounds.x) * fit.k - DOT_SIZE / 2,
      top: fit.offsetY + (node.y + NODE_ESTIMATED_HEIGHT / 2 - bounds.y) * fit.k - DOT_SIZE / 2,
    }));
  }, [nodes, bounds, fit]);

  const edgeLines = useMemo(() => {
    if (!bounds || !fit) return [];
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const lines: { id: string; x1: number; y1: number; x2: number; y2: number; stroke: string }[] =
      [];
    for (const edge of edges) {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to || from.id === to.id) continue;
      lines.push({
        id: edge.id,
        x1: fit.offsetX + (from.x + NODE_WIDTH - bounds.x) * fit.k,
        y1: fit.offsetY + (from.y + NODE_ESTIMATED_HEIGHT / 2 - bounds.y) * fit.k,
        x2: fit.offsetX + (to.x - bounds.x) * fit.k,
        y2: fit.offsetY + (to.y + NODE_ESTIMATED_HEIGHT / 2 - bounds.y) * fit.k,
        stroke: EDGE_TYPE_COLORS[edge.type],
      });
    }
    return lines;
  }, [edges, nodes, bounds, fit]);

  if (!bounds || !fit) return null;

  return (
    <View pointerEvents="none" style={styles.box}>
      {edgeLines.length > 0 ? (
        <Svg
          height={MINIMAP_HEIGHT}
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          width={MINIMAP_WIDTH}
        >
          {edgeLines.map((line) => (
            <Line
              key={line.id}
              stroke={line.stroke}
              strokeWidth={1}
              x1={line.x1}
              x2={line.x2}
              y1={line.y1}
              y2={line.y2}
            />
          ))}
        </Svg>
      ) : null}
      {dots.map((dot) => (
        <View
          key={dot.id}
          style={[styles.dot, { left: dot.left, top: dot.top, backgroundColor: dot.color }]}
        />
      ))}
      <Animated.View style={[styles.viewport, rectStyle]} />
    </View>
  );
}

export const Minimap = memo(MinimapComponent);

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: MINIMAP_WIDTH,
    height: MINIMAP_HEIGHT,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  viewport: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: colors.primarySoft,
    borderRadius: 2,
  },
});
