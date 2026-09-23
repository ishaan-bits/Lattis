/**
 * InfiniteCanvas — pan/zoom surface hosting grid, edges, notes, minimap, and menus.
 *
 * Viewport gestures (one-finger pan, focal-following pinch that doubles as
 * two-finger pan, tap-to-select, double-tap-to-create) run on the UI thread
 * against shared values; taps hit-test world coordinates in JS so create and
 * select stay correct regardless of child gesture priority. Edges render in
 * an SVG layer below the notes and redraw from the shared positions record,
 * while connection handles on the selected note create directed links.
 */

import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Gesture, GestureDetector, type GestureType } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { trigger } from 'react-native-haptic-feedback';

import { Icon, Text } from '@/components';
import { PressableScale } from '@/features/projects';
import { patchNodeAIContent } from '@/services';
import { colors, radius, shadows, spacing } from '@/theme';

import { CanvasNode } from './CanvasNode';
import { EdgeLayer } from './EdgeLayer';
import { distanceToEdge, edgeMidpoint } from './EdgePath';
import { GridBackground } from './GridBackground';
import { Minimap } from './Minimap';
import { NodeToolbar } from './NodeToolbar';
import { useCanvas } from '../hooks/useCanvas';
import { useEdges } from '../hooks/useEdges';
import { useNodeAI } from '../hooks/useNodeAI';
import {
  EDGE_HIT_STROKE,
  EDGE_MENU_HEIGHT,
  EDGE_TYPE_COLORS,
  EDGE_TYPE_MENU_HEIGHT,
  EDGE_TYPES,
  MAX_SCALE,
  MENU_WIDTH,
  MIN_SCALE,
  NODE_AI_TOOLBAR_HEIGHT,
  NODE_AI_TOOLBAR_WIDTH,
  NODE_ESTIMATED_HEIGHT,
  NODE_WIDTH,
  type EdgeType,
  type NodeAIAction,
  type NodeAIToolbarPos,
} from '../types';

const DOUBLE_TAP_CREATE_GUARD_MS = 350;
const EDGE_PRESS_GUARD_MS = 300;

let lastCreateAtMs = 0;
let lastEdgePressAtMs = 0;

type ViewportGestureOptions = {
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  scale: SharedValue<number>;
  startX: SharedValue<number>;
  startY: SharedValue<number>;
  onBegin: () => void;
};

function createViewportPan(options: ViewportGestureOptions & { enabled: boolean }): GestureType {
  return Gesture.Pan()
    .enabled(options.enabled)
    .maxPointers(1)
    .activeOffsetX([-12, 12])
    .activeOffsetY([-12, 12])
    .onBegin(() => {
      options.startX.value = options.translateX.value;
      options.startY.value = options.translateY.value;
      runOnJS(options.onBegin)();
    })
    .onUpdate((event) => {
      options.translateX.value = options.startX.value + event.translationX;
      options.translateY.value = options.startY.value + event.translationY;
    });
}

function createViewportPinch(
  options: ViewportGestureOptions & {
    startScale: SharedValue<number>;
    startFocalX: SharedValue<number>;
    startFocalY: SharedValue<number>;
  },
): GestureType {
  return Gesture.Pinch()
    .onBegin(() => {
      runOnJS(options.onBegin)();
    })
    .onStart((event) => {
      options.startScale.value = Math.max(options.scale.value, 0.0001);
      options.startX.value = options.translateX.value;
      options.startY.value = options.translateY.value;
      options.startFocalX.value = event.focalX;
      options.startFocalY.value = event.focalY;
    })
    .onUpdate((event) => {
      const base = options.startScale.value;
      const next = Math.min(Math.max(base * event.scale, MIN_SCALE), MAX_SCALE);
      const worldX = (options.startFocalX.value - options.startX.value) / base;
      const worldY = (options.startFocalY.value - options.startY.value) / base;
      options.scale.value = next;
      options.translateX.value = event.focalX - worldX * next;
      options.translateY.value = event.focalY - worldY * next;
    });
}

export type InfiniteCanvasProps = {
  projectId: string;
};

