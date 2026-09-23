/**
 * EdgeLayer — SVG overlay (above grid, below notes) rendering every edge as
 * a directed Bézier plus the in-flight connection preview.
 *
 * Paths sit in one world-space SVG sized from the node bounding box; curve
 * geometry animates on the UI thread from the shared `positions` record, so
 * dragging a note never re-renders this layer or the notes themselves.
 */

import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

import { buildEdgeGeometry, EdgeLabel, EdgePath } from './EdgePath';
import {
  EDGE_SVG_PAD,
  NODE_ESTIMATED_HEIGHT,
  NODE_WIDTH,
  type CanvasEdge,
  type CanvasNode,
  type NodePositions,
} from '../types';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export type EdgeLayerProps = {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  heights: Record<string, number>;
  positions: NodePositions;
  selectedEdgeId: string | null;
  previewActive: SharedValue<number>;
  previewFrom: SharedValue<string>;
  previewX: SharedValue<number>;
  previewY: SharedValue<number>;
};

type PreviewEdgeProps = {
  positions: NodePositions;
  heights: Record<string, number>;
  previewActive: SharedValue<number>;
  previewFrom: SharedValue<string>;
  previewX: SharedValue<number>;
  previewY: SharedValue<number>;
  originX: number;
  originY: number;
};

function PreviewEdge({
  positions,
  heights,
  previewActive,
  previewFrom,
  previewX,
  previewY,
  originX,
  originY,
}: PreviewEdgeProps): React.JSX.Element {
  const animatedProps = useAnimatedProps(() => {
    if (previewActive.value === 0) return { d: '' };
    const start = positions.value[previewFrom.value];
    if (!start) return { d: '' };
    const fromHeight = heights[previewFrom.value] ?? NODE_ESTIMATED_HEIGHT;
    const geometry = buildEdgeGeometry(
      start.x + NODE_WIDTH - originX,
      start.y + fromHeight / 2 - originY,
      previewX.value - originX,
      previewY.value - originY,
    );
    return { d: geometry.d };
  });

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      fill="none"
      stroke={colors.primary}
      strokeDasharray="6 5"
      strokeLinecap="round"
      strokeWidth={2}
    />
  );
}

function EdgeLayerComponent({
  nodes,
  edges,
  heights,
  positions,
  selectedEdgeId,
  previewActive,
  previewFrom,
  previewX,
  previewY,
}: EdgeLayerProps): React.JSX.Element {
  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const visible = useMemo(
    () =>
      edges.filter(
        (edge) => edge.from !== edge.to && nodeById.has(edge.from) && nodeById.has(edge.to),
      ),
    [edges, nodeById],
  );

  const box = useMemo(() => {
    if (nodes.length === 0) {
      return {
        x: -EDGE_SVG_PAD,
        y: -EDGE_SVG_PAD,
        width: EDGE_SVG_PAD * 2,
        height: EDGE_SVG_PAD * 2,
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
      maxY = Math.max(maxY, node.y + (heights[node.id] ?? NODE_ESTIMATED_HEIGHT));
    }
    return {
      x: minX - EDGE_SVG_PAD,
      y: minY - EDGE_SVG_PAD,
      width: maxX - minX + EDGE_SVG_PAD * 2,
      height: maxY - minY + EDGE_SVG_PAD * 2,
    };
  }, [nodes, heights]);

  if (nodes.length === 0 && visible.length === 0) return <View style={styles.root} />;

  return (
    <View pointerEvents="box-none" style={styles.root}>
      <Svg
        height={box.height}
        pointerEvents="box-none"
        style={[styles.svg, { left: box.x, top: box.y }]}
        width={box.width}
      >
        {visible.map((edge) => {
          const from = nodeById.get(edge.from);
          const to = nodeById.get(edge.to);
          if (!from || !to) return null;
          return (
            <EdgePath
              key={edge.id}
              edge={edge}
              fromHeight={heights[edge.from] ?? NODE_ESTIMATED_HEIGHT}
              fromX={from.x}
              fromY={from.y}
              originX={box.x}
              originY={box.y}
              positions={positions}
              selected={selectedEdgeId === edge.id}
              toHeight={heights[edge.to] ?? NODE_ESTIMATED_HEIGHT}
              toX={to.x}
              toY={to.y}
            />
          );
        })}
        <PreviewEdge
          heights={heights}
          originX={box.x}
          originY={box.y}
          positions={positions}
          previewActive={previewActive}
          previewFrom={previewFrom}
          previewX={previewX}
          previewY={previewY}
        />
      </Svg>
      {visible.map((edge) => {
        const from = nodeById.get(edge.from);
        const to = nodeById.get(edge.to);
        if (!from || !to) return null;
        return (
          <EdgeLabel
            key={edge.id}
            edge={edge}
            fromHeight={heights[edge.from] ?? NODE_ESTIMATED_HEIGHT}
            fromX={from.x}
            fromY={from.y}
            positions={positions}
            toHeight={heights[edge.to] ?? NODE_ESTIMATED_HEIGHT}
            toX={to.x}
            toY={to.y}
          />
        );
      })}
    </View>
  );
}

export const EdgeLayer = memo(EdgeLayerComponent);

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    overflow: 'visible',
  },
  svg: {
    position: 'absolute',
  },
});
