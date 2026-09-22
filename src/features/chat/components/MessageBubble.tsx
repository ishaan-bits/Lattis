/**
 * MessageBubble — ChatGPT-style conversation row.
 *
 * User messages align right on the primary fill; assistant messages take
 * full width with a sparkle avatar and markdown content (code blocks, the
 * works). Completed messages get an actions row + clock; the in-flight
 * streaming bubble shows the blinking cursor instead.
 */

import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { Icon, Text } from '@/components';
import { formatClock } from '@/features/threads';
import { colors, radius, spacing } from '@/theme';
import type { Message } from '@/types';

import { MarkdownMessage } from './MarkdownMessage';
import { MessageActions } from './MessageActions';

export type MessageBubbleProps = {
  message: Message;
  /** List index — staggers the fade-in entrance. */
  index: number;
  /** In-flight assistant reply — cursor instead of actions/clock. */
  streaming?: boolean;
  onRegenerate?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
};

export function MessageBubble({
  message,
  index,
  streaming = false,
  onRegenerate,
  onDelete,
}: MessageBubbleProps): React.JSX.Element {
  const isUser = message.role === 'user';
  const showActions = !streaming && (Boolean(onDelete) || (!isUser && Boolean(onRegenerate)));
  const entering = FadeInUp.delay(Math.min(index, 6) * 40).duration(320);

  if (isUser) {
    return (
      <Animated.View entering={entering} style={styles.userRow}>
        <View style={styles.userBubble}>
          <Text variant="body" color="textInverse" style={styles.userContent}>
            {message.content}
          </Text>
        </View>
        {!streaming ? (
          <View style={styles.userMeta}>
            {showActions ? (
              <MessageActions
                content={message.content}
                role="user"
                onDelete={onDelete ? () => onDelete(message.id) : undefined}
              />
            ) : null}
            <Text variant="caption" color="textMuted">
              {formatClock(message.createdAt)}
            </Text>
          </View>
        ) : null}
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={entering} style={styles.assistantRow}>
      <View accessibilityElementsHidden style={styles.avatar}>
        <Icon name="sparkles" size={13} color={colors.accent} />
      </View>
      <View style={styles.assistantCol}>
        <MarkdownMessage value={message.content} streaming={streaming} />
        {!streaming ? (
          <View style={styles.assistantMeta}>
            {showActions ? (
              <MessageActions
                content={message.content}
                role="assistant"
                onRegenerate={onRegenerate ? () => onRegenerate(message.id) : undefined}
                onDelete={onDelete ? () => onDelete(message.id) : undefined}
              />
            ) : null}
            <Text variant="caption" color="textMuted">
              {formatClock(message.createdAt)}
            </Text>
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  userRow: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
    maxWidth: '88%',
    gap: 2,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    borderBottomRightRadius: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  userContent: {
    // Soften large pasted blocks without breaking words mid-glyph.
    wordWrap: 'break-word',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 2,
  },
  assistantRow: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    maxWidth: '100%',
  },
  avatar: {
    width: 28,
    height: 28,
    marginTop: 2,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  assistantCol: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xxs,
  },
  assistantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 30,
    marginTop: spacing.xxs,
  },
});
