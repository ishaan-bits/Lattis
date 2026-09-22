/**
 * FabButton — floating "+" that opens the create-project sheet.
 *
 * Morphs (rotates 45° into an ✕-like state) while the sheet is open and
 * scales on press, all driven by Reanimated springs.
 */

import { useEffect } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Icon } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme';

import { PressableScale } from './PressableScale';

export type FabButtonProps = {
  onPress: () => void;
  /** True while the create sheet is open — rotates the glyph 45°. */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Accessibility label. Defaults to "Create project". */
  label?: string;
};

export function FabButton({
  onPress,
  active = false,
  style,
  label = 'Create project',
}: FabButtonProps): React.JSX.Element {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withSpring(active ? 45 : 0, { damping: 15, stiffness: 180 });
  }, [active, rotation]);

  const morphStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(400).duration(400)} style={[styles.host, style]}>
      <Animated.View style={morphStyle}>
        <PressableScale accessibilityLabel={label} onPress={onPress} style={styles.fab}>
          <Icon name="plus" size={26} color={colors.textInverse} />
        </PressableScale>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },
});
