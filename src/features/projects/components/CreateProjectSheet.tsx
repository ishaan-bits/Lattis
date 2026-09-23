/**
 * CreateProjectSheet — modal sheet to create a project.
 *
 * Emoji picker (30 curated), title (required, max 60), description, and an
 * 8-color accent picker. Submits through the projects store (no Firestore in
 * UI); on success the realtime listener surfaces the card and the sheet closes.
 */

import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button, Text } from '@/components';
import { Input } from '@/features/auth';
import { colors, radius, spacing } from '@/theme';

import {
  DEFAULT_PROJECT_COLOR,
  DEFAULT_PROJECT_EMOJI,
  PROJECT_COLORS,
  PROJECT_EMOJIS,
  PROJECT_TITLE_MAX,
} from '../constants';
import { useProjectsStore } from '../store/projectsStore';
import { PressableScale } from './PressableScale';
import { SheetShell } from './SheetShell';

export type CreateProjectSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function CreateProjectSheet({
  visible,
  onClose,
}: CreateProjectSheetProps): React.JSX.Element {
  const create = useProjectsStore((state) => state.create);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [emoji, setEmoji] = useState<string>(DEFAULT_PROJECT_EMOJI);
  const [color, setColor] = useState<string>(DEFAULT_PROJECT_COLOR);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const trimmedTitle = title.trim();
  const titleError =
    title.length > PROJECT_TITLE_MAX
      ? `Max ${PROJECT_TITLE_MAX} characters.`
      : title.length > 0 && trimmedTitle.length === 0
        ? 'Title cannot be only spaces.'
        : null;
  const canSubmit = trimmedTitle.length > 0 && trimmedTitle.length <= PROJECT_TITLE_MAX && !busy;

  function reset(): void {
    setTitle('');
    setDescription('');
    setEmoji(DEFAULT_PROJECT_EMOJI);
    setColor(DEFAULT_PROJECT_COLOR);
  }

  async function onSubmit(): Promise<void> {
    if (!canSubmit || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await create({ title: trimmedTitle, description: description.trim(), emoji, color });
      reset();
      onClose();
    } catch (error) {
      Alert.alert(
        'Could not create project',
        error instanceof Error && error.message ? error.message : 'Please try again.',
      );
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <SheetShell
      visible={visible}
      title="New project"
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
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.group}>
          <Text variant="label" color="textMuted">
            Emoji
          </Text>
          <View style={styles.emojiGrid}>
            {PROJECT_EMOJIS.map((item) => (
              <PressableScale
                key={item}
                accessibilityLabel={`Emoji ${item}`}
                accessibilityRole="button"
                accessibilityState={{ selected: emoji === item }}
                onPress={() => setEmoji(item)}
                scaleTo={0.9}
                style={[styles.emojiCell, emoji === item && styles.emojiCellActive]}
              >
                <Text style={styles.emojiGlyph}>{item}</Text>
              </PressableScale>
            ))}
          </View>
        </View>

        <Input
          label="Project title"
          value={title}
          onChangeText={setTitle}
          autoCapitalize="sentences"
          autoCorrect
          returnKeyType="next"
          placeholder="e.g. Thesis research"
          maxLength={PROJECT_TITLE_MAX + 20}
          error={titleError}
          editable={!busy}
        />
        <View style={styles.counterRow}>
          <Text variant="caption" color="textMuted">
            {trimmedTitle.length}/{PROJECT_TITLE_MAX}
          </Text>
        </View>

        <View style={styles.group}>
          <Text variant="label" color="textMuted">
            Description
          </Text>
          <TextInput
            accessibilityLabel="Description"
            editable={!busy}
            maxLength={240}
            multiline
            onChangeText={setDescription}
            placeholder="What is this project about?"
            placeholderTextColor={colors.textMuted}
            style={styles.textarea}
            value={description}
          />
        </View>

        <View style={styles.group}>
          <Text variant="label" color="textMuted">
            Accent color
          </Text>
          <View style={styles.colorRow}>
            {PROJECT_COLORS.map((item) => (
              <PressableScale
                key={item}
                accessibilityLabel={`Accent color ${item}`}
                accessibilityRole="button"
                accessibilityState={{ selected: color === item }}
                onPress={() => setColor(item)}
                scaleTo={0.88}
                style={[
                  styles.swatch,
                  { backgroundColor: item },
                  color === item && styles.swatchActive,
                ]}
              >
                {color === item ? (
                  <View style={styles.swatchDot} accessibilityElementsHidden />
                ) : null}
              </PressableScale>
            ))}
          </View>
        </View>
      </ScrollView>
    </SheetShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    gap: spacing.md,
  },
  group: {
    gap: spacing.xs,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  emojiCell: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCellActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  emojiGlyph: {
    fontSize: 22,
    lineHeight: 26,
  },
  counterRow: {
    alignItems: 'flex-end',
    marginTop: -spacing.xs,
  },
  textarea: {
    minHeight: 88,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
    textAlignVertical: 'top',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: colors.transparent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderColor: colors.text,
  },
  swatchDot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.overlay,
  },
  footerBtn: {
    flex: 1,
  },
});
