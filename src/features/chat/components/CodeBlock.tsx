/**
 * CodeBlock — fenced code with a language chip and copy affordance.
 *
 * Replaces the library's default horizontal-scroll text block so code in
 * assistant replies matches the Lattis surface language.
 */

import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components';
import { PressableScale } from '@/features/projects';
import { colors, radius, spacing } from '@/theme';

const MONO_FAMILY = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export type CodeBlockProps = {
  code: string;
  /** Fenced-language tag (`ts`, `python`, …); falls back to "code". */
  language?: string;
};

export function CodeBlock({ code, language }: CodeBlockProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  function handleCopy(): void {
    void Clipboard.setStringAsync(code).then(() => setCopied(true));
  }

  const label = language?.trim().split(/\s+/)[0] || 'code';

  return (
    <View accessibilityLabel={`${label} code block`} style={styles.block}>
      <View style={styles.header}>
        <Text variant="label" color="textMuted" style={styles.lang}>
          {label}
        </Text>
        <PressableScale
          accessibilityLabel={copied ? 'Code copied' : 'Copy code'}
          accessibilityRole="button"
          hitSlop={6}
          onPress={handleCopy}
          scaleTo={0.9}
          style={styles.copy}
        >
          <Icon
            name={copied ? 'checkmark' : 'doc.on.doc'}
            size={13}
            color={copied ? colors.success : colors.textSecondary}
          />
          <Text variant="caption" color={copied ? 'success' : 'textSecondary'}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </PressableScale>
      </View>
      <ScrollView
        contentContainerStyle={styles.codeScroll}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        <Text selectable style={styles.code}>
          {code}
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    marginVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs + 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
  },
  lang: {
    letterSpacing: 0.4,
  },
  copy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.full,
  },
  codeScroll: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  code: {
    fontFamily: MONO_FAMILY,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },
});
