/**
 * CreateThreadSheet — modal sheet to create a thread in the open project.
 *
 * Title is required (max 80 chars) and pre-filled with "Untitled Thread".
 * Submits through the threads store (no Firestore in UI); on success the
 * realtime listener surfaces the card and the sheet closes.
 */

import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components';
import { Input } from '@/features/auth';
import { SheetShell } from '@/features/projects';
import { spacing } from '@/theme';

import { DEFAULT_THREAD_TITLE, THREAD_TITLE_MAX } from '../constants';
import { useThreadsStore } from '../store/threadsStore';

export type CreateThreadSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function CreateThreadSheet({ visible, onClose }: CreateThreadSheetProps): React.JSX.Element {
  const create = useThreadsStore((state) => state.create);

  const [title, setTitle] = useState(DEFAULT_THREAD_TITLE);
  const [busy, setBusy] = useState(false);

  const trimmedTitle = title.trim();
  const titleError =
    title.length > THREAD_TITLE_MAX
      ? `Max ${THREAD_TITLE_MAX} characters.`
      : title.length > 0 && trimmedTitle.length === 0
        ? 'Title cannot be only spaces.'
        : null;
  const canSubmit = trimmedTitle.length > 0 && trimmedTitle.length <= THREAD_TITLE_MAX && !busy;

  function reset(): void {
    setTitle(DEFAULT_THREAD_TITLE);
  }

  async function onSubmit(): Promise<void> {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await create(trimmedTitle);
      reset();
      onClose();
    } catch (error) {
      Alert.alert(
        'Could not create thread',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SheetShell
      visible={visible}
      title="New thread"
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="secondary" style={styles.footerBtn} onPress={onClose} />
          <Button
            label="Create"
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
        placeholder={DEFAULT_THREAD_TITLE}
        maxLength={THREAD_TITLE_MAX + 20}
        error={titleError}
        editable={!busy}
        autoFocus
      />
      <View style={styles.counterRow}>
        <Text variant="caption" color="textMuted">
          {trimmedTitle.length}/{THREAD_TITLE_MAX}
        </Text>
      </View>
    </SheetShell>
  );
}

const styles = StyleSheet.create({
  counterRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.xs,
  },
  footerBtn: {
    flex: 1,
  },
});
