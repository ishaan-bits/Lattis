/**
 * GridBackground — dotted grid locked to the canvas transform.
 *
 * A static SVG sized for MIN_SCALE sits in a 0×0 wrapper (transform origin =
 * world origin) whose translation is wrapped modulo the on-screen cell size,
 * so the grid reads as infinite while the path is built only once.
 */

import { memo, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { colors } from '@/theme';

import { GRID_CELL, MIN_SCALE } from '../types';

export type GridBackgroundProps = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  width: number;
  height: number;
};

const DOT_RADIUS = 1.5;
const OVERFLOW = GRID_CELL * 2;

function GridBackgroundComponent({
  translateX,
  translateY,
  scale,
  width,
  height,
}: GridBackgroundProps): React.JSX.Element | null {
  const grid = useMemo(() => {
    if (width <= 0 || height <= 0) return null;
    const cols = Math.ceil((width / MIN_SCALE + OVERFLOW * 2) / GRID_CELL) + 1;
    const rows = Math.ceil((height / MIN_SCALE + OVERFLOW * 2) / GRID_CELL) + 1;
    let d = '';
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const cx = col * GRID_CELL;
        const cy = row * GRID_CELL;
        d +=
          `M${cx - DOT_RADIUS} ${cy}a${DOT_RADIUS} ${DOT_RADIUS} 0 1 0 ` +
          `${DOT_RADIUS * 2} 0a${DOT_RADIUS} ${DOT_RADIUS} 0 1 0 ${-DOT_RADIUS * 2} 0`;
      }
    }
    return { d, width: cols * GRID_CELL, height: rows * GRID_CELL };
  }, [width, height]);

  const animatedStyle = useAnimatedStyle(() => {
    const cell = GRID_CELL * scale.value;
    const offsetX = ((translateX.value % cell) + cell) % cell;
    const offsetY = ((translateY.value % cell) + cell) % cell;
    return {
      transform: [{ translateX: offsetX }, { translateY: offsetY }, { scale: scale.value }],
      opacity: interpolate(scale.value, [MIN_SCALE, 1], [0.16, 0.55], Extrapolation.CLAMP),
    };
  });

  if (!grid) return null;

  return (
    <Animated.View pointerEvents="none" style={[styles.layer, animatedStyle]}>
      <View style={styles.svgOffset}>
        <Svg width={grid.width} height={grid.height}>
          <Path d={grid.d} fill={colors.textMuted} />
        </Svg>
      </View>
    </Animated.View>
  );
}

export const GridBackground = memo(GridBackgroundComponent);

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    overflow: 'visible',
    transformOrigin: '0 0',
  },
  svgOffset: {
    position: 'absolute',
    left: -OVERFLOW,
    top: -OVERFLOW,
  },
});
