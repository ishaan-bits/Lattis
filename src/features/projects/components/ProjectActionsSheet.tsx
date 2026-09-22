/**
 * ProjectActionsSheet — rename / delete menu for one project.
 *
 * Delete routes through a native confirmation dialog before calling the
 * store's `remove()`; rename hands the project to the rename sheet via
 * `onRename`.
 */

import { Alert, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { colors, radius, spacing } from '@/theme';
import type { Project } from '@/types';

import { useProjectsStore } from '../store/projectsStore';
import { formatRelativeTime } from '../utils';
import { PressableScale } from './PressableScale';
import { SheetShell } from './SheetShell';

export type ProjectActionsSheetProps = {
  /** Project the menu is for; sheet is hidden when `null`. */
  project: Project | null;
  onClose: () => void;
  /** Ask the parent to open the rename sheet for this project. */
  onRename: (project: Project) => void;
};

export function ProjectActionsSheet({
  project,
  onClose,
  onRename,
}: ProjectActionsSheetProps): React.JSX.Element {
  const remove = useProjectsStore((state) => state.remove);

  function handleRename(): void {
    if (!project) return;
    onRename(project);
  }

  function handleDelete(): void {
    if (!project) return;
    Alert.alert(
      `Delete “${project.title}”?`,
      'This permanently removes the project and its canvas. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void remove(project.id)
              .then(() => onClose())
              .catch((error: unknown) => {
                Alert.alert(
                  'Could not delete project',
                  error instanceof Error ? error.message : 'Please try again.',
                );
              });
          },
        },
      ],
    );
  }

  return (
    <SheetShell
      visible={project !== null}
      title={project?.title ?? 'Project actions'}
      onClose={onClose}
    >
      {project ? (
        <View style={styles.meta}>
          <Text style={styles.emoji}>{project.emoji}</Text>
          <View style={styles.metaCopy}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {project.title}
            </Text>
            <Text variant="caption" color="textMuted">
              Updated {formatRelativeTime(project.updatedAt)}
            </Text>
          </View>
        </View>
      ) : null}

      <PressableScale accessibilityLabel="Rename project" onPress={handleRename} style={styles.row}>
        <Text variant="bodyMedium" color="primary">
          Rename
        </Text>
      </PressableScale>
      <PressableScale accessibilityLabel="Delete project" onPress={handleDelete} style={styles.row}>
        <Text variant="bodyMedium" color="danger">
          Delete
        </Text>
      </PressableScale>
    </SheetShell>
  );
}

const styles = StyleSheet.create({
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  metaCopy: {
    flex: 1,
    gap: 2,
  },
  row: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
