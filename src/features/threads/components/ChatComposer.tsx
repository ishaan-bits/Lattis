/**
 * ChatComposer — multiline input with a morphing send/stop control.
 *
 * Grows up to eight lines, stays editable while a reply streams, and
 * morphs the send arrow into a stop square (Reanimated) so generation can
 * be cancelled in place.
 */

import { useEffect } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { Icon } from '@/components';
import { PressableScale } from '@/features/projects';
import { colors, radius, spacing } from '@/theme';

export type ChatComposerProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  /** Cancels the in-flight reply — the morph target of send while `busy`. */
  onStop?: () => void;
  /** True while awaiting/streaming — morphs send into stop. */
  busy?: boolean;
  /** Locks sending (e.g. while persisting) without locking the input. */
  disabled?: boolean;
};

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  onStop,
  busy = false,
  disabled = false,
}: ChatComposerProps): React.JSX.Element {
  const morph = useSharedValue(0);

  useEffect(() => {
    morph.value = withTiming(busy ? 1 : 0, { duration: 200 });
  }, [busy, morph]);

  const arrowStyle = useAnimatedStyle(() => ({
    opacity: 1 - morph.value,
    transform: [{ rotate: `${-90 * morph.value}deg` }, { scale: 1 - 0.4 * morph.value }],
  }));

  const stopStyle = useAnimatedStyle(() => ({
    opacity: morph.value,
    transform: [{ scale: 0.6 + 0.4 * morph.value }],
  }));

  const canSend = value.trim().length > 0 && !disabled && !busy;

  function handlePress(): void {
    if (busy) {
      onStop?.();
      return;
    }
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
        accessibilityLabel={busy ? 'Stop generating' : 'Send message'}
        accessibilityRole="button"
        accessibilityState={{ disabled: !busy && !canSend }}
        disabled={!busy && !canSend}
        onPress={handlePress}
        scaleTo={0.9}
        style={[styles.send, !busy && !canSend && styles.sendDisabled]}
      >
        <Animated.View pointerEvents="none" style={[styles.glyph, arrowStyle]}>
          <Icon name="arrow.up" size={18} color={colors.textInverse} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.glyph, stopStyle]}>
          <Icon name="stop" size={16} color={colors.textInverse} />
        </Animated.View>
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
    paddingVertical: spacing.xs + 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: 44,
    // ~8 lines at 22pt lineHeight + padding.
    maxHeight: 196,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.sm + 2,
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
  glyph: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
