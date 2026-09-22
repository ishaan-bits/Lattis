/**
 * ChatComposer — multiline input + send button pinned to the bottom.
 *
 * Grows up to a few lines, disables while a reply is streaming, and shows a
 * circular primary send control with an up-arrow glyph.
 */

import { StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components';
import { PressableScale } from '@/features/projects';
import { colors, radius, spacing } from '@/theme';

export type ChatComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  /** True while sending/streaming — locks the composer. */
  disabled?: boolean;
};

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  disabled = false,
}: ChatComposerProps): React.JSX.Element {
  const canSend = value.trim().length > 0 && !disabled;

  function handleSend(): void {
    if (canSend) onSend();
  }

  return (
    <View style={styles.bar}>
      <TextInput
        accessibilityLabel="Message"
        editable={!disabled}
        maxLength={4000}
        multiline
        onChangeText={onChangeText}
        placeholder="Message…"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        value={value}
      />
      <PressableScale
        accessibilityLabel="Send message"
        accessibilityRole="button"
        accessibilityState={{ disabled: !canSend }}
        disabled={!canSend}
        onPress={handleSend}
        scaleTo={0.9}
        style={[styles.send, !canSend && styles.sendDisabled]}
      >
        <Icon name="arrow.up" size={18} color={colors.textInverse} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: {
    opacity: 0.45,
  },
});
