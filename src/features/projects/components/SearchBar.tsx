/**
 * SearchBar — pill search field bound to the projects store's searchQuery.
 */

import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Icon, Text } from '@/components';
import { colors, radius, spacing } from '@/theme';

import { PressableScale } from './PressableScale';

export type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search projects',
}: SearchBarProps): React.JSX.Element {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.wrap, focused && styles.wrapFocused]}>
      <Icon name="magnifyingglass" size={16} color={colors.textMuted} />
      <TextInput
        accessibilityLabel={placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        clearButtonMode="never"
        onBlur={() => setFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {value.length > 0 ? (
        <PressableScale
          accessibilityLabel="Clear search"
          hitSlop={8}
          onPress={() => onChangeText('')}
          scaleTo={0.9}
          style={styles.clear}
        >
          <Text variant="caption" color="textMuted">
            Clear
          </Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  wrapFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceElevated,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  clear: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
  },
});
