/**
 * CanvasNode — draggable, editable sticky note.
 *
 * Position runs through shared values (UI thread) while dragging; gesture end
 * commits a debounced Firestore patch. Pan is only enabled when the note is
 * selected and not being edited, and it blocks the canvas pan so a selected
 * note always wins the drag. AI stream text arrives via `aiDraftText` and is
 * adopted into local content while generation (or its Firestore echo) is live.
 */

import { memo, useLayoutEffect, useMemo, useState } from 'react';
import { StyleSheet, type LayoutChangeEvent } from 'react-native';
import {
  Gesture,
  GestureDetector,
  type GestureType,
  type SimultaneousGesture,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { colors, radius, shadows } from '@/theme';

import { CanvasNote } from './CanvasNote';
import { ConnectionHandle } from './ConnectionHandle';
import {
  type CanvasNode as CanvasNodeData,
  type CanvasNodePatch,
  type NodePositions,
} from '../types';

export type CanvasNodeProps = {
  node: CanvasNodeData;
  selected: boolean;
  editing: boolean;
  aiGenerating: boolean;
  aiActive: boolean;
  aiDraftText: string | null;
  panBlocker: GestureType;
  scaleValue: SharedValue<number>;
  positions: NodePositions;
  previewActive: SharedValue<number>;
  previewFrom: SharedValue<string>;
  previewX: SharedValue<number>;
  previewY: SharedValue<number>;
  select: (nodeId: string | null) => void;
  setEditingId: (nodeId: string | null) => void;
  patchNode: (nodeId: string, patch: CanvasNodePatch) => void;
  onMeasure: (nodeId: string, height: number) => void;
  onLongPress: (nodeId: string) => void;
  onConnect: (fromId: string, worldX: number, worldY: number) => void;
  onOpenAI: (nodeId: string) => void;
  onStopAI: () => void;
};

function syncPosition(
  posX: SharedValue<number>,
  posY: SharedValue<number>,
  isDragging: SharedValue<boolean>,
  x: number,
  y: number,
): void {
  if (isDragging.value) return;
  posX.value = x;
  posY.value = y;
}

function createNodeGesture(options: {
  panEnabled: boolean;
  longPressEnabled: boolean;
  panBlocker: GestureType;
  posX: SharedValue<number>;
  posY: SharedValue<number>;
  originX: SharedValue<number>;
  originY: SharedValue<number>;
  isDragging: SharedValue<boolean>;
  scaleValue: SharedValue<number>;
  positions: NodePositions;
  select: (nodeId: string | null) => void;
  onLongPress: (nodeId: string) => void;
  commit: (x: number, y: number) => void;
  nodeId: string;
}): SimultaneousGesture {
  const { panBlocker, panEnabled, longPressEnabled, nodeId } = options;
  const { posX, posY, originX, originY, isDragging, scaleValue, positions } = options;
  const { select, onLongPress, commit } = options;

  const pan = Gesture.Pan()
    .enabled(panEnabled)
    .maxPointers(1)
    .activeOffsetX([-10, 10])
    .activeOffsetY([-10, 10])
    .blocksExternalGesture(panBlocker)
    .onStart(() => {
      originX.value = posX.value;
      originY.value = posY.value;
      isDragging.value = true;
    })
    .onUpdate((event) => {
      const nextX = originX.value + event.translationX / scaleValue.value;
      const nextY = originY.value + event.translationY / scaleValue.value;
      posX.value = nextX;
      posY.value = nextY;
      positions.value = { ...positions.value, [nodeId]: { x: nextX, y: nextY } };
    })
    .onEnd((_event, success) => {
      if (!success) return;
      const moved =
        Math.abs(posX.value - originX.value) > 1 || Math.abs(posY.value - originY.value) > 1;
      if (moved) runOnJS(commit)(posX.value, posY.value);
    })
    .onFinalize(() => {
      isDragging.value = false;
    });

  const tap = Gesture.Tap()
    .maxDistance(12)
    .onEnd((_event, success) => {
      if (success) runOnJS(select)(nodeId);
    });

  const longPress = Gesture.LongPress()
    .enabled(longPressEnabled)
    .minDuration(420)
    .maxDistance(12)
    .onStart(() => {
      runOnJS(onLongPress)(nodeId);
    });

  return Gesture.Simultaneous(pan, tap, longPress);
}

function CanvasNodeComponent({
  node,
  selected,
  editing,
  aiGenerating,
  aiActive,
  aiDraftText,
  panBlocker,
  scaleValue,
  positions,
  previewActive,
  previewFrom,
  previewX,
  previewY,
  select,
  setEditingId,
  patchNode,
  onMeasure,
  onLongPress,
  onConnect,
  onOpenAI,
  onStopAI,
}: CanvasNodeProps): React.JSX.Element {
  const posX = useSharedValue(node.x);
  const posY = useSharedValue(node.y);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  const [title, setTitle] = useState(node.title);
  const [content, setContent] = useState(node.content);
  const [selfHeight, setSelfHeight] = useState(0);
  const [focused, setFocused] = useState(false);
  const [syncedTitle, setSyncedTitle] = useState(node.title);
  const [syncedContent, setSyncedContent] = useState(node.content);
  const [syncedDraft, setSyncedDraft] = useState<string | null>(aiDraftText);

  if (syncedTitle !== node.title) {
    setSyncedTitle(node.title);
    if (!focused) {
      setTitle(node.title);
    }
  }

  if (syncedContent !== node.content) {
    setSyncedContent(node.content);
    if (!focused && !aiGenerating && aiDraftText === null) {
      setContent(node.content);
    }
  }

  if (syncedDraft !== aiDraftText) {
    const previousDraft = syncedDraft;
    setSyncedDraft(aiDraftText);
    if (aiDraftText !== null) {
      setContent(aiDraftText);
    } else if (!focused && !aiGenerating && previousDraft !== null) {
      setContent((current) => (current !== previousDraft ? current : node.content));
    }
  }

  useLayoutEffect(() => {
    syncPosition(posX, posY, isDragging, node.x, node.y);
  }, [node.x, node.y, posX, posY, isDragging]);

  const commit = useMemo(
    () => (x: number, y: number) => {
      patchNode(node.id, { x: Math.round(x), y: Math.round(y) });
    },
    [patchNode, node.id],
  );

  const nodeGesture = useMemo(
    () =>
      createNodeGesture({
        panEnabled: selected && !editing,
        longPressEnabled: !editing,
        panBlocker,
        posX,
        posY,
        originX,
        originY,
        isDragging,
        scaleValue,
        positions,
        select,
        onLongPress,
        commit,
        nodeId: node.id,
      }),
    [
      selected,
      editing,
      panBlocker,
      posX,
      posY,
      originX,
      originY,
      isDragging,
      scaleValue,
      positions,
      select,
      onLongPress,
      commit,
      node.id,
    ],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: posX.value }, { translateY: posY.value }],
  }));

  function handleLayout(event: LayoutChangeEvent): void {
    const height = event.nativeEvent.layout.height;
    onMeasure(node.id, height);
    setSelfHeight((prev) => (Math.abs(prev - height) < 0.5 ? prev : height));
  }

  function handleFocus(): void {
    setFocused(true);
    setEditingId(node.id);
    select(node.id);
  }

  function handleBlur(): void {
    setFocused(false);
    setEditingId(null);
    patchNode(node.id, { title, content });
  }

  function handleTitleChange(text: string): void {
    setTitle(text);
    patchNode(node.id, { title: text });
  }

  function handleContentChange(text: string): void {
    setContent(text);
    patchNode(node.id, { content: text });
  }

  function handleOpenAI(): void {
    onOpenAI(node.id);
  }

  return (
    <>
      <GestureDetector gesture={nodeGesture}>
        <Animated.View
          onLayout={handleLayout}
          style={[
            styles.card,
            selected && styles.cardSelected,
            { borderColor: selected ? node.color : colors.border, width: node.width },
            animatedStyle,
          ]}
        >
          <CanvasNote
            aiActive={aiActive}
            aiGenerating={aiGenerating}
            color={node.color}
            content={content}
            onBlur={handleBlur}
            onChangeContent={handleContentChange}
            onChangeTitle={handleTitleChange}
            onFocus={handleFocus}
            onOpenAI={handleOpenAI}
            onStopAI={onStopAI}
            title={title}
          />
        </Animated.View>
      </GestureDetector>
      {selected && !editing && selfHeight > 0 ? (
        <ConnectionHandle
          fromId={node.id}
          height={selfHeight}
          onConnect={onConnect}
          panBlocker={panBlocker}
          posX={posX}
          posY={posY}
          previewActive={previewActive}
          previewFrom={previewFrom}
          previewX={previewX}
          previewY={previewY}
          scaleValue={scaleValue}
        />
      ) : null}
    </>
  );
}

export const CanvasNode = memo(CanvasNodeComponent);

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.md,
  },
  cardSelected: {
    zIndex: 10,
  },
});
