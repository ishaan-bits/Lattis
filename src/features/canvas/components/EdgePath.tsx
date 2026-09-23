/**
 * EdgePath — one directed cubic Bézier (stroke, arrowhead, hit target) plus
 * its centered label pill.
 *
 * Geometry runs entirely on the UI thread against the shared `positions`
 * record, so edges track node drags without re-rendering the React tree;
 * structure-only props (origin, heights, selection) arrive via re-render.
 */

import { memo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';
import { Path } from 'react-native-svg';

import { Text } from '@/components';
import { colors, radius, spacing } from '@/theme';

import {
  EDGE_LABEL_WIDTH,
  EDGE_TYPE_COLORS,
  NODE_WIDTH,
  type CanvasEdge,
  type NodePositions,
} from '../types';

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function buildEdgeGeometry(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { d: string; arrow: string; mx: number; my: number } {
  'worklet';
  const offset = Math.max(56, Math.abs(x2 - x1) * 0.45);
  const c1x = x1 + offset;
  const c1y = y1;
  const c2x = x2 - offset;
  const c2y = y2;
  const d = `M${x1} ${y1}C${c1x} ${c1y} ${c2x} ${c2y} ${x2} ${y2}`;
  const dirX = x2 - c2x;
  const dirY = y2 - c2y;
  const len = Math.sqrt(dirX * dirX + dirY * dirY) || 1;
  const ux = dirX / len;
  const uy = dirY / len;
  const bx = x2 - ux * 9;
  const by = y2 - uy * 9;
  const px = -uy * 5.5;
  const py = ux * 5.5;
  const arrow = `M${x2} ${y2}L${bx + px} ${by + py}L${bx - px} ${by - py}Z`;
  const mx = (x1 + 3 * c1x + 3 * c2x + x2) / 8;
  const my = (y1 + 3 * c1y + 3 * c2y + y2) / 8;
  return { d, arrow, mx, my };
}

export function edgeMidpoint(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { x: number; y: number } {
  'worklet';
  const offset = Math.max(56, Math.abs(x2 - x1) * 0.45);
  const c1x = x1 + offset;
  const c2x = x2 - offset;
  return {
    x: (x1 + 3 * c1x + 3 * c2x + x2) / 8,
    y: (y1 + 3 * y1 + 3 * y2 + y2) / 8,
  };
}

export function distanceToEdge(
  worldX: number,
  worldY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  threshold: number,
): boolean {
  const offset = Math.max(56, Math.abs(x2 - x1) * 0.45);
  const c1x = x1 + offset;
  const c1y = y1;
  const c2x = x2 - offset;
  const c2y = y2;
  const samples = 28;
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const mt = 1 - t;
    const px = mt * mt * mt * x1 + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * x2;
    const py = mt * mt * mt * y1 + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * y2;
    const dx = px - worldX;
    const dy = py - worldY;
    if (dx * dx + dy * dy <= threshold * threshold) return true;
  }
  return false;
}

export type EdgePathProps = {
  edge: CanvasEdge;
  selected: boolean;
  originX: number;
  originY: number;
  fromX: number;
  fromY: number;
  fromHeight: number;
  toX: number;
  toY: number;
  toHeight: number;
  positions: NodePositions;
};

function EdgePathComponent({
  edge,
  selected,
  originX,
  originY,
  fromX,
  fromY,
  fromHeight,
  toX,
  toY,
  toHeight,
  positions,
}: EdgePathProps): React.JSX.Element {
  const stroke = selected ? colors.primary : EDGE_TYPE_COLORS[edge.type];

  const lineProps = useAnimatedProps(() => {
    const fromPos = positions.value[edge.from];
    const toPos = positions.value[edge.to];
    const fx = (fromPos ? fromPos.x : fromX) + NODE_WIDTH - originX;
    const fy = (fromPos ? fromPos.y : fromY) + fromHeight / 2 - originY;
    const tx = (toPos ? toPos.x : toX) - originX;
    const ty = (toPos ? toPos.y : toY) + toHeight / 2 - originY;
    return { d: buildEdgeGeometry(fx, fy, tx, ty).d };
  });

  const arrowProps = useAnimatedProps(() => {
    const fromPos = positions.value[edge.from];
    const toPos = positions.value[edge.to];
    const fx = (fromPos ? fromPos.x : fromX) + NODE_WIDTH - originX;
    const fy = (fromPos ? fromPos.y : fromY) + fromHeight / 2 - originY;
    const tx = (toPos ? toPos.x : toX) - originX;
    const ty = (toPos ? toPos.y : toY) + toHeight / 2 - originY;
    return { d: buildEdgeGeometry(fx, fy, tx, ty).arrow };
  });

  return (
    <>
      <AnimatedPath
        animatedProps={lineProps}
        fill="none"
        stroke={stroke}
        strokeLinecap="round"
        strokeWidth={selected ? 2.5 : 2}
      />
      <AnimatedPath animatedProps={arrowProps} fill={stroke} />
    </>
  );
}

export const EdgePath = memo(EdgePathComponent);

export type EdgeLabelProps = {
  edge: CanvasEdge;
  fromX: number;
  fromY: number;
  fromHeight: number;
  toX: number;
  toY: number;
  toHeight: number;
  positions: NodePositions;
};

function EdgeLabelComponent({
  edge,
  fromX,
  fromY,
  fromHeight,
  toX,
  toY,
  toHeight,
  positions,
}: EdgeLabelProps): React.JSX.Element {
  const labelStyle = useAnimatedStyle(() => {
    const fromPos = positions.value[edge.from];
    const toPos = positions.value[edge.to];
    const fx = (fromPos ? fromPos.x : fromX) + NODE_WIDTH;
    const fy = (fromPos ? fromPos.y : fromY) + fromHeight / 2;
    const tx = toPos ? toPos.x : toX;
    const ty = (toPos ? toPos.y : toY) + toHeight / 2;
    const mid = edgeMidpoint(fx, fy, tx, ty);
    return {
      transform: [{ translateX: mid.x }, { translateY: mid.y }],
    };
  });

  return (
    <Animated.View pointerEvents="none" style={[styles.label, labelStyle]}>
      <Text variant="caption" color="textSecondary" numberOfLines={1} style={styles.labelText}>
        {edge.label ?? edge.type}
      </Text>
    </Animated.View>
  );
}

export const EdgeLabel = memo(EdgeLabelComponent);

const styles = StyleSheet.create({
  label: {
    position: 'absolute',
    left: -EDGE_LABEL_WIDTH / 2,
    top: -11,
    width: EDGE_LABEL_WIDTH,
    alignItems: 'center',
  },
  labelText: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    overflow: 'hidden',
    textAlign: 'center',
  },
});
