/**
 * ThreadCard — one thread row in the threads list.
 *
 * Title, latest-message preview, relative updated time, and an archived
 * badge when applicable. Optional unread dot is future-ready (no data
 * source yet). Fades in on mount and scales to 0.97 while pressed.
 * Long-press opens the rename / archive / delete action menu.
 */

import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Text } from '@/components';
import { PressableScale } from '@/features/projects';
import { colors, radius, shadows, spacing } from '@/theme';
import type { Thread } from '@/types';

import { formatRelativeTime } from '../utils';

export type ThreadCardProps = {
  thread: Thread;
  /** List index — staggers the fade-in entrance. */
  index: number;
  /** Latest message preview (from `useThreadPreviews`). */
  preview?: string;
  /** Unread affordance — future-ready, defaults off. */
  unread?: boolean;
  /** Opens the chat workspace for this thread. */
  onPress: () => void;
  /** Opens rename/archive/delete menu (also wired to long-press). */
  onActions: () => void;
};

export function ThreadCard({
  thread,
  index,
  preview,
  unread = false,
  onPress,
  onActions,
}: ThreadCardProps): React.JSX.Element {
  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 8) * 60).duration(420)}
      style={styles.wrapper}
    >
      <PressableScale
        accessibilityLabel={`${thread.title} thread`}
        accessibilityHint="Opens the chat. Long press for rename, archive, and delete"
        delayLongPress={350}
        onLongPress={onActions}
        onPress={onPress}
        style={styles.card}
      >
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text variant="bodyMedium" numberOfLines={1} style={styles.title}>
              {thread.title}
            </Text>
            {unread ? <View accessibilityLabel="Unread" style={styles.unread} /> : null}
          </View>
          {preview ? (
            <Text variant="caption" color="textSecondary" numberOfLines={1} style={styles.preview}>
              {preview}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text variant="caption" color="textMuted">
              Updated {formatRelativeTime(thread.updatedAt)}
            </Text>
            {thread.archived ? (
              <View style={styles.badge} accessibilityLabel="Archived">
                <Text variant="caption" color="textSecondary">
                  Archived
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 72,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    ...shadows.sm,
  },
  body: {
    flex: 1,
    gap: spacing.xxs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    flex: 1,
    letterSpacing: -0.1,
  },
  unread: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  preview: {
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.xs,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceElevated,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
