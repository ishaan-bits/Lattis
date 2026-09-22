/**
 * MarkdownMessage — renders assistant markdown via `react-native-marked`.
 *
 * Uses the `useMarkdown` hook (not the `<Markdown>` FlatList) so blocks
 * flow inside the chat's outer ScrollView. A custom renderer swaps fenced
 * code for the Lattis CodeBlock; the renderer is recreated per value so the
 * slugger resets and React keys stay stable while streaming.
 */

import { useMemo, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Renderer, useMarkdown, type MarkedStyles, type MarkdownProps } from 'react-native-marked';

import { colors, radius, spacing } from '@/theme';

import { CodeBlock } from './CodeBlock';
import { TypingCursor } from './TypingCursor';

type MarkdownTheme = NonNullable<MarkdownProps['theme']>;

class ChatRenderer extends Renderer {
  code(text: string, language?: string): ReactNode {
    return <CodeBlock key={this.getKey()} code={text} language={language} />;
  }
}

const MARKDOWN_THEME: MarkdownTheme = {
  colors: {
    code: colors.surfaceElevated,
    link: colors.accent,
    text: colors.text,
    border: colors.border,
  },
};

const MARKDOWN_STYLES: MarkedStyles = {
  text: { fontSize: 15, lineHeight: 22, color: colors.text },
  paragraph: { paddingVertical: spacing.xs },
  strong: { fontWeight: '600' },
  em: { fontStyle: 'italic' },
  strikethrough: { textDecorationLine: 'line-through' },
  link: { color: colors.accent, fontStyle: 'normal' },
  codespan: {
    backgroundColor: colors.surfaceElevated,
    color: colors.accent,
    fontSize: 14,
    borderRadius: 6,
  },
  h1: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
    marginVertical: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  h2: {
    fontSize: 19,
    lineHeight: 26,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
    marginVertical: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  h3: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: colors.text,
    marginVertical: spacing.xs,
  },
  h4: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.text,
    marginVertical: spacing.xs,
  },
  h5: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: colors.text,
  },
  h6: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  blockquote: {
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
    paddingVertical: spacing.xxs,
    marginVertical: spacing.xxs,
    opacity: 1,
  },
  hr: {
    borderBottomColor: colors.border,
    marginVertical: spacing.sm,
    opacity: 1,
  },
  list: { marginVertical: spacing.xxs },
  li: { fontSize: 15, lineHeight: 22, color: colors.text, marginBottom: 2 },
  image: { borderRadius: radius.md },
  table: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.sm,
  },
  tableCell: { padding: spacing.xs },
};

export type MarkdownMessageProps = {
  value: string;
  /** Appends the blinking cursor after the parsed blocks. */
  streaming?: boolean;
};

export function MarkdownMessage({
  value,
  streaming = false,
}: MarkdownMessageProps): React.JSX.Element {
  // Recreated per value so the slugger resets — React keys then stay stable
  // across streaming re-parses instead of remounting every block.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const renderer = useMemo(() => new ChatRenderer({ selectable: false }), [value]);

  const elements = useMarkdown(value, {
    renderer,
    styles: MARKDOWN_STYLES,
    theme: MARKDOWN_THEME,
    colorScheme: 'dark',
  });

  return (
    <View style={styles.root}>
      {elements}
      {streaming ? <TypingCursor /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 0,
  },
});