export function InfiniteCanvas({ projectId }: InfiniteCanvasProps): React.JSX.Element {
  const {
    nodes,
    loading,
    selectedId,
    editingId,
    menu,
    heights,
    size,
    setSize,
    translateX,
    translateY,
    scale,
    positions,
    select,
    setEditingId,
    createAt,
    patchNode,
    removeNode,
    onMeasure,
    hitNodeAt,
    openMenu,
    closeMenu,
  } = useCanvas(projectId);

  const {
    edges,
    selectedEdgeId,
    edgeMenu,
    openEdgeMenu,
    closeEdgeMenu,
    createEdge,
    patchEdge,
    removeEdge,
  } = useEdges(projectId);

  const [edgeTypePickerOpen, setEdgeTypePickerOpen] = useState(false);
  const [aiTargetId, setAiTargetId] = useState<string | null>(null);
  const [aiToolbarPos, setAiToolbarPos] = useState<NodeAIToolbarPos | null>(null);
  const [aiDraft, setAiDraft] = useState<{ nodeId: string; text: string } | null>(null);

  const pinchScale0 = useSharedValue(1);
  const pinchTx0 = useSharedValue(0);
  const pinchTy0 = useSharedValue(0);
  const pinchFx0 = useSharedValue(0);
  const pinchFy0 = useSharedValue(0);
  const panTx0 = useSharedValue(0);
  const panTy0 = useSharedValue(0);
  const previewActive = useSharedValue(0);
  const previewFrom = useSharedValue('');
  const previewX = useSharedValue(0);
  const previewY = useSharedValue(0);

  const handleLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    },
    [setSize],
  );

  const getSnapshot = useCallback(
    (nodeId: string) => nodes.find((item) => item.id === nodeId),
    [nodes],
  );

  const handleAIContent = useCallback(
    (nodeId: string, text: string) => {
      setAiDraft({ nodeId, text });
      patchNode(nodeId, { content: text });
    },
    [patchNode],
  );

  const handleAIFinish = useCallback(
    (nodeId: string, text: string) => {
      setAiDraft({ nodeId, text });
      patchNodeAIContent(projectId, nodeId, { content: text });
    },
    [projectId],
  );

  const aiOptions = useMemo(
    () => ({
      getSnapshot,
      onContent: handleAIContent,
      onFinish: handleAIFinish,
    }),
    [getSnapshot, handleAIContent, handleAIFinish],
  );

  const { generating, generate, stop } = useNodeAI(projectId, aiTargetId, aiOptions);

  if (aiDraft !== null) {
    const draftNode = nodes.find((item) => item.id === aiDraft.nodeId);
    if (draftNode !== undefined && draftNode.content === aiDraft.text) {
      setAiDraft(null);
    }
  }

  const dismissAIToolbar = useCallback(() => {
    if (generating) return;
    setAiTargetId(null);
    setAiToolbarPos(null);
  }, [generating]);

  const selectNode = useCallback(
    (nodeId: string | null) => {
      closeEdgeMenu();
      setEdgeTypePickerOpen(false);
      if (nodeId !== aiTargetId && !generating) {
        setAiTargetId(null);
        setAiToolbarPos(null);
      }
      select(nodeId);
    },
    [closeEdgeMenu, select, aiTargetId, generating],
  );

  const openAIToolbar = useCallback(
    (nodeId: string) => {
      const node = nodes.find((item) => item.id === nodeId);
      if (!node) return;
      closeMenu();
      closeEdgeMenu();
      setEdgeTypePickerOpen(false);
      const height = heights[nodeId] ?? NODE_ESTIMATED_HEIGHT;
      const screenLeft = node.x * scale.value + translateX.value;
      const screenTop = node.y * scale.value + translateY.value;
      const screenBottom = (node.y + height) * scale.value + translateY.value;
      const maxLeft = Math.max(spacing.sm, size.width - NODE_AI_TOOLBAR_WIDTH - spacing.sm);
      const left = Math.min(Math.max(screenLeft, spacing.sm), maxLeft);
      const belowTop = screenBottom + spacing.xs;
      const fitsBelow = belowTop + NODE_AI_TOOLBAR_HEIGHT <= size.height - spacing.sm;
      const aboveTop = screenTop - NODE_AI_TOOLBAR_HEIGHT - spacing.xs;
      const top = fitsBelow
        ? Math.max(spacing.sm, belowTop)
        : Math.max(
            spacing.sm,
            Math.min(aboveTop, size.height - NODE_AI_TOOLBAR_HEIGHT - spacing.sm),
          );
      select(nodeId);
      setAiTargetId(nodeId);
      setAiToolbarPos({ left, top });
    },
    [
      nodes,
      heights,
      scale,
      translateX,
      translateY,
      size.width,
      size.height,
      closeMenu,
      closeEdgeMenu,
      select,
    ],
  );

  const handleDoubleTap = useCallback(
    (localX: number, localY: number) => {
      const worldX = (localX - translateX.value) / scale.value;
      const worldY = (localY - translateY.value) / scale.value;
      if (hitNodeAt(worldX, worldY)) return;
      lastCreateAtMs = Date.now();
      createAt(worldX, worldY);
    },
    [translateX, translateY, scale, hitNodeAt, createAt],
  );

  const handleLongPress = useCallback(
    (nodeId: string) => {
      trigger('impactMedium', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      selectNode(nodeId);
      openMenu(nodeId);
    },
    [selectNode, openMenu],
  );

  const handleViewportBegin = useCallback(() => {
    closeMenu();
    closeEdgeMenu();
    setEdgeTypePickerOpen(false);
    dismissAIToolbar();
  }, [closeMenu, closeEdgeMenu, dismissAIToolbar]);

  const handleEdgePress = useCallback(
    (edgeId: string) => {
      lastEdgePressAtMs = Date.now();
      const edge = edges.find((item) => item.id === edgeId);
      if (!edge) return;
      const from = nodes.find((node) => node.id === edge.from);
      const to = nodes.find((node) => node.id === edge.to);
      if (!from || !to) return;
      const fromHeight = heights[edge.from] ?? NODE_ESTIMATED_HEIGHT;
      const toHeight = heights[edge.to] ?? NODE_ESTIMATED_HEIGHT;
      const mid = edgeMidpoint(
        from.x + NODE_WIDTH,
        from.y + fromHeight / 2,
        to.x,
        to.y + toHeight / 2,
      );
      const screenX = mid.x * scale.value + translateX.value;
      const screenY = mid.y * scale.value + translateY.value;
      const menuHeight = EDGE_MENU_HEIGHT;
      const maxLeft = Math.max(spacing.sm, size.width - MENU_WIDTH - spacing.sm);
      const maxTop = Math.max(spacing.sm, size.height - menuHeight - spacing.sm);
      const left = Math.min(Math.max(screenX - MENU_WIDTH / 2, spacing.sm), maxLeft);
      const top = Math.min(Math.max(screenY + 16, spacing.sm), maxTop);
      setEdgeTypePickerOpen(false);
      openEdgeMenu(edgeId, left, top);
    },
    [edges, heights, nodes, openEdgeMenu, scale, size.height, size.width, translateX, translateY],
  );

  const hitEdgeAt = useCallback(
    (worldX: number, worldY: number): string | null => {
      const threshold = EDGE_HIT_STROKE / 2 / Math.max(scale.value, 0.0001);
      for (let index = edges.length - 1; index >= 0; index -= 1) {
        const edge = edges[index];
        if (!edge) continue;
        const from = nodes.find((node) => node.id === edge.from);
        const to = nodes.find((node) => node.id === edge.to);
        if (!from || !to || from.id === to.id) continue;
        const fromHeight = heights[edge.from] ?? NODE_ESTIMATED_HEIGHT;
        const toHeight = heights[edge.to] ?? NODE_ESTIMATED_HEIGHT;
        const hit = distanceToEdge(
          worldX,
          worldY,
          from.x + NODE_WIDTH,
          from.y + fromHeight / 2,
          to.x,
          to.y + toHeight / 2,
          threshold,
        );
        if (hit) return edge.id;
      }
      return null;
    },
    [edges, heights, nodes, scale],
  );

  const handleSingleTap = useCallback(
    (localX: number, localY: number) => {
      dismissAIToolbar();
      if (Date.now() - lastCreateAtMs < DOUBLE_TAP_CREATE_GUARD_MS) return;
      if (Date.now() - lastEdgePressAtMs < EDGE_PRESS_GUARD_MS) return;
      const worldX = (localX - translateX.value) / scale.value;
      const worldY = (localY - translateY.value) / scale.value;
      const edgeId = hitEdgeAt(worldX, worldY);
      if (edgeId) {
        handleEdgePress(edgeId);
        return;
      }
      selectNode(hitNodeAt(worldX, worldY));
    },
    [
      dismissAIToolbar,
      translateX,
      translateY,
      scale,
      hitEdgeAt,
      handleEdgePress,
      hitNodeAt,
      selectNode,
    ],
  );

  const handleConnect = useCallback(
    (fromId: string, worldX: number, worldY: number) => {
      const target = hitNodeAt(worldX, worldY);
      if (!target || target === fromId) return;
      const created = createEdge(fromId, target);
      if (created) {
        trigger('impactLight', {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      }
    },
    [createEdge, hitNodeAt],
  );

  const removeNodeWithEdges = useCallback(
    (nodeId: string) => {
      if (aiTargetId === nodeId) {
        stop();
        setAiTargetId(null);
        setAiToolbarPos(null);
      }
      if (aiDraft !== null && aiDraft.nodeId === nodeId) {
        setAiDraft(null);
      }
      for (const edge of edges) {
        if (edge.from === nodeId || edge.to === nodeId) removeEdge(edge.id);
      }
      removeNode(nodeId);
    },
    [aiTargetId, aiDraft, edges, removeEdge, removeNode, stop],
  );

  const renameEdge = useCallback(
    (edgeId: string) => {
      const edge = edges.find((item) => item.id === edgeId);
      if (!edge) return;
      if (Platform.OS !== 'ios') return;
      Alert.prompt(
        'Rename edge',
        'Label shown on the curve',
        (text) => {
          if (text !== undefined) patchEdge(edgeId, { label: text });
        },
        'plain-text',
        edge.label ?? '',
      );
    },
    [edges, patchEdge],
  );

  const setEdgeType = useCallback(
    (edgeId: string, type: EdgeType) => {
      patchEdge(edgeId, { type });
      setEdgeTypePickerOpen(false);
    },
    [patchEdge],
  );

  const canvasPan = useMemo(
    () =>
      createViewportPan({
        enabled: !editingId,
        translateX,
        translateY,
        scale,
        startX: panTx0,
        startY: panTy0,
        onBegin: handleViewportBegin,
      }),
    [editingId, translateX, translateY, scale, panTx0, panTy0, handleViewportBegin],
  );

  const canvasPinch = useMemo(
    () =>
      createViewportPinch({
        translateX,
        translateY,
        scale,
        startX: pinchTx0,
        startY: pinchTy0,
        startScale: pinchScale0,
        startFocalX: pinchFx0,
        startFocalY: pinchFy0,
        onBegin: handleViewportBegin,
      }),
    [
      translateX,
      translateY,
      scale,
      pinchTx0,
      pinchTy0,
      pinchScale0,
      pinchFx0,
      pinchFy0,
      handleViewportBegin,
    ],
  );

  const doubleTap = useMemo(
    () =>
      Gesture.Tap()
        .numberOfTaps(2)
        .maxDistance(16)
        .maxDelay(300)
        .onEnd((event, success) => {
          if (success) runOnJS(handleDoubleTap)(event.x, event.y);
        }),
    [handleDoubleTap],
  );

  const singleTap = useMemo(
    () =>
      Gesture.Tap()
        .maxDistance(12)
        .onEnd((event, success) => {
          if (success) runOnJS(handleSingleTap)(event.x, event.y);
        }),
    [handleSingleTap],
  );

  const rootGesture = useMemo(
    () => Gesture.Simultaneous(canvasPan, canvasPinch, doubleTap, singleTap),
    [canvasPan, canvasPinch, doubleTap, singleTap],
  );

  const layerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const edgeMenuHeight = edgeTypePickerOpen ? EDGE_TYPE_MENU_HEIGHT : EDGE_MENU_HEIGHT;
  const activeEdge = edgeMenu ? edges.find((edge) => edge.id === edgeMenu.edgeId) : undefined;
  const edgeMenuTop =
    edgeMenu !== null
      ? Math.min(edgeMenu.top, Math.max(spacing.sm, size.height - edgeMenuHeight - spacing.sm))
      : 0;

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <GridBackground
        translateX={translateX}
        translateY={translateY}
        scale={scale}
        width={size.width}
        height={size.height}
      />

      <GestureDetector gesture={rootGesture}>
        <View style={styles.surface}>
          <Animated.View pointerEvents="box-none" style={[styles.layer, layerStyle]}>
            <EdgeLayer
              edges={edges}
              heights={heights}
              nodes={nodes}
              positions={positions}
              previewActive={previewActive}
              previewFrom={previewFrom}
              previewX={previewX}
              previewY={previewY}
              selectedEdgeId={selectedEdgeId}
            />
            {nodes.map((node) => (
              <CanvasNode
                key={node.id}
                node={node}
                onConnect={handleConnect}
                onLongPress={handleLongPress}
                onMeasure={onMeasure}
                onOpenAI={openAIToolbar}
                onStopAI={stop}
                panBlocker={canvasPan}
                patchNode={patchNode}
                positions={positions}
                previewActive={previewActive}
                previewFrom={previewFrom}
                previewX={previewX}
                previewY={previewY}
                scaleValue={scale}
                select={selectNode}
                selected={selectedId === node.id}
                editing={editingId === node.id}
                setEditingId={setEditingId}
                aiActive={aiTargetId === node.id}
                aiDraftText={aiDraft !== null && aiDraft.nodeId === node.id ? aiDraft.text : null}
                aiGenerating={generating && aiTargetId === node.id}
                onDelete={removeNodeWithEdges}
              />
            ))}
          </Animated.View>
        </View>
      </GestureDetector>

      {loading ? (
        <View pointerEvents="none" style={styles.loading}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : null}

      <Minimap
        edges={edges}
        nodes={nodes}
        translateX={translateX}
        translateY={translateY}
        scale={scale}
        viewportWidth={size.width}
        viewportHeight={size.height}
      />

      {menu ? (
        <View style={[styles.menu, { left: menu.left, top: menu.top }]}>
          <Text variant="label" color="textMuted" style={styles.menuTitle}>
            Note actions
          </Text>
          <PressableScale
            accessibilityLabel="Delete note"
            onPress={() => {
              const targetId = menu.nodeId;
              closeMenu();
              removeNodeWithEdges(targetId);
            }}
            scaleTo={0.97}
            style={styles.menuRow}
          >
            <View style={styles.typeRow}>
              <Icon name="trash" size={16} color={colors.danger} />
              <Text variant="body" color="danger">
                Delete note
              </Text>
            </View>
          </PressableScale>
          <PressableScale disabled scaleTo={1} style={styles.menuRow}>
            <Text variant="body" color="textMuted">
              Duplicate — coming soon
            </Text>
          </PressableScale>
        </View>
      ) : null}

      {edgeMenu && activeEdge ? (
        <View style={[styles.menu, { left: edgeMenu.left, top: edgeMenuTop }]}>
          {edgeTypePickerOpen ? (
            <>
              <Text variant="label" color="textMuted" style={styles.menuTitle}>
                Edge type
              </Text>
              {EDGE_TYPES.map((type) => (
                <PressableScale
                  key={type}
                  accessibilityLabel={`Set edge type: ${type}`}
                  onPress={() => setEdgeType(edgeMenu.edgeId, type)}
                  scaleTo={0.97}
                  style={styles.menuRow}
                >
                  <View style={styles.typeRow}>
                    <View style={[styles.swatch, { backgroundColor: EDGE_TYPE_COLORS[type] }]} />
                    <Text
                      variant="body"
                      color={activeEdge.type === type ? 'text' : 'textSecondary'}
                    >
                      {type}
                    </Text>
                  </View>
                </PressableScale>
              ))}
              <PressableScale
                accessibilityLabel="Back to edge actions"
                onPress={() => setEdgeTypePickerOpen(false)}
                scaleTo={0.97}
                style={styles.menuRow}
              >
                <Text variant="body" color="textMuted">
                  Back
                </Text>
              </PressableScale>
            </>
          ) : (
            <>
              <Text variant="label" color="textMuted" style={styles.menuTitle}>
                Edge actions
              </Text>
              <PressableScale
                accessibilityLabel="Rename edge"
                onPress={() => renameEdge(edgeMenu.edgeId)}
                scaleTo={0.97}
                style={styles.menuRow}
              >
                <Text variant="body" color="text">
                  Rename
                </Text>
              </PressableScale>
              <PressableScale
                accessibilityLabel="Change edge type"
                onPress={() => setEdgeTypePickerOpen(true)}
                scaleTo={0.97}
                style={styles.menuRow}
              >
                <View style={styles.typeRow}>
                  <View
                    style={[styles.swatch, { backgroundColor: EDGE_TYPE_COLORS[activeEdge.type] }]}
                  />
                  <Text variant="body" color="text">
                    Change type
                  </Text>
                </View>
              </PressableScale>
              <PressableScale
                accessibilityLabel="Delete edge"
                onPress={() => removeEdge(edgeMenu.edgeId)}
                scaleTo={0.97}
                style={styles.menuRow}
              >
                <Text variant="body" color="danger">
                  Delete edge
                </Text>
              </PressableScale>
            </>
          )}
        </View>
      ) : null}

      {aiToolbarPos !== null && aiTargetId !== null ? (
        <>
          <Pressable
            accessibilityElementsHidden
            importantForAccessibility="no"
            onPress={dismissAIToolbar}
            style={styles.aiBackdrop}
          />
          <NodeToolbar
            generating={generating}
            left={aiToolbarPos.left}
            onAction={(action: NodeAIAction) => generate(action)}
            onClose={dismissAIToolbar}
            onStop={stop}
            onDelete={
              aiTargetId
                ? () => {
                    const targetId = aiTargetId;
                    dismissAIToolbar();
                    removeNodeWithEdges(targetId);
                  }
                : undefined
            }
            top={aiToolbarPos.top}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  surface: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  layer: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    overflow: 'visible',
  },
  loading: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    zIndex: 50,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    gap: spacing.xxs,
    ...shadows.lg,
  },
  menuTitle: {
    marginBottom: spacing.xxs,
  },
  menuRow: {
    alignSelf: 'stretch',
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  aiBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 40,
  },
});
