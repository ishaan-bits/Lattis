/**
 * EmptyThreads — illustrated empty state for the threads list.
 */

import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Button, Text } from '@/components';
import { colors, spacing } from '@/theme';

export type EmptyThreadsProps = {
  onCreate: () => void;
};

function Illustration(): React.JSX.Element {
  return (
    <Svg width={180} height={140} viewBox="0 0 180 140" accessibilityLabel="Empty threads">
      {/* Back bubble */}
      <Rect
        x={36}
        y={28}
        width={88}
        height={56}
        rx={16}
        fill={colors.surface}
        stroke={colors.border}
        strokeWidth={1.5}
        opacity={0.6}
        transform="rotate(-6 80 56)"
      />
      <Path
        d="M52 78l-8 16 20-10z"
        fill={colors.surface}
        opacity={0.6}
        transform="rotate(-6 80 56)"
      />
      {/* Front bubble */}
      <Rect
        x={48}
        y={52}
        width={96}
        height={60}
        rx={16}
        fill={colors.surfaceElevated}
        stroke={colors.primary}
        strokeWidth={1.5}
      />
      <Path
        d="M70 110l-6 16 20-12z"
        fill={colors.surfaceElevated}
        stroke={colors.primary}
        strokeWidth={1.5}
      />
      <Rect x={64} y={70} width={48} height={8} rx={4} fill={colors.primary} opacity={0.7} />
      <Rect x={64} y={86} width={64} height={6} rx={3} fill={colors.border} />
      {/* Sparkles */}
      <Path
        d="M150 36l2.4 5.6L158 44l-5.6 2.4L150 52l-2.4-5.6L142 44l5.6-2.4z"
        fill={colors.accent}
      />
      <Circle cx={30} cy={44} r={4} fill={colors.warning} opacity={0.85} />
      <Circle cx={154} cy={104} r={5} fill={colors.success} opacity={0.7} />
    </Svg>
  );
}

export function EmptyThreads({ onCreate }: EmptyThreadsProps): React.JSX.Element {
  return (
    <Animated.View entering={FadeInUp.duration(450)} style={styles.root}>
      <Illustration />
      <View style={styles.copy}>
        <Text variant="subtitle" style={styles.title}>
          Start the conversation.
        </Text>
        <Text variant="body" color="textSecondary" style={styles.body}>
          Threads keep your project&apos;s discussions organized in one place.
        </Text>
      </View>
      <Button label="New Thread" onPress={onCreate} size="lg" style={styles.cta} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.sm,
  },
  copy: {
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: 300,
  },
  title: {
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  body: {
    textAlign: 'center',
  },
  cta: {
    minWidth: 200,
  },
});
