/**
 * CanvasNote — presentational sticky-note UI (header, title, body, AI button).
 *
 * State lives in CanvasNode; this component only renders values and reports
 * changes. While an AI generation runs the body is read-only and a shimmer
 * cursor sits after the text; the header sparkle swaps to a stop control.
 */

import { useEffect, useState } from 'react';
import {
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputContentSizeChangeEventData,
} from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components';
import { PressableScale } from '@/features/projects';
import { colors, radius, spacing, typography } from '@/theme';

const MIN_BODY_HEIGHT = 72;

export type CanvasNoteProps = {
  color: string;
  title: string;
  content: string;
  aiGenerating: boolean;
  aiActive: boolean;
  showDelete?: boolean;
  onChangeTitle: (text: string) => void;
  onChangeContent: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onOpenAI: () => void;
  onStopAI: () => void;
  onDelete?: () => void;
};

function ShimmerCursor(): React.JSX.Element {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.15, { duration: 480 }), withTiming(1, { duration: 480 })),
      -1,
      false,
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View accessibilityLabel="Generating" style={[styles.shimmer, style]} />;
}

export function CanvasNote({
  color,
  title,
  content,
  aiGenerating,
  aiActive,
  showDelete,
  onChangeTitle,
  onChangeContent,
  onFocus,
  onBlur,
  onOpenAI,
  onStopAI,
  onDelete,
}: CanvasNoteProps): React.JSX.Element {
  const [bodyHeight, setBodyHeight] = useState<number | null>(null);

  function handleContentSizeChange(
    event: NativeSyntheticEvent<TextInputContentSizeChangeEventData>,
  ): void {
    setBodyHeight(event.nativeEvent.contentSize.height);
  }

  return (
    <View style={styles.inner}>
      <View style={styles.header}>
        <View
          accessibilityElementsHidden
          importantForAccessibility="no"
          pointerEvents="none"
          style={[styles.dot, { backgroundColor: color }]}
        />
        <TextInput
          value={title}
          onChangeText={onChangeTitle}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Title"
          placeholderTextColor={colors.textMuted}
          selectTextOnFocus
          style={styles.titleInput}
        />
        <PressableScale
          accessibilityLabel={aiGenerating ? 'Stop AI generation' : 'Open AI actions'}
          onPress={aiGenerating ? onStopAI : onOpenAI}
          scaleTo={0.9}
          style={[styles.aiButton, aiActive && !aiGenerating ? styles.aiButtonActive : null]}
        >
          <Icon
            name={aiGenerating ? 'stop' : 'sparkles'}
            size={15}
            color={aiGenerating ? colors.danger : colors.accent}
          />
        </PressableScale>
        {showDelete && onDelete && !aiGenerating ? (
          <PressableScale
            accessibilityLabel="Delete note"
            onPress={onDelete}
            scaleTo={0.9}
            style={styles.deleteButton}
            hitSlop={8}
          >
            <Icon name="trash" size={15} color={colors.danger} />
          </PressableScale>
        ) : null}
      </View>
      <TextInput
        value={content}
        onChangeText={onChangeContent}
        onFocus={onFocus}
        onBlur={onBlur}
        onContentSizeChange={handleContentSizeChange}
        placeholder="Write something…"
        placeholderTextColor={colors.textMuted}
        editable={!aiGenerating}
        multiline
        textAlignVertical="top"
        style={[
          styles.bodyInput,
          bodyHeight === null ? null : { height: Math.max(bodyHeight, MIN_BODY_HEIGHT) },
        ]}
      />
      {aiGenerating ? <ShimmerCursor /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inner: {
    paddingLeft: spacing.sm,
    paddingRight: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  titleInput: {
    ...typography.bodyMedium,
    color: colors.text,
    padding: 0,
    flex: 1,
    backgroundColor: colors.transparent,
  },
  aiButton: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    flexShrink: 0,
  },
  aiButtonActive: {
    backgroundColor: colors.accentSoft,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerSoft,
    flexShrink: 0,
  },
  bodyInput: {
    ...typography.caption,
    color: colors.textSecondary,
    padding: 0,
    minHeight: MIN_BODY_HEIGHT,
    backgroundColor: colors.transparent,
  },
  shimmer: {
    width: 9,
    height: 16,
    borderRadius: 2,
    backgroundColor: colors.accent,
    alignSelf: 'flex-start',
  },
});
