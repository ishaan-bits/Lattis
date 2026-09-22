/**
 * ThreadCard — one thread row in the threads list.
 *
 * Title, relative updated time, and an archived badge when applicable.
 * Fades in on mount and scales to 0.97 while pressed. Long-press opens the
 * rename / archive / delete action menu.
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
  /** Opens the chat workspace for this thread. */
  onPress: () => void;
  /** Opens rename/archive/delete menu (also wired to long-press). */
  onActions: () => void;
};

export function ThreadCard({
  thread,
  index,
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
          <Text variant="bodyMedium" numberOfLines={1} style={styles.title}>
            {thread.title}
          </Text>
          <Text variant="caption" color="textMuted" style={styles.updated}>
            Updated {formatRelativeTime(thread.updatedAt)}
          </Text>
        </View>
        {thread.archived ? (
          <View style={styles.badge} accessibilityLabel="Archived">
            <Text variant="caption" color="textSecondary">
              Archived
            </Text>
          </View>
        ) : null}
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
  title: {
    letterSpacing: -0.1,
  },
  updated: {
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
