/**
 * TypingIndicator — animated three-dot bubble shown while the AI streams.
 */

import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, radius, spacing } from '@/theme';

function Dot({ delay }: { delay: number }): React.JSX.Element {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(1, { duration: 320 }), withTiming(0.3, { duration: 320 })),
        -1,
        false,
      ),
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <Animated.View style={[styles.dot, style]} />;
}

export function TypingIndicator(): React.JSX.Element {
  return (
    <Animated.View
      entering={FadeIn.duration(180)}
      exiting={FadeOut.duration(120)}
      accessibilityLabel="Assistant is typing"
      style={styles.row}
    >
      <View style={styles.bubble}>
        <Dot delay={0} />
        <Dot delay={160} />
        <Dot delay={320} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignSelf: 'flex-start',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.textSecondary,
  },
});
