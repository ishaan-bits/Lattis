/**
 * EmptyProjects — illustrated empty state for the projects grid.
 */

import { StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Button, Text } from '@/components';
import { colors, spacing } from '@/theme';

export type EmptyProjectsProps = {
  onCreate: () => void;
};

function Illustration(): React.JSX.Element {
  return (
    <Svg width={180} height={140} viewBox="0 0 180 140" accessibilityLabel="Empty workspace">
      {/* Back cards */}
      <Rect
        x={44}
        y={28}
        width={92}
        height={64}
        rx={14}
        fill={colors.surface}
        stroke={colors.border}
        strokeWidth={1.5}
        opacity={0.55}
        transform="rotate(-8 90 60)"
      />
      <Rect
        x={48}
        y={34}
        width={92}
        height={64}
        rx={14}
        fill={colors.surface}
        stroke={colors.border}
        strokeWidth={1.5}
        opacity={0.8}
        transform="rotate(5 94 66)"
      />
      {/* Front card */}
      <Rect
        x={40}
        y={44}
        width={100}
        height={70}
        rx={16}
        fill={colors.surfaceElevated}
        stroke={colors.primary}
        strokeWidth={1.5}
      />
      <Rect x={56} y={62} width={44} height={8} rx={4} fill={colors.primary} opacity={0.7} />
      <Rect x={56} y={78} width={68} height={6} rx={3} fill={colors.border} />
      <Rect x={56} y={90} width={52} height={6} rx={3} fill={colors.border} />
      {/* Sparkles */}
      <Path
        d="M148 30l2.4 5.6L156 38l-5.6 2.4L148 46l-2.4-5.6L140 38l5.6-2.4z"
        fill={colors.accent}
      />
      <Circle cx={34} cy={40} r={4} fill={colors.warning} opacity={0.85} />
      <Circle cx={150} cy={100} r={5} fill={colors.success} opacity={0.7} />
    </Svg>
  );
}

export function EmptyProjects({ onCreate }: EmptyProjectsProps): React.JSX.Element {
  return (
    <Animated.View entering={FadeInUp.duration(450)} style={styles.root}>
      <Illustration />
      <View style={styles.copy}>
        <Text variant="subtitle" style={styles.title}>
          Your ideas deserve structure.
        </Text>
        <Text variant="body" color="textSecondary" style={styles.body}>
          Create your first project to start organizing notes, tasks, and threads on a visual
          canvas.
        </Text>
      </View>
      <Button label="Create Project" onPress={onCreate} size="lg" style={styles.cta} />
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
