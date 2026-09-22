/**
 * TypingCursor — blinking block cursor appended while a reply streams.
 */

import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, spacing } from '@/theme';

export function TypingCursor(): React.JSX.Element {
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

  return <Animated.View accessibilityLabel="Generating" style={[styles.cursor, style]} />;
}

const styles = StyleSheet.create({
  cursor: {
    width: 9,
    height: 16,
    marginTop: spacing.xs,
    borderRadius: 2,
    backgroundColor: colors.accent,
  },
});
