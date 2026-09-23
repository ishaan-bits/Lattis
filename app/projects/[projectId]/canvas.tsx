/**
 * Canvas — infinite canvas workspace for one project.
 *
 * Full-bleed pan/zoom surface with a back pill to the threads list; auth and
 * param gates match the other project-scoped screens.
 */

import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Icon, ScreenContainer, Text } from '@/components';
import { useAuth } from '@/features/auth';
import { InfiniteCanvas } from '@/features/canvas';
import { PressableScale } from '@/features/projects';
import { colors, spacing } from '@/theme';

export default function CanvasScreen(): React.JSX.Element {
  const { initialized, user, authLoading } = useAuth();
  const params = useLocalSearchParams<{ projectId?: string; projectTitle?: string }>();
  const projectId = typeof params.projectId === 'string' ? params.projectId : '';
  const projectTitle = typeof params.projectTitle === 'string' ? params.projectTitle : '';

  if (!projectId) {
    return <Redirect href="/" />;
  }

  if (authLoading) {
    return <Redirect href="/splash" />;
  }

  if (initialized && !user) {
    return <Redirect href="/login" />;
  }

  return (
    <ScreenContainer horizontalPadding={0} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.topRow}>
          <PressableScale
            accessibilityLabel="Back to threads"
            accessibilityRole="button"
            hitSlop={12}
            onPress={() => router.back()}
            scaleTo={0.9}
            style={styles.back}
          >
            <Icon name="chevron.left" size={18} color={colors.text} />
            <Text variant="bodyMedium" color="text">
              Threads
            </Text>
          </PressableScale>
        </View>

        <View style={styles.titleBlock}>
          <Text variant="title" style={styles.title}>
            {projectTitle || 'Canvas'}
          </Text>
          {projectTitle ? (
            <Text variant="body" color="textSecondary">
              Canvas
            </Text>
          ) : null}
        </View>
      </View>

      <InfiniteCanvas key={projectId} projectId={projectId} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xxs,
    paddingRight: spacing.xs,
  },
  titleBlock: {
    gap: spacing.xxs,
  },
  title: {
    letterSpacing: -0.4,
  },
});
