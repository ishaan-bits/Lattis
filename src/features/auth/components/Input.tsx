/**
 * Form field used across auth screens.
 *
 * Dark Apple-style input with optional show/hide for secure fields,
 * focus ring, and optional error message — no inline styles.
 */

import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from '@/components';
import { colors, radius, spacing } from '@/theme';

export type InputProps = Omit<TextInputProps, 'style'> & {
  label: string;
  /** Renders show/hide toggle when true. */
  secure?: boolean;
  error?: string | null;
};

export function Input({
  label,
  secure = false,
  error,
  onFocus,
  onBlur,
  ...rest
}: InputProps): React.JSX.Element {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={styles.group}>
      <Text variant="label" color="textMuted" style={styles.label}>
        {label}
      </Text>
      <View
        style={[styles.field, focused && styles.fieldFocused, Boolean(error) && styles.fieldError]}
      >
        <TextInput
          accessibilityLabel={label}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={hidden}
          style={styles.input}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...rest}
        />
        {secure ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={8}
            onPress={() => setHidden((value) => !value)}
            style={styles.toggle}
          >
            <Text variant="caption" color="primary">
              {hidden ? 'Show' : 'Hide'}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" color="danger" style={styles.error}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: spacing.xs,
  },
  label: {
    marginLeft: spacing.xxs,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  fieldError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  toggle: {
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xs,
  },
  error: {
    marginLeft: spacing.xxs,
  },
});
