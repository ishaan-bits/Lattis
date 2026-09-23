/**
 * NodeToolbar — floating AI action panel for one note.
 *
 * Rendered by InfiniteCanvas outside the canvas gesture detector so presses
 * never pan/zoom the viewport. While a generation runs the action list is
 * replaced by a single stop row.
 */

import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components';
import { PressableScale } from '@/features/projects';
import { colors, radius, shadows, spacing } from '@/theme';

import {
  NODE_AI_ACTIONS,
  NODE_AI_LABELS,
  NODE_AI_TOOLBAR_WIDTH,
  type NodeAIAction,
} from '../types';

export type NodeToolbarProps = {
  left: number;
  top: number;
  generating: boolean;
  onAction: (action: NodeAIAction) => void;
  onStop: () => void;
  onClose: () => void;
};

function NodeToolbarComponent({
  left,
  top,
  generating,
  onAction,
  onStop,
  onClose,
}: NodeToolbarProps): React.JSX.Element {
  return (
    <View style={[styles.panel, { left, top, width: NODE_AI_TOOLBAR_WIDTH }]}>
      <View style={styles.headerRow}>
        <Text variant="label" color="textMuted" style={styles.title}>
          {generating ? 'Writing…' : 'AI actions'}
        </Text>
        {generating ? null : (
          <PressableScale
            accessibilityLabel="Close AI actions"
            onPress={onClose}
            scaleTo={0.9}
            style={styles.close}
          >
            <Icon name="xmark" size={14} color={colors.textMuted} />
          </PressableScale>
        )}
      </View>
      {generating ? (
        <PressableScale
          accessibilityLabel="Stop generating"
          onPress={onStop}
          scaleTo={0.97}
          style={styles.row}
        >
          <View style={styles.stopRow}>
            <Icon name="stop" size={16} color={colors.danger} />
            <Text variant="body" color="danger">
              Stop
            </Text>
          </View>
        </PressableScale>
      ) : (
        NODE_AI_ACTIONS.map((action) => (
          <PressableScale
            key={action}
            accessibilityLabel={NODE_AI_LABELS[action]}
            onPress={() => onAction(action)}
            scaleTo={0.97}
            style={styles.row}
          >
            <Text variant="body" color="text">
              {NODE_AI_LABELS[action]}
            </Text>
          </PressableScale>
        ))
      )}
    </View>
  );
}

export const NodeToolbar = memo(NodeToolbarComponent);

const styles = StyleSheet.create({
  panel: {
    position: 'absolute',
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: spacing.xxs,
  },
  title: {
    flexShrink: 1,
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    alignSelf: 'stretch',
    minHeight: 44,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
