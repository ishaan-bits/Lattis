/**
 * ThreadActionsSheet — rename / archive / delete menu for one thread.
 *
 * Archive toggles the `archived` flag immediately; delete routes through a
 * native confirmation dialog; rename hands the thread to the rename sheet
 * via `onRename`.
 */

import { Alert, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { PressableScale, SheetShell } from '@/features/projects';
import { colors, radius, spacing } from '@/theme';
import type { Thread } from '@/types';

import { useThreadsStore } from '../store/threadsStore';
import { formatRelativeTime } from '../utils';

export type ThreadActionsSheetProps = {
  /** Thread the menu is for; sheet is hidden when `null`. */
  thread: Thread | null;
  onClose: () => void;
  /** Ask the parent to open the rename sheet for this thread. */
  onRename: (thread: Thread) => void;
};

export function ThreadActionsSheet({
  thread,
  onClose,
  onRename,
}: ThreadActionsSheetProps): React.JSX.Element {
  const setArchived = useThreadsStore((state) => state.setArchived);
  const remove = useThreadsStore((state) => state.remove);

  function handleRename(): void {
    if (!thread) return;
    onRename(thread);
  }

  function handleArchiveToggle(): void {
    if (!thread) return;
    void setArchived(thread.id, !thread.archived)
      .then(() => onClose())
      .catch((error: unknown) => {
        Alert.alert(
          thread.archived ? 'Could not unarchive thread' : 'Could not archive thread',
          error instanceof Error ? error.message : 'Please try again.',
        );
      });
  }

  function handleDelete(): void {
    if (!thread) return;
    Alert.alert(
      `Delete “${thread.title}”?`,
      'This permanently removes the thread and its messages. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void remove(thread.id)
              .then(() => onClose())
              .catch((error: unknown) => {
                Alert.alert(
                  'Could not delete thread',
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
      visible={thread !== null}
      title={thread?.title ?? 'Thread actions'}
      onClose={onClose}
    >
      {thread ? (
        <View style={styles.meta}>
          <View style={styles.metaCopy}>
            <Text variant="bodyMedium" numberOfLines={1}>
              {thread.title}
            </Text>
            <Text variant="caption" color="textMuted">
              Updated {formatRelativeTime(thread.updatedAt)}
            </Text>
          </View>
        </View>
      ) : null}

      <PressableScale accessibilityLabel="Rename thread" onPress={handleRename} style={styles.row}>
        <Text variant="bodyMedium" color="primary">
          Rename
        </Text>
      </PressableScale>
      <PressableScale
        accessibilityLabel={thread?.archived ? 'Unarchive thread' : 'Archive thread'}
        onPress={handleArchiveToggle}
        style={styles.row}
      >
        <Text variant="bodyMedium" color="primary">
          {thread?.archived ? 'Unarchive' : 'Archive'}
        </Text>
      </PressableScale>
      <PressableScale accessibilityLabel="Delete thread" onPress={handleDelete} style={styles.row}>
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
