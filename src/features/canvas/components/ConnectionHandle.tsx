/**
 * ConnectionHandle — small grab target on a selected note's right edge.
 *
 * Dragging it draws a live preview curve (shared values) and, on release
 * over another note, creates the Firestore edge. The pan blocks the canvas
 * viewport gesture so connecting never pans the world underneath.
 */

import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { Icon } from '@/components';
import { colors, shadows } from '@/theme';

import { CONNECTION_HANDLE_SIZE, NODE_WIDTH } from '../types';

export type ConnectionHandleProps = {
  fromId: string;
  posX: SharedValue<number>;
  posY: SharedValue<number>;
  height: number;
  scaleValue: SharedValue<number>;
  panBlocker: GestureType;
  previewActive: SharedValue<number>;
  previewFrom: SharedValue<string>;
  previewX: SharedValue<number>;
  previewY: SharedValue<number>;
  onConnect: (fromId: string, worldX: number, worldY: number) => void;
};

function createConnectGesture(options: {
  fromId: string;
  posX: SharedValue<number>;
  posY: SharedValue<number>;
  height: number;
  scaleValue: SharedValue<number>;
  panBlocker: GestureType;
  previewActive: SharedValue<number>;
  previewFrom: SharedValue<string>;
  previewX: SharedValue<number>;
  previewY: SharedValue<number>;
  onConnect: (fromId: string, worldX: number, worldY: number) => void;
}): GestureType {
  const { fromId, posX, posY, height, scaleValue, panBlocker } = options;
  const { previewActive, previewFrom, previewX, previewY, onConnect } = options;
  return Gesture.Pan()
    .maxPointers(1)
    .activeOffsetX([-4, 4])
    .activeOffsetY([-4, 4])
    .blocksExternalGesture(panBlocker)
    .onStart(() => {
      previewFrom.value = fromId;
      previewX.value = posX.value + NODE_WIDTH;
      previewY.value = posY.value + height / 2;
      previewActive.value = 1;
    })
    .onUpdate((event) => {
      const scale = scaleValue.value > 0 ? scaleValue.value : 1;
      previewX.value = posX.value + NODE_WIDTH + event.translationX / scale;
      previewY.value = posY.value + height / 2 + event.translationY / scale;
    })
    .onEnd((event, success) => {
      if (!success) return;
      const scale = scaleValue.value > 0 ? scaleValue.value : 1;
      const worldX = posX.value + NODE_WIDTH + event.translationX / scale;
      const worldY = posY.value + height / 2 + event.translationY / scale;
      runOnJS(onConnect)(fromId, worldX, worldY);
    })
    .onFinalize(() => {
      previewActive.value = 0;
    });
}

export function ConnectionHandle({
  fromId,
  posX,
  posY,
  height,
  scaleValue,
  panBlocker,
  previewActive,
  previewFrom,
  previewX,
  previewY,
  onConnect,
}: ConnectionHandleProps): React.JSX.Element {
  const gesture = useMemo(
    () =>
      createConnectGesture({
        fromId,
        posX,
        posY,
        height,
        scaleValue,
        panBlocker,
        previewActive,
        previewFrom,
        previewX,
        previewY,
        onConnect,
      }),
    [
      fromId,
      posX,
      posY,
      height,
      scaleValue,
      panBlocker,
      previewActive,
      previewFrom,
      previewX,
      previewY,
      onConnect,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: posX.value }, { translateY: posY.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        accessibilityLabel="Create connection"
        accessibilityRole="button"
        hitSlop={12}
        style={[
          styles.handle,
          {
            left: NODE_WIDTH - CONNECTION_HANDLE_SIZE / 2,
            top: height / 2 - CONNECTION_HANDLE_SIZE / 2,
          },
          animatedStyle,
        ]}
      >
        <Icon name="plus" size={12} color={colors.textInverse} />
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  handle: {
    position: 'absolute',
    width: CONNECTION_HANDLE_SIZE,
    height: CONNECTION_HANDLE_SIZE,
    borderRadius: CONNECTION_HANDLE_SIZE / 2,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    ...shadows.sm,
  },
});
