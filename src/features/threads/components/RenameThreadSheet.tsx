/**
 * RenameThreadSheet — modal sheet to rename an existing thread.
 *
 * The parent remounts this sheet with `key={thread.id}` when a rename
 * starts, so field state initializes from props without an effect.
 */

import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { Button } from '@/components';
import { Input } from '@/features/auth';
import { SheetShell } from '@/features/projects';
import type { Thread } from '@/types';

import { THREAD_TITLE_MAX } from '../constants';
import { useThreadsStore } from '../store/threadsStore';

export type RenameThreadSheetProps = {
  /** Thread being renamed; sheet is hidden when `null`. */
  thread: Thread | null;
  onClose: () => void;
};

export function RenameThreadSheet({ thread, onClose }: RenameThreadSheetProps): React.JSX.Element {
  const rename = useThreadsStore((state) => state.rename);

  const [title, setTitle] = useState(thread?.title ?? '');
  const [busy, setBusy] = useState(false);

  const trimmedTitle = title.trim();
  const titleError =
    title.length > THREAD_TITLE_MAX
      ? `Max ${THREAD_TITLE_MAX} characters.`
      : title.length > 0 && trimmedTitle.length === 0
        ? 'Title cannot be only spaces.'
        : null;
  const canSubmit =
    thread !== null && trimmedTitle.length > 0 && trimmedTitle.length <= THREAD_TITLE_MAX && !busy;

  async function onSubmit(): Promise<void> {
    if (!thread || !canSubmit) return;
    setBusy(true);
    try {
      await rename(thread.id, trimmedTitle);
      onClose();
    } catch (error) {
      Alert.alert(
        'Could not rename thread',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SheetShell
      visible={thread !== null}
      title="Rename thread"
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="secondary" style={styles.footerBtn} onPress={onClose} />
          <Button
            label="Save"
            style={styles.footerBtn}
            disabled={!canSubmit}
            loading={busy}
            onPress={() => void onSubmit()}
          />
        </>
      }
    >
      <Input
        label="Thread title"
        value={title}
        onChangeText={setTitle}
        autoCapitalize="sentences"
        autoCorrect
        placeholder="Thread title"
        maxLength={THREAD_TITLE_MAX + 20}
        error={titleError}
        editable={!busy}
        autoFocus
      />
    </SheetShell>
  );
}

const styles = StyleSheet.create({
  footerBtn: {
    flex: 1,
  },
});
