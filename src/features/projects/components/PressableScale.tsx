/**
 * PressableScale — press feedback wrapper (scale 0.97) shared by cards,
 * swatches, and the FAB so every touchable feels identical.
 */

import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Scale target while pressed. Defaults to 0.97. */
  scaleTo?: number;
  children?: React.ReactNode;
};

export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps): React.JSX.Element {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      onPressIn={(event) => {
        // Shared-value mutation is intentional for Reanimated; React Compiler doesn't track it.
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 500 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        // eslint-disable-next-line react-hooks/immutability
        scale.value = withSpring(1, { damping: 18, stiffness: 400 });
        onPressOut?.(event);
      }}
      style={[animatedStyle, style]}
    >
      {children}
    </AnimatedPressable>
  );
}
