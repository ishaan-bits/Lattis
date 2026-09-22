/**
 * RenameProjectSheet — modal sheet to rename an existing project.
 *
 * The parent remounts this sheet with `key={project.id}` when a rename
 * starts, so field state initializes from props without an effect.
 */

import { useState } from 'react';
import { Alert, StyleSheet } from 'react-native';

import { Button } from '@/components';
import { Input } from '@/features/auth';
import type { Project } from '@/types';

import { PROJECT_TITLE_MAX } from '../constants';
import { useProjectsStore } from '../store/projectsStore';
import { SheetShell } from './SheetShell';

export type RenameProjectSheetProps = {
  /** Project being renamed; sheet is hidden when `null`. */
  project: Project | null;
  onClose: () => void;
};

export function RenameProjectSheet({
  project,
  onClose,
}: RenameProjectSheetProps): React.JSX.Element {
  const rename = useProjectsStore((state) => state.rename);

  const [title, setTitle] = useState(project?.title ?? '');
  const [busy, setBusy] = useState(false);

  const trimmedTitle = title.trim();
  const titleError =
    title.length > PROJECT_TITLE_MAX
      ? `Max ${PROJECT_TITLE_MAX} characters.`
      : title.length > 0 && trimmedTitle.length === 0
        ? 'Title cannot be only spaces.'
        : null;
  const canSubmit =
    project !== null &&
    trimmedTitle.length > 0 &&
    trimmedTitle.length <= PROJECT_TITLE_MAX &&
    !busy;

  async function onSubmit(): Promise<void> {
    if (!project || !canSubmit) return;
    setBusy(true);
    try {
      await rename(project.id, trimmedTitle);
      onClose();
    } catch (error) {
      Alert.alert(
        'Could not rename project',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <SheetShell
      visible={project !== null}
      title="Rename project"
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
        label="Project title"
        value={title}
        onChangeText={setTitle}
        autoCapitalize="sentences"
        autoCorrect
        placeholder="Project title"
        maxLength={PROJECT_TITLE_MAX + 20}
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
