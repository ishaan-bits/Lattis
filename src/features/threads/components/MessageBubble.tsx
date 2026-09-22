/**
 * MessageBubble — one chat message row.
 *
 * User messages align right on the primary fill; assistant messages align
 * left on the surface fill. Fades in on mount with a clock label underneath.
 */

import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Text } from '@/components';
import { colors, radius, spacing } from '@/theme';
import type { Message } from '@/types';

import { formatClock } from '../utils';

export type MessageBubbleProps = {
  message: Message;
  /** List index — staggers the fade-in entrance. */
  index: number;
};

export function MessageBubble({ message, index }: MessageBubbleProps): React.JSX.Element {
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index, 6) * 40).duration(320)}
      style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}
    >
      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAssistant]}>
        <Text variant="body" color={isUser ? 'textInverse' : 'text'} style={styles.content}>
          {message.content}
        </Text>
      </View>
      <Text variant="caption" color="textMuted" style={[styles.clock, isUser && styles.clockUser]}>
        {formatClock(message.createdAt)}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    maxWidth: '85%',
    gap: 2,
  },
  rowUser: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  rowAssistant: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  bubbleUser: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  content: {
    // Soften large pasted blocks without breaking words mid-glyph.
    wordWrap: 'break-word',
  },
  clock: {
    marginLeft: spacing.xs,
  },
  clockUser: {
    marginLeft: 0,
    marginRight: spacing.xs,
  },
});
