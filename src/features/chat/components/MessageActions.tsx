/**
 * MessageActions — copy / regenerate / delete row under a message.
 *
 * Copy flips to a checkmark for a moment; regenerate only appears on
 * assistant messages (the screen supplies the handler).
 */

import * as Clipboard from 'expo-clipboard';
import { useEffect, useState, type ComponentProps } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Icon } from '@/components';
import { PressableScale } from '@/features/projects';
import { colors, radius, spacing } from '@/theme';
import type { MessageRole } from '@/types';

type ActionProps = {
  icon: ComponentProps<typeof Icon>['name'];
  label: string;
  onPress: () => void;
  color?: string;
};

function Action({
  icon,
  label,
  onPress,
  color = colors.textSecondary,
}: ActionProps): React.JSX.Element {
  return (
    <PressableScale
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      scaleTo={0.88}
      style={styles.action}
    >
      <Icon name={icon} size={15} color={color} />
    </PressableScale>
  );
}

export type MessageActionsProps = {
  /** Raw message text copied to the clipboard. */
  content: string;
  role: MessageRole;
  /** Re-streams the reply — assistant messages only. */
  onRegenerate?: () => void;
  onDelete?: () => void;
};

export function MessageActions({
  content,
  role,
  onRegenerate,
  onDelete,
}: MessageActionsProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  function handleCopy(): void {
    void Clipboard.setStringAsync(content).then(() => setCopied(true));
  }

  return (
    <Animated.View entering={FadeIn.duration(160)} style={styles.row}>
      <Action
        icon={copied ? 'checkmark' : 'doc.on.doc'}
        label={copied ? 'Copied' : 'Copy'}
        color={copied ? colors.success : undefined}
        onPress={handleCopy}
      />
      {role === 'assistant' && onRegenerate ? (
        <Action icon="gobackward" label="Regenerate" onPress={onRegenerate} />
      ) : null}
      {onDelete ? <Action icon="trash" label="Delete" onPress={onDelete} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
  },
  action: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
