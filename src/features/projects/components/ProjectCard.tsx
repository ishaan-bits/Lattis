/**
 * ProjectCard — one project in the 2-column home grid.
 *
 * Accent strip, large emoji, title, 2-line description, relative updated time.
 * Fades in on mount and scales to 0.97 while pressed. Long-press (or the ⋯
 * button) opens the rename/delete action menu.
 */

import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Text } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme';
import type { Project } from '@/types';

import { formatRelativeTime } from '../utils';
import { PressableScale } from './PressableScale';

export type ProjectCardProps = {
  project: Project;
  /** Grid index — staggers the fade-in entrance. */
  index: number;
  onPress: () => void;
  /** Opens rename/delete menu (also wired to long-press). */
  onActions: () => void;
};

export function ProjectCard({
  project,
  index,
  onPress,
  onActions,
}: ProjectCardProps): React.JSX.Element {
  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 8) * 60).duration(420)}
      style={styles.wrapper}
    >
      <PressableScale
        accessibilityLabel={`${project.title} project`}
        accessibilityHint="Long press or double tap for rename and delete"
        delayLongPress={350}
        onLongPress={onActions}
        onPress={onPress}
        style={styles.card}
      >
        <View
          style={[styles.strip, { backgroundColor: project.color }]}
          accessibilityElementsHidden
        />
        <View style={styles.body}>
          <Text style={styles.emoji} accessibilityElementsHidden>
            {project.emoji}
          </Text>
          <Text variant="bodyMedium" numberOfLines={1} style={styles.title}>
            {project.title}
          </Text>
          <Text
            variant="caption"
            color="textSecondary"
            numberOfLines={2}
            style={styles.description}
          >
            {project.description || 'No description yet.'}
          </Text>
          <Text variant="caption" color="textMuted" style={styles.updated}>
            Updated {formatRelativeTime(project.updatedAt)}
          </Text>
        </View>
        <Pressable
          accessibilityLabel={`Actions for ${project.title}`}
          accessibilityRole="button"
          hitSlop={12}
          onPress={onActions}
          style={styles.more}
        >
          <Text variant="bodyMedium" color="textMuted">
            ⋯
          </Text>
        </Pressable>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
    minHeight: 168,
    ...shadows.sm,
  },
  strip: {
    height: 4,
    width: '100%',
  },
  body: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.xs,
  },
  emoji: {
    fontSize: 34,
    lineHeight: 42,
  },
  title: {
    letterSpacing: -0.1,
  },
  description: {
    minHeight: 36,
  },
  updated: {
    marginTop: 'auto',
  },
  more: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
